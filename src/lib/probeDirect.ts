// ZGo API Doctor —— 浏览器直连探测（零信任模式）
// ============================================================
// 这个文件是整个项目唯一必需的「引擎」：请求从**浏览器直接发往用户填的
// Base URL**，API Key 只会出现在发往目标接口的请求头里，**不经过任何服务器**。
// 这是打消「偷偷用 Key」疑虑的核心手段——用户在 DevTools → Network
// 能亲眼看到请求只打到他自己的域名。
//
// 探测流程、评分规则、协议映射都是纯前端的，不依赖任何后端服务。
// ============================================================

import type {
  Protocol,
  DiscoverResult,
  DiscoveredModel,
  KeyAuth,
  ProbeRequest,
  ProbeSummary,
  ProbeResult,
  ProbeCheck,
} from './api';

// ---------------- 协议归一化 ----------------
export function normalizeProtocol(protocol: string): Protocol {
  const p = (protocol || 'openai').trim().toLowerCase();
  if (p === 'claude' || p === 'anthropic') return 'anthropic';
  if (p === 'google' || p === 'gemini' || p === 'google-gemini') return 'gemini';
  if (p === 'mistral' || p === 'mistral-ai') return 'mistral';
  if (p === 'cohere' || p === 'command') return 'cohere';
  return 'openai';
}

// ---------------- 认证头 ----------------
export function protocolHeaders(protocol: Protocol, apiKey: string): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json' };
  const key = (apiKey || '').trim();
  const p = normalizeProtocol(protocol);
  if (!key) return h;
  if (p === 'anthropic') {
    h['x-api-key'] = key;
    h['anthropic-version'] = '2023-06-01';
  } else if (p === 'gemini') {
    h['x-goog-api-key'] = key;
  } else {
    h['Authorization'] = 'Bearer ' + key;
  }
  return h;
}

// 探测用的归一化 Base URL（与后端 _doctor_models_url 一致：缺 /v1 则补）
export function modelsBaseUrl(baseUrl: string): string {
  const clean = (baseUrl || '').trim().replace(/\/+$/, '');
  return clean.endsWith('/v1') ? clean : clean + '/v1';
}

// 推导多个候选 /models 端点（与后端 _candidate_models_urls 一致）
export function candidateModelsUrls(baseUrl: string, protocol: Protocol, apiKey: string): string[] {
  const raw = (baseUrl || '').trim().replace(/\/+$/, '');
  const p = normalizeProtocol(protocol);
  const candidates: string[] = [];
  const seen = new Set<string>();
  const add = (u: string) => {
    if (u && !seen.has(u)) {
      seen.add(u);
      candidates.push(u);
    }
  };
  add(raw + '/models');
  if (raw.endsWith('/v1') || raw.endsWith('/v1beta')) {
    const root = raw.slice(0, raw.lastIndexOf('/'));
    add(root + '/models');
    add(root + '/v1/models');
  }
  if (raw.endsWith('/anthropic')) {
    add(raw.slice(0, -'/anthropic'.length) + '/models');
    add(raw.slice(0, -'/anthropic'.length) + '/v1/models');
    add(raw + '/v1/models');
  }
  if (!raw.endsWith('/v1') && !raw.endsWith('/v1beta') && !raw.endsWith('/anthropic')) {
    add(raw + '/v1/models');
  }
  if (p === 'gemini') {
    const key = (apiKey || '').trim();
    return candidates.map((c) => c + (key ? '?key=' + key : ''));
  }
  return candidates;
}

// ---------------- 聊天端点 ----------------
export function protocolChatUrl(base: string, protocol: Protocol, model: string): string {
  const p = normalizeProtocol(protocol);
  const b = (base || '').replace(/\/+$/, '');
  if (p === 'anthropic') return b + '/messages';
  if (p === 'gemini') {
    const m = model.split(':')[0];
    return b + '/models/' + m + ':generateContent';
  }
  return b + '/chat/completions';
}

function protocolChatBody(protocol: Protocol, model: string, prompt: string, maxTokens = 8): Record<string, unknown> {
  const p = normalizeProtocol(protocol);
  if (p === 'anthropic') return { model, max_tokens: Math.max(1, Math.min(maxTokens, 1024)), messages: [{ role: 'user', content: prompt }] };
  if (p === 'gemini') return { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: Math.max(1, Math.min(maxTokens, 1024)), temperature: 0 } };
  if (p === 'cohere') return { model, message: prompt, max_tokens: Math.max(1, Math.min(maxTokens, 1024)), stream: false, preamble: '' };
  return { model, messages: [{ role: 'user', content: prompt }], temperature: 0, max_tokens: maxTokens, stream: false };
}

