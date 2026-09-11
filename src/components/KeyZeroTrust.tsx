import { useState } from 'react';
import { ShieldCheck, KeyRound, Copy, Check, Terminal } from 'lucide-react';
import { GITHUB_URL } from '../lib/site';

// 下面三段均摘自 src/lib/probeDirect.ts —— 请注意是**节选**，不是全文：
// 为便于在首页阅读，省略了 TS 类型标注、入参校验与循环体内的评分逻辑，
// 并用 ⬅ 标注关键行。请求目标与 Header 字段本身与线上版本一致。
// 目的：让用户能在首页直接核对「API Key 只发往自己的 Base URL」，
// 并可点开仓库里的 src/lib/probeDirect.ts 原文件逐行比对。
const CODE_BLOCKS: { file: string; note: string; code: string }[] = [
  {
    file: 'src/lib/probeDirect.ts · protocolHeaders()',
    note: 'Key 只被写进发往你域名的认证请求头',
    code: `export function protocolHeaders(protocol, apiKey) {
  const h = { Accept: 'application/json' };
  const key = (apiKey || '').trim();
  const p = normalizeProtocol(protocol);   // ⬅ 归一化：claude→anthropic、google→gemini
  if (!key) return h;
  if (p === 'anthropic') {
    h['x-api-key'] = key;             // ⬅ Key 只写进 x-api-key
    h['anthropic-version'] = '2023-06-01';
  } else if (p === 'gemini') {
    h['x-goog-api-key'] = key;        // ⬅ Key 只写进 x-goog-api-key
  } else {
    h['Authorization'] = 'Bearer ' + key; // ⬅ Key 只写进 Authorization
  }
  return h;   // 返回对象里没有任何字段指向 ZGo 服务器
}`,
  },
  {
    file: 'src/lib/probeDirect.ts · discoverDirect()',
    note: '请求目标 = 你自己的域名；代理模式如实告知',
    code: `// discoverDirect：浏览器直接请求你填的 Base URL
try {
  response = await fetch(modelsUrl, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(DISCOVER_TIMEOUT_MS),   // ⬅ 8s 自带超时
  });
} catch {
  // 浏览器分不清 CORS 拦截与网络不可达，二者都抛 TypeError
  return {
    ok: false,
    code: 'cors_error',
    message: '无法连接目标接口（可能是跨域 CORS 限制或网络不可达）。' +
             '这是浏览器安全策略，不是接口本身的问题 —— ' +
             '解决办法见 README 的常见问题。',
    endpoint: modelsUrl,   // ⬅ 请求目标 = 你自己的域名
  };
}`,
  },
  {
    file: 'src/lib/probeDirect.ts · probeDirect()',
    note: '每个模型的 Chat / SSE 探测都直连你的 Base URL',
    code: `export async function probeDirect(req) {
  const models = Array.from(new Set(req.models.map((m) => m.trim()).filter(Boolean))).slice(0, 100);
  const base = modelsBaseUrl(req.base_url);      // ⬅ 你的 Base URL
  const headers = protocolHeaders(req.protocol, req.api_key);
  const results = [];                            // ⬅ 结果只存在浏览器内存里
  for (const model of models) {
    const chat = req.chat_enabled
      ? await chatProbe(base, headers, model)    // ⬅ 直连你的域名
      : notRun('未选择 Chat 检测');
    const stream = req.sse_enabled
      ? await streamProbe(base, headers, model)  // ⬅ 直连你的域名
      : notRun('未选择 SSE 检测');
    results.push({ model, chat, stream });       // 评分逻辑见原文件
  }
  return summarize(results, base);
}`,
  },
];

const SELF_CHECK = [
  { step: '读代码', text: 'Key 只进入认证请求头，请求目标域名是你自己填的 Base URL。' },
  { step: '开 DevTools', text: 'Network 面板确认请求只打到你的 Base URL，Host 不含 ZGo 域名。' },
  { step: '看预检面板', text: '检测页「预检」逐条列出即将发送的请求，Key 全程脱敏显示。' },
];

export function KeyZeroTrust() {
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (code: string, i: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(i);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* 剪贴板不可用时忽略 */
    }
  };

  return (
    <section id="key-trust" className="relative py-20 lg:py-28" style={{ zIndex: 1 }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success-500/10 border border-success-500/20 backdrop-blur-sm mb-4">
            <span className="label-mono">Zero-Trust · 源码自证</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
            你的 API Key 去哪了？
          </h2>
          <p className="mt-4 text-ink-300 leading-relaxed">
            我们不做任何「后台偷偷用 Key」的事。下面是你浏览器里<strong className="text-ink-100">真实运行</strong>的探测代码
            （节选自 <code className="text-primary-300">src/lib/probeDirect.ts</code>，为便于阅读省略了类型标注与入参校验）。
            API Key 只会被放进发往「你自己填的 Base URL」的请求头里，
            永远不会发往 ZGo 的服务器。打开 DevTools → Network 即可逐条核对；
            也可直接到{' '}
            <a
              href={`${GITHUB_URL}/blob/main/src/lib/probeDirect.ts`}
              target="_blank"
              rel="noreferrer"
              className="text-primary-300 hover:text-primary-200 underline decoration-primary-300/40 underline-offset-2 transition-colors"
            >
              GitHub 上的原文件
            </a>{' '}
            逐行比对。
          </p>
        </div>

        <div className="space-y-4">
          {CODE_BLOCKS.map((block, i) => (
            <div key={block.file} className="glass overflow-hidden group">
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-ink-700/40">
                <div className="flex items-center gap-2 min-w-0">
                  <Terminal size={14} className="text-success-400 flex-shrink-0" />
                  <span className="label-mono text-ink-300 truncate">{block.file}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-2xs text-success-400 hidden sm:inline">{block.note}</span>
                  <button
                    type="button"
                    onClick={() => copy(block.code, i)}
                    className="inline-flex items-center gap-1 text-2xs text-ink-400 hover:text-ink-100 transition-colors"
                  >
                    {copied === i ? <Check size={13} className="text-success-400" /> : <Copy size={13} />}
                    {copied === i ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
              <pre className="bg-ink-950/60 backdrop-blur-sm border-x-0 border-b-0 border border-ink-700/40 p-4 text-2xs font-mono text-ink-200 leading-relaxed overflow-x-auto">
                <code>{block.code}</code>
              </pre>
            </div>
          ))}
        </div>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {SELF_CHECK.map((item) => (
            <div key={item.step} className="glass glass-hover p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-success-500/10 border border-success-500/20 flex items-center justify-center flex-shrink-0">
                <KeyRound size={16} className="text-success-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-50 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-success-400" />
                  {item.step}
                </h3>
                <p className="text-xs text-ink-400 mt-1 leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
