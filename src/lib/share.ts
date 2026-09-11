import type { DetectionReport, ProbedModelResult } from '../types';

// ============================================================
// 报告分享：把报告压缩为 URL-safe 的 base64 token，编码进 hash 查询
// 形如   #/report?d=<token>    →   分享后打开可还原只读报告
// 只编码能安全脱敏展示的字段；apiKeyMasked 已是掩码，不含明文。
// ============================================================

const TOKEN_MAX = 6000; // 超过则截断主体，避免 URL 过长被浏览器/平台截断

interface ShareModel {
  model: string;
  status: 'healthy' | 'degraded' | 'down';
  grade: 'A' | 'B' | 'F';
  chatOk: boolean;
  sseOk: boolean;
  chatLatencyMs: number;
  firstByteMs: number | null;
  chunks: number;
  chatPreview: string;
  errorMessage: string;
  errorCode: string;
}

interface SharePayload {
  v: 1;
  endpoint: string;
  baseUrl: string;
  apiKeyMasked: string;
  timestamp: string;
  score: number;
  healthyCount: number;
  degradedCount: number;
  downCount: number;
  modelCount: number;
  protocol?: string;
  models: ShareModel[];
}

/** 压缩单个模型为分享精简结构（预览文案截断，避免 token 过长） */
function compressModel(m: ProbedModelResult): ShareModel {
  return {
    model: m.model,
    status: m.status,
    grade: m.grade,
    chatOk: m.chatOk,
    sseOk: m.sseOk,
    chatLatencyMs: m.chatLatencyMs,
    firstByteMs: m.firstByteMs,
    chunks: m.chunks,
    chatPreview: (m.chatPreview || '').slice(0, 120),
    errorMessage: (m.errorMessage || '').slice(0, 140),
    errorCode: m.errorCode,
  };
}

/** 把报告编码进 URL-safe token */
export function composeShareUrl(report: DetectionReport): string {
  const payload: SharePayload = {
    v: 1,
    endpoint: report.endpoint,
    baseUrl: report.baseUrl,
    apiKeyMasked: report.apiKeyMasked,
    timestamp: report.timestamp,
    score: report.score,
    healthyCount: report.healthyCount,
    degradedCount: report.degradedCount,
    downCount: report.downCount,
    modelCount: report.modelCount,
    protocol: report.protocol,
    models: (report.models || []).slice(0, 24).map(compressModel),
  };
  const json = JSON.stringify(payload);
  // 超长降级：模型过多或预览过长时，剔除超大 preview，仅保留空 preview
  let body = json;
  if (body.length > TOKEN_MAX) {
    const slim: SharePayload = { ...payload, models: payload.models.map((m) => ({ ...m, chatPreview: '', errorMessage: '' })) };
    body = JSON.stringify(slim);
  }
  const b64 = btoa(unescape(encodeURIComponent(body))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${location.origin}${location.pathname}#/report?d=${b64}`;
}

/** 从 hash 查询里解码分享报告，失败返回 null */
export function decodeShareToken(token: string): DetectionReport | null {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=');
    const json = decodeURIComponent(escape(atob(padded)));
    const p = JSON.parse(json) as SharePayload;
    if (!p || p.v !== 1) return null;
    return {
      endpoint: p.endpoint || '',
      baseUrl: p.baseUrl || '',
      apiKeyMasked: p.apiKeyMasked || '',
      timestamp: p.timestamp || new Date().toISOString(),
      score: p.score,
      healthyCount: p.healthyCount,
      degradedCount: p.degradedCount,
      downCount: p.downCount,
      modelCount: p.modelCount,
      protocol: p.protocol,
      models: (p.models || []).map((m) => ({
        model: m.model,
        status: m.status,
        grade: m.grade,
        chatOk: m.chatOk,
        sseOk: m.sseOk,
        chatLatencyMs: m.chatLatencyMs,
        firstByteMs: m.firstByteMs ?? null,
        chunks: m.chunks,
        chatPreview: m.chatPreview || '',
        errorMessage: m.errorMessage || '',
        errorCode: m.errorCode || '',
      })),
    };
  } catch {
    return null;
  }
}

/** 复制文本到剪贴板（带兜底：navigator.clipboard 不可用时用隐藏 textarea） */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 走兜底 */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