function protocolStreamBody(protocol: Protocol, model: string, prompt: string): Record<string, unknown> {
  const p = normalizeProtocol(protocol);
  if (p === 'anthropic') return { model, max_tokens: Math.max(1, Math.min(8, 1024)), messages: [{ role: 'user', content: prompt }], stream: true };
  if (p === 'gemini') return { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: Math.max(1, Math.min(8, 1024)), temperature: 0 } };
  if (p === 'cohere') return { model, message: prompt, max_tokens: Math.max(1, Math.min(8, 1024)), stream: true };
  return { model, messages: [{ role: 'user', content: prompt }], temperature: 0, max_tokens: 8, stream: true };
}

function extractContent(payload: unknown, protocol: Protocol): string | null {
  const p = normalizeProtocol(protocol);
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;
  try {
    if (p === 'anthropic') {
      const content = (obj as any).content;
      return content?.[0]?.text ?? null;
    }
    if (p === 'gemini') {
      const cands = (obj as any).candidates;
      return cands?.[0]?.content?.parts?.[0]?.text ?? null;
    }
    if (p === 'cohere') {
      return typeof (obj as any).text === 'string' ? (obj as any).text : null;
    }
    const choices = obj.choices;
    if (Array.isArray(choices) && choices.length && typeof choices[0] === 'object') {
      const msg = (choices[0] as any).message;
      if (msg && typeof msg.content === 'string') return msg.content;
      if (msg && typeof msg.content !== 'undefined') return msg.content ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

function streamDoneFn(line: string, protocol: Protocol): boolean {
  const p = normalizeProtocol(protocol);
  const data = line.trim();
  if (p === 'anthropic' || p === 'gemini') {
    return data.endsWith('message_stop') || data.endsWith('"contentBlockIndex"');
  }
  if (p === 'cohere') {
    return data.endsWith('message-end') || data.includes('[DONE]');
  }
  return data === '[DONE]';
}

// ---------------- 小工具 ----------------
function now(): number {
  return performance.now();
}

function notRun(message: string): ProbeCheck {
  return { ok: false, code: 'not_run', message, latency_ms: 0 };
}

function probeError(code: string, message: string, latencyMs: number, statusCode?: number): ProbeCheck {
  const r: ProbeCheck = { ok: false, code, message, latency_ms: latencyMs };
  if (statusCode != null) r.status_code = statusCode;
  return r;
}

// 直连探测必须自带超时：浏览器 fetch 默认永不超时，一旦目标挂住、或 SSE 流迟迟
// 不结束，页面会永远停在「检测中」且没有任何报错。取值与后端 httpx 口径对齐：
// 发现模型 8s（Timeout(8.0, connect=4.0)），Chat / SSE 探测 12s（Timeout(12.0, connect=4.0)）。
const DISCOVER_TIMEOUT_MS = 8000;
const PROBE_TIMEOUT_MS = 12000;

function isAbort(e: unknown): boolean {
  return e instanceof Error && (e.name === 'AbortError' || e.name === 'TimeoutError');
}

// ---------------- 发现模型（直连） ----------------
export async function discoverDirect(baseUrl: string, apiKey: string, protocol: Protocol = 'openai', verifyKey: boolean = false): Promise<DiscoverResult> {
  const p = normalizeProtocol(protocol);
  const headers = protocolHeaders(p, apiKey);
  const candidates = candidateModelsUrls(baseUrl, p, apiKey);
  if (!candidates.length) {
    return { ok: false, code: 'bad_url', message: '无法解析该 Base URL', endpoint: '', latency_ms: 0, models: [] };
  }
  const startAll = now();
  let fallback: [string, number] | null = null;
  for (let idx = 0; idx < candidates.length; idx++) {
    const modelsUrl = candidates[idx];
    const started = now();
    let response: Response;
    try {
      response = await fetch(modelsUrl, { method: 'GET', headers, signal: AbortSignal.timeout(DISCOVER_TIMEOUT_MS) });
    } catch (e) {
      if (isAbort(e)) {
        return {
          ok: false,
          code: 'timeout',
          message: `模型列表请求超时（已连接但 ${DISCOVER_TIMEOUT_MS / 1000}s 未响应，或接口卡死）`,
          endpoint: modelsUrl,
          latency_ms: Math.round(now() - startAll),
          models: [],
        };
      }
      // 浏览器区分不了 CORS 拦截与网络不可达，二者均抛 TypeError
      return {
        ok: false,
        code: 'cors_error',
        message: '无法连接目标接口（可能是跨域 CORS 限制或网络不可达）。这是浏览器安全策略，不是接口本身的问题 —— 解决办法见 README 常见问题。',
        endpoint: modelsUrl,
        latency_ms: Math.round(now() - startAll),
        models: [],
      };
    }
    const status = response.status;
    if (status === 404) {
      if (idx === candidates.length - 1 && !fallback) {
        return { ok: false, code: 'http_error', message: '模型列表返回 HTTP 404，请确认该接口是否提供 /models 端点', endpoint: modelsUrl, status_code: 404, latency_ms: Math.round(now() - startAll), models: [] };
      }
      continue;
    }
    if (!fallback) fallback = [modelsUrl, status];
    const latency = Math.round(now() - started);
    if (status < 200 || status >= 300) {
      let msg = `模型列表返回 HTTP ${status}`;
      if (status === 401) msg = 'API Key 无效、已过期或未传入';
      else if (status === 403) msg = 'API Key 缺少调用权限';
      else if (status === 429) msg = '接口触发限流或额度不足';
      return { ok: false, code: 'http_error', message: msg, endpoint: modelsUrl, status_code: status, latency_ms: latency, models: [] };
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { ok: false, code: 'invalid_json', message: '模型列表不是有效 JSON', endpoint: modelsUrl, status_code: status, latency_ms: latency, models: [] };
    }
    const rawModels = payload && typeof payload === 'object' ? (payload as any).data : [];
    const models: DiscoveredModel[] = [];
    const seen = new Set<string>();
    for (const item of Array.isArray(rawModels) ? rawModels : []) {
      const id = item && typeof item === 'object' ? (item as any).id : item;
      if (typeof id !== 'string' || !id.trim() || seen.has(id.trim())) continue;
      const mid = id.trim();
      seen.add(mid);
      models.push({ id: mid, owned_by: (item && typeof item === 'object' && (item as any).owned_by) || 'unknown' });
    }
    // 端点 200 但无模型：继续试下一个候选，避免 ok/model_count:0 误报
    if (!models.length) {
      if (idx === candidates.length - 1) {
        return { ok: false, code: 'empty_models', message: '接口连接成功，但未返回任何可用模型（可能 Base URL 不完整，如缺少 /v1 或 /openai/v1）', endpoint: modelsUrl, status_code: status, latency_ms: latency, models: [] };
      }
      continue;
    }
    // 默认不校验 Key（verifyKey=false），让模型目录秒出；显式传 true 才发聊天冒烟
    let keyAuth: KeyAuth = { status: 'unknown', detail: '尚未校验 API Key，点击「验证 Key」进行校验' };
    if (apiKey && apiKey.trim()) {
      if (verifyKey) {
        keyAuth = await keySmoke(modelsBaseUrl(baseUrl), apiKey, p, models[0].id);
      }
    } else {
      keyAuth = { status: 'unknown', detail: '未提供 API Key，跳过有效性校验' };
    }
    return { ok: true, code: 'ok', message: '模型列表获取成功', endpoint: modelsUrl, status_code: status, latency_ms: latency, model_count: models.length, models, key_auth: keyAuth };
  }
  return { ok: false, code: 'not_found', message: '未找到可用的模型列表端点', endpoint: candidates[candidates.length - 1] || '', latency_ms: Math.round(now() - startAll), models: [] };
}

async function keySmoke(base: string, apiKey: string, protocol: Protocol, model: string): Promise<KeyAuth> {
  const p = normalizeProtocol(protocol);
  const url = protocolChatUrl(base, p, model);
  const headers = protocolHeaders(p, apiKey);
  const body = protocolChatBody(p, model, 'ping', 4);
  const started = now();
  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
  } catch (e) {
    if (isAbort(e)) return { status: 'unknown', detail: `聊天冒烟超时（${PROBE_TIMEOUT_MS / 1000}s 未响应）`, latency_ms: Math.round(now() - started) };
    return { status: 'unknown', detail: '聊天冒烟无法连接', latency_ms: Math.round(now() - started) };
  }
  const latency = Math.round(now() - started);
  if (response.status === 401) return { status: 'invalid', detail: 'API Key 无效、已过期或未传入', latency_ms: latency, status_code: 401 };
  if (response.status === 403) return { status: 'invalid', detail: 'API Key 没有调用模型的权限', latency_ms: latency, status_code: 403 };
  if (response.status > 401 && response.status < 500) return { status: 'reachable', detail: `聊天冒烟返回 HTTP ${response.status}（key 可用，模型可能不存在）`, latency_ms: latency, status_code: response.status };
  if (response.status >= 500) return { status: 'reachable', detail: `聊天冒烟返回 HTTP ${response.status}（上游瞬时错误，非 key 问题）`, latency_ms: latency, status_code: response.status };
  try {
    const payload = await response.json();
    const content = extractContent(payload, p);
    if (typeof content === 'string') return { status: 'valid', detail: 'API Key 有效，模型可正常调用', latency_ms: latency, status_code: response.status };
    return { status: 'reachable', detail: '聊天冒烟返回 2xx 但无正文（key 可用）', latency_ms: latency, status_code: response.status };
  } catch {
    return { status: 'reachable', detail: '聊天冒烟返回非 JSON（key 可用）', latency_ms: latency, status_code: response.status };
  }
}

// ---------------- 受控探测（直连） ----------------
async function chatProbe(base: string, headers: Record<string, string>, model: string, protocol: Protocol): Promise<ProbeCheck> {
  const p = normalizeProtocol(protocol);
  const url = protocolChatUrl(base, p, model);
  const body = protocolChatBody(p, model, 'Reply with pong only.', 8);
  const started = now();
  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
  } catch (e) {
    if (isAbort(e)) return { ok: false, code: 'timeout', message: `非流式请求超时（${PROBE_TIMEOUT_MS / 1000}s 未返回完整响应）`, latency_ms: Math.round(now() - started) };
    return { ok: false, code: 'network_error', message: '非流式请求无法连接', latency_ms: Math.round(now() - started), detail: (e as Error)?.name };
  }
  const latency = Math.round(now() - started);
  if (response.status >= 400) return probeError('http_error', `非流式请求返回 HTTP ${response.status}`, latency, response.status);
  let payload: any;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, code: 'invalid_json', message: '非流式响应不是有效 JSON', latency_ms: latency, status_code: response.status };
  }
  const content = extractContent(payload, p);
  if (typeof content !== 'string') return { ok: false, code: 'invalid_response', message: '响应缺少正文内容', latency_ms: latency, status_code: response.status };
  const usage = payload && typeof payload === 'object' ? payload.usage : null;
  return {
    ok: true,
    code: 'ok',
    message: '非流式响应正常',
    latency_ms: latency,
    status_code: response.status,
    content_preview: content.slice(0, 80),
    usage: usage && typeof usage === 'object' ? usage : null,
    reported_model: payload && typeof payload === 'object' ? payload.model : null,
  };
}

