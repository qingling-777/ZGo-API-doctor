// ZGo API Doctor —— 探测协议类型与前端工具函数
//
// 本文件是上游 gateway 客户端（约 970 行）的**探测相关子集**：
// 只保留与「浏览器直连探测」有关的类型、协议定义与下载工具，
// 账号 / 支付 / 管理 / 密钥库等依赖后端的部分已全部移除。

export interface DiscoveredModel {
  id: string;
  owned_by?: string;
}

export interface KeyAuth {
  status: 'valid' | 'invalid' | 'reachable' | 'unknown';
  detail?: string;
  latency_ms?: number;
  status_code?: number;
}

export interface DiscoverResult {
  ok: boolean;
  code: string;
  message: string;
  endpoint: string;
  status_code?: number;
  latency_ms: number;
  model_count?: number;
  models: DiscoveredModel[];
  key_auth?: KeyAuth;
}

export interface ProbeCheck {
  ok: boolean;
  code: string;
  message: string;
  latency_ms: number;
  status_code?: number;
  content_preview?: string;
  usage?: Record<string, unknown> | null;
  reported_model?: string;
  first_byte_ms?: number | null;
  chunks?: number;
  done?: boolean;
  detail?: string;
}

export interface ProbeResult {
  model: string;
  status: 'healthy' | 'degraded' | 'down';
  grade: 'A' | 'B' | 'F';
  chat: ProbeCheck;
  stream: ProbeCheck;
}

export interface ProbeSummary {
  ok: boolean;
  code: string;
  endpoint: string;
  model_count: number;
  healthy_count: number;
  degraded_count: number;
  score: number;
  results: ProbeResult[];
}

export interface ProbeRequest {
  base_url: string;
  api_key: string;
  models: string[];
  chat_enabled?: boolean;
  sse_enabled?: boolean;
  protocol?: Protocol;
}

/** 一段可复制的接入示例（cURL / Python / Agent 配置片段） */
export interface SnippetItem {
  id: string;
  label: string;
  code: string;
}

export type Protocol = 'openai' | 'anthropic' | 'gemini' | 'mistral' | 'cohere';

export interface ProtocolDef {
  id: Protocol;
  label: string;
  hint: string;
  baseUrlExample: string;
}

export const PROTOCOLS: ProtocolDef[] = [
  { id: 'openai', label: 'OpenAI', hint: '/v1/chat/completions', baseUrlExample: 'https://api.openai.com/v1' },
  { id: 'anthropic', label: 'Anthropic', hint: '/v1/messages + x-api-key', baseUrlExample: 'https://api.anthropic.com/v1' },
  { id: 'gemini', label: 'Gemini', hint: '/v1/models/{m}:generateContent', baseUrlExample: 'https://generativelanguage.googleapis.com/v1beta' },
  { id: 'mistral', label: 'Mistral', hint: '/v1/chat/completions', baseUrlExample: 'https://api.mistral.ai/v1' },
  { id: 'cohere', label: 'Cohere', hint: '/v1/chat (native)', baseUrlExample: 'https://api.cohere.com/v1' },
];



/** 触发浏览器下载一个 Blob（命名 filename） */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
