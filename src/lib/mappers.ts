import type {
  DetectionReport,
  ProbedModelResult,
  DetectionResult,
  LatencyBreakdown,
} from '../types';
import type { ProbeSummary, ProbeResult, DiscoveredModel } from './api';

/** 把 Gateway 返回的探测结果 results[] 映射为前端报告模型 */
export function toProbedResults(results: ProbeResult[]): ProbedModelResult[] {
  return results.map((item) => {
    const chat = item.chat || {};
    const stream = item.stream || {};
    const preview = typeof chat.content_preview === 'string' ? chat.content_preview : '';
    return {
      model: item.model,
      status: item.status,
      grade: item.grade,
      chatOk: chat.ok === true,
      sseOk: stream.ok === true,
      chatLatencyMs: typeof chat.latency_ms === 'number' ? chat.latency_ms : 0,
      firstByteMs: typeof stream.first_byte_ms === 'number' ? stream.first_byte_ms : null,
      chunks: typeof stream.chunks === 'number' ? stream.chunks : 0,
      chatPreview: preview,
      errorCode: chat.ok ? '' : (chat.code ?? ''),
      errorMessage: chat.ok ? '' : (chat.message ?? ''),
    };
  });
}

/** 汇总为报告（含评分/健康统计） */
export function toReport(
  summary: ProbeSummary,
  baseUrl: string,
  apiKeyMasked: string
): DetectionReport {
  const m = toProbedResults(summary.results);
  const healthyCount = m.filter((x) => x.status === 'healthy').length;
  const degradedCount = m.filter((x) => x.status === 'degraded').length;
  const downCount = m.filter((x) => x.status === 'down').length;
  return {
    endpoint: summary.endpoint,
    baseUrl,
    apiKeyMasked,
    timestamp: new Date().toISOString(),
    score: summary.score ?? 0,
    healthyCount,
    degradedCount,
    downCount,
    modelCount: m.length,
    models: m,
  };
}

/** 名称归一化：去掉 /v1 尾部的模型 id 展示名 */
export function modelName(id: string): string {
  if (!id) return '';
  const cleaned = id.replace(/\/v1(?:beta)?(\/|$)/i, '/').replace(/\/v1(?:beta)?$/i, '');
  const parts = cleaned.split('/').filter(Boolean);
  return parts[parts.length - 1] || cleaned;
}

export function monitorName(baseUrl: string): string {
  if (!baseUrl) return '';
  try {
    const url = new URL(baseUrl);
    return url.hostname || baseUrl;
  } catch {
    return baseUrl.replace(/\/v1(?:beta)?(\/|$)/i, '/').replace(/\/v1(?:beta)?$/i, '').replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
}

export function providerOf(id: string): string {
  if (id.includes('/')) return id.split('/')[0] || '自定义';
  return 'OpenAI';
}

/** 发现结果去重 + 转前端选项 */
export function discoveredToOptions(models: DiscoveredModel[]): { id: string; name: string; label: string; provider: string }[] {
  const seen = new Set<string>();
  const out: { id: string; name: string; label: string; provider: string }[] = [];
  for (const m of models) {
    if (!m.id || seen.has(m.id)) continue;
    seen.add(m.id);
    out.push({
      id: m.id,
      name: modelName(m.id),
      label: modelName(m.id),
      provider: providerOf(m.id),
    });
  }
  return out;
}

/** 把单个模型的探测证据压成首页/摘要用的 DetectionResult（延迟分解由 chat/stream 推导） */
export function probeResultToDetection(r: ProbedModelResult): DetectionResult {
  const firstByte = r.firstByteMs ?? r.chatLatencyMs;
  const streamDuration = Math.max(0, (r.chunks || 1) * (r.chatLatencyMs || 0) * 0.3 + firstByte);
  const latency: LatencyBreakdown = {
    dns: 0,
    tcp: 0,
    tls: 0,
    firstByte,
    streamDuration: Math.round(streamDuration),
    total: Math.round(firstByte + streamDuration),
  };
  const status = r.status === 'down' ? 'critical' : r.status;

  const safetyChecks = [
    {
      name: 'Chat 通路',
      status: (r.chatOk ? 'pass' : 'fail') as 'pass' | 'fail' | 'warn',
      detail: r.chatOk ? `非流式请求成功 · ${r.chatLatencyMs}ms` : (r.errorMessage || '请求失败'),
    },
    {
      name: 'SSE 流式通路',
      status: (r.sseOk ? 'pass' : r.chunks ? 'warn' : 'fail') as 'pass' | 'fail' | 'warn',
      detail: r.sseOk ? `流式请求成功 · ${r.chunks} chunks` : (r.chunks ? '流式未完整结束' : '流式请求失败'),
    },
  ];

  const issues = [];
  if (r.status === 'down') {
    issues.push({ level: 'critical' as const, title: '模型探测失败', detail: r.errorMessage || '对话请求失败', metric: r.errorCode || 'down' });
  } else if (r.status === 'degraded') {
    issues.push({ level: 'warning' as const, title: '部分通路降级', detail: 'Chat 或 SSE 未完全通过', metric: r.grade });
  }
  if (r.firstByteMs && r.firstByteMs > 800) {
    issues.push({ level: 'warning' as const, title: '首字节延迟偏高', detail: `TTFT ${r.firstByteMs}ms 超过 P75 基准`, metric: `${r.firstByteMs}ms` });
  }
  if (issues.length === 0) {
    issues.push({ level: 'healthy' as const, title: '通路状态良好', detail: 'Chat 与 SSE 均通过', metric: r.grade });
  }

  return {
    model: r.model,
    endpoint: r.model,
    apiKeyMasked: '',
    timestamp: new Date().toISOString(),
    status,
    overallScore: r.status === 'healthy' ? 100 : r.status === 'degraded' ? 65 : 30,
    latency,
    streamChunks: Array.from({ length: Math.min(24, Math.max(3, r.chunks)) }, (_, i) => ({
      index: i,
      content: '',
      latencyMs: Math.round(firstByte + i * 0.3 * (r.chatLatencyMs || 0)),
    })),
    safetyChecks,
    issues,
    responsePreview: r.chatPreview || '（无可用的响应预览）',
    tokensIn: 0,
    tokensOut: 0,
  };
}