async function streamProbe(base: string, headers: Record<string, string>, model: string, protocol: Protocol): Promise<ProbeCheck> {
  const p = normalizeProtocol(protocol);
  const url = protocolChatUrl(base, p, model);
  const body = protocolStreamBody(p, model, 'Reply with pong only.');
  const started = now();
  let firstByte: number | null = null;
  let chunks = 0;
  let done = false;
  let timedOut = false;
  try {
    const response = await fetch(url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
    if (response.status >= 400) return probeError('http_error', `流式请求返回 HTTP ${response.status}`, Math.round(now() - started), response.status);
    if (!response.body) return { ok: false, code: 'incomplete_stream', message: '流式响应无正文', latency_ms: Math.round(now() - started) };
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    // 跨域流式：用 fetch + ReadableStream 逐行解析 SSE（比 EventSource 支持 POST 与自定义头）
    while (true) {
      // 墙钟兜底：即使 signal 未被浏览器及时中断 body，也按时跳出，避免永久卡住
      if (now() - started > PROBE_TIMEOUT_MS) { timedOut = true; break; }
      const { value, done: streamDone } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (firstByte === null && line.trim()) firstByte = Math.round(now() - started);
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data === '[DONE]') done = true;
          else if (data) chunks++;
        } else if (line.trim()) {
          if (streamDoneFn(line, p)) done = true;
          else if (line.includes('{')) chunks++;
        }
      }
    }
  } catch (e) {
    if (isAbort(e)) return { ok: false, code: 'timeout', message: `流式请求超时（${PROBE_TIMEOUT_MS / 1000}s 未完成）`, latency_ms: Math.round(now() - started), first_byte_ms: firstByte, chunks };
    return { ok: false, code: 'network_error', message: '流式请求无法连接', latency_ms: Math.round(now() - started), detail: (e as Error)?.name };
  }
  const latency = Math.round(now() - started);
  if (timedOut) return { ok: false, code: 'timeout', message: `流式响应超时（${PROBE_TIMEOUT_MS / 1000}s 未收到结束标记）`, latency_ms: latency, first_byte_ms: firstByte, chunks };
  if (!done) return { ok: false, code: 'incomplete_stream', message: '流式响应未收到结束标记', latency_ms: latency, first_byte_ms: firstByte, chunks };
  return { ok: true, code: 'ok', message: '流式响应正常', latency_ms: latency, first_byte_ms: firstByte, chunks, done: true };
}

