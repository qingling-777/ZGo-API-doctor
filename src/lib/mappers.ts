import type {
  DetectionReport,
  ProbedModelResult,
  DetectionResult,
  LatencyBreakdown,
} from '../types';
import type { ProbeSummary, ProbeResult, DiscoveredModel } from './api';
import { t } from './i18n';

/** Map the raw probe results[] into the model rows used by the report */
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

/** Aggregate into a report (score + health counts) */
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

/** Display name: strip any trailing /v1 segment from a model id */
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
  if (id.includes('/')) return id.split('/')[0] || t('自定义', 'Custom');
  return 'OpenAI';
}

/** Deduplicate discovery results and turn them into UI options */
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

/** Compress one model's evidence into the DetectionResult used by the summary (latency derived from chat/stream) */
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
      name: t('Chat 通路', 'Chat path'),
      status: (r.chatOk ? 'pass' : 'fail') as 'pass' | 'fail' | 'warn',
      detail: r.chatOk
        ? t(`非流式请求成功 · ${r.chatLatencyMs}ms`, `Buffered request OK · ${r.chatLatencyMs}ms`)
        : r.errorMessage || t('请求失败', 'Request failed'),
    },
    {
      name: t('SSE 流式通路', 'SSE streaming path'),
      status: (r.sseOk ? 'pass' : r.chunks ? 'warn' : 'fail') as 'pass' | 'fail' | 'warn',
      detail: r.sseOk
        ? t(`流式请求成功 · ${r.chunks} chunks`, `Streaming request OK · ${r.chunks} chunks`)
        : r.chunks
        ? t('流式未完整结束', 'Stream ended prematurely')
        : t('流式请求失败', 'Streaming request failed'),
    },
  ];

  const issues = [];
  if (r.status === 'down') {
    issues.push({
      level: 'critical' as const,
      title: t('模型探测失败', 'Model probe failed'),
      detail: r.errorMessage || t('对话请求失败', 'The chat request failed'),
      metric: r.errorCode || 'down',
    });
  } else if (r.status === 'degraded') {
    issues.push({
      level: 'warning' as const,
      title: t('部分通路降级', 'Partially degraded'),
      detail: t('Chat 或 SSE 未完全通过', 'Chat and/or SSE did not fully pass'),
      metric: r.grade,
    });
  }
  if (r.firstByteMs && r.firstByteMs > 800) {
    issues.push({
      level: 'warning' as const,
      title: t('首字节延迟偏高', 'High time to first byte'),
      detail: t(
        `TTFT ${r.firstByteMs}ms 超过 P75 基准`,
        `TTFT ${r.firstByteMs}ms is above the 75th percentile baseline`
      ),
      metric: `${r.firstByteMs}ms`,
    });
  }
  if (issues.length === 0) {
    issues.push({
      level: 'healthy' as const,
      title: t('通路状态良好', 'All paths healthy'),
      detail: t('Chat 与 SSE 均通过', 'Both Chat and SSE passed'),
      metric: r.grade,
    });
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
    responsePreview: r.chatPreview || t('（无可用的响应预览）', '(no response preview available)'),
    tokensIn: 0,
    tokensOut: 0,
  };
}