function summarize(results: ProbeResult[], base: string): ProbeSummary {
  const healthy = results.filter((r) => r.status === 'healthy').length;
  const degraded = results.filter((r) => r.status === 'degraded').length;
  const score = results.length ? Math.round((healthy * 100 + degraded * 65) / results.length) : 0;
  return { ok: true, code: 'ok', endpoint: base, model_count: results.length, healthy_count: healthy, degraded_count: degraded, score, results };
}

export async function probeDirect(req: ProbeRequest): Promise<ProbeSummary> {
  const models = Array.from(new Set((req.models || []).map((m) => m.trim()).filter(Boolean))).slice(0, 100);
  if (!models.length) throw new Error('models must contain at least one model id');
  if (!req.chat_enabled && !req.sse_enabled) throw new Error('at least one probe type must be enabled');
  const base = modelsBaseUrl(req.base_url);
  const protocol = normalizeProtocol(req.protocol ?? 'openai');
  const headers = protocolHeaders(protocol, req.api_key);
  const results: ProbeResult[] = [];
  for (const model of models) {
    const chat = req.chat_enabled ? await chatProbe(base, headers, model, protocol) : notRun('未选择 Chat 检测');
    const stream = req.sse_enabled ? await streamProbe(base, headers, model, protocol) : notRun('未选择 SSE 检测');
    const checks = [chat, stream].filter((c) => c.code !== 'not_run');
    const successful = checks.filter((c) => c.ok).length;
    let status: ProbeResult['status'];
    let grade: ProbeResult['grade'];
    if (successful === checks.length && successful) {
      status = 'healthy';
      grade = 'A';
    } else if (successful) {
      status = 'degraded';
      grade = 'B';
    } else {
      status = 'down';
      grade = 'F';
    }
    results.push({ model, status, grade, chat, stream });
  }
  return summarize(results, base);
}

// ---------------- 预检：将发送的请求（#4 透明度） ----------------
export interface PreflightRequest {
  kind: 'GET /models' | 'Chat' | 'SSE';
  method: 'GET' | 'POST';
  url: string;
  headers: Record<string, string>;
  body?: string;
}

function maskHeaders(h: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) {
    if (/^(authorization|x-api-key|x-goog-api-key)$/i.test(k)) {
      out[k] = v.length > 7 ? `${v.slice(0, 3)}••••${v.slice(-4)}` : '••••';
    } else {
      out[k] = v;
    }
  }
  return out;
}

function maskUrlKey(url: string): string {
  return url.replace(/([?&]key=)[^&]+/i, '$1***');
}

/** 生成「即将发送」的请求清单（Key 一律脱敏），用于预检预览面板。 */
export function buildPreflight(
  baseUrl: string,
  apiKey: string,
  protocol: Protocol,
  models: string[],
  chatEnabled: boolean,
  sseEnabled: boolean,
): PreflightRequest[] {
  const p = normalizeProtocol(protocol);
  const out: PreflightRequest[] = [];
  const cands = candidateModelsUrls(baseUrl, p, apiKey);
  const discoverUrl = maskUrlKey(cands[0] || modelsBaseUrl(baseUrl) + '/models');
  out.push({
    kind: 'GET /models',
    method: 'GET',
    url: discoverUrl,
    headers: maskHeaders(protocolHeaders(p, apiKey)),
  });
  const base = modelsBaseUrl(baseUrl);
  for (const model of models) {
    if (chatEnabled) {
      out.push({
        kind: 'Chat',
        method: 'POST',
        url: protocolChatUrl(base, p, model),
        headers: maskHeaders(protocolHeaders(p, apiKey)),
        body: JSON.stringify(protocolChatBody(p, model, 'Reply with pong only.', 8)),
      });
    }
    if (sseEnabled) {
      out.push({
        kind: 'SSE',
        method: 'POST',
        url: protocolChatUrl(base, p, model),
        headers: maskHeaders(protocolHeaders(p, apiKey)),
        body: JSON.stringify(protocolStreamBody(p, model, 'Reply with pong only.')),
      });
    }
  }
  return out;
}
