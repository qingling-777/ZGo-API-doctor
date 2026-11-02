import { useState } from 'react';
import { ShieldCheck, KeyRound, Copy, Check, Terminal } from 'lucide-react';
import { GITHUB_URL } from '../lib/site';
import { useI18n } from '../lib/i18n';

// The three blocks below are excerpts from src/lib/probeDirect.ts — excerpts,
// not the whole file: type annotations, argument validation and the scoring
// loop body are omitted so the page stays readable, and key lines are marked ⬅.
// Targets and header names match the real file exactly.
// The point: let a reader confirm on the home page that the API key only ever
// goes to their own Base URL, then open the original file and compare line by line.
// Localised strings are collapsed into constants here for readability.
const CODE_BLOCKS: { file: string; note: { zh: string; en: string }; code: string }[] = [
  {
    file: 'src/lib/probeDirect.ts · protocolHeaders()',
    note: { zh: 'Key 只被写进发往你域名的认证请求头', en: 'The key only ever lands in headers sent to your own host' },
    code: `export function protocolHeaders(protocol, apiKey) {
  const h = { Accept: 'application/json' };
  const key = (apiKey || '').trim();
  const p = normalizeProtocol(protocol);   // ⬅ alias mapping: claude->anthropic, google->gemini
  if (!key) return h;
  if (p === 'anthropic') {
    h['x-api-key'] = key;             // ⬅ the key goes here and nowhere else
    h['anthropic-version'] = '2023-06-01';
  } else if (p === 'gemini') {
    h['x-goog-api-key'] = key;        // ⬅ the key goes here and nowhere else
  } else {
    h['Authorization'] = 'Bearer ' + key; // ⬅ the key goes here and nowhere else
  }
  return h;   // nothing in this object points at a ZGo server
}`,
  },
  {
    file: 'src/lib/probeDirect.ts · discoverDirect()',
    note: { zh: '请求目标 = 你自己的域名', en: 'The request target is your own host' },
    code: `// discoverDirect: the browser calls the Base URL you typed
try {
  response = await fetch(modelsUrl, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(DISCOVER_TIMEOUT_MS),   // ⬅ 8s timeout, built in
  });
} catch {
  // A CORS block and an unreachable host both throw TypeError
  return {
    ok: false,
    code: 'cors_error',
    message: CORS_MESSAGE,   // localised; full text in the file
    endpoint: modelsUrl,     // ⬅ the target is your own host
  };
}`,
  },
  {
    file: 'src/lib/probeDirect.ts · probeDirect()',
    note: { zh: '每个模型的 Chat / SSE 探测都直连你的 Base URL', en: 'Every per-model Chat / SSE probe goes straight to your Base URL' },
    code: `export async function probeDirect(req) {
  const models = Array.from(new Set(req.models.map((m) => m.trim()).filter(Boolean))).slice(0, 100);
  const base = modelsBaseUrl(req.base_url);      // ⬅ your Base URL
  const headers = protocolHeaders(req.protocol, req.api_key);
  const results = [];                            // ⬅ results live in browser memory only
  for (const model of models) {
    const chat = req.chat_enabled
      ? await chatProbe(base, headers, model)    // ⬅ straight to your host
      : notRun(NO_CHAT);
    const stream = req.sse_enabled
      ? await streamProbe(base, headers, model)  // ⬅ straight to your host
      : notRun(NO_SSE);
    results.push({ model, chat, stream });       // scoring lives in the real file
  }
  return summarize(results, base);
}`,
  },
];

const SELF_CHECK = [
  {
    step: { zh: '读代码', en: 'Read the code' },
    text: {
      zh: 'Key 只进入认证请求头，请求目标域名是你自己填的 Base URL。',
      en: 'The key only enters auth headers, and the target host is the Base URL you typed.',
    },
  },
  {
    step: { zh: '开 DevTools', en: 'Open DevTools' },
    text: {
      zh: 'Network 面板确认请求只打到你的 Base URL，Host 不含 ZGo 域名。',
      en: 'The Network panel shows requests going only to your Base URL — no ZGo host anywhere.',
    },
  },
  {
    step: { zh: '看预检面板', en: 'Check the preflight panel' },
    text: {
      zh: '检测页「预检」逐条列出即将发送的请求，Key 全程脱敏显示。',
      en: 'The preflight panel lists every request before it is sent, with the key masked throughout.',
    },
  },
];

export function KeyZeroTrust() {
  const { t } = useI18n();
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
            <span className="label-mono">{t('Zero-Trust · 源码自证', 'ZERO-TRUST · READ THE SOURCE')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
            {t('你的 API Key 去哪了？', 'Where does your API key actually go?')}
          </h2>
          <p className="mt-4 text-ink-300 leading-relaxed">
            {t('我们不做任何「后台偷偷用 Key」的事。下面是你浏览器里', 'Nothing here quietly uses your key behind your back. Below is the probe code that ')}
            <strong className="text-ink-100">{t('真实运行', 'actually runs')}</strong>
            {t('的探测代码（节选自 ', ' in your browser (an excerpt from ')}
            <code className="text-primary-300">src/lib/probeDirect.ts</code>
            {t(
              '，为便于阅读省略了类型标注与入参校验）。API Key 只会被放进发往「你自己填的 Base URL」的请求头里，永远不会发往 ZGo 的服务器。打开 DevTools → Network 即可逐条核对；也可直接到',
              ' with type annotations and argument validation omitted for readability). The API key only ever goes into headers sent to the Base URL you entered — never to a ZGo server. Open DevTools → Network and check every request; or open'
            )}{' '}
            <a
              href={`${GITHUB_URL}/blob/main/src/lib/probeDirect.ts`}
              target="_blank"
              rel="noreferrer"
              className="text-primary-300 hover:text-primary-200 underline decoration-primary-300/40 underline-offset-2 transition-colors"
            >
              {t('GitHub 上的原文件', 'the original file on GitHub')}
            </a>{' '}
            {t('逐行比对。', 'and compare line by line.')}
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
                  <span className="text-2xs text-success-400 hidden sm:inline">{t(block.note.zh, block.note.en)}</span>
                  <button
                    type="button"
                    onClick={() => copy(block.code, i)}
                    className="inline-flex items-center gap-1 text-2xs text-ink-400 hover:text-ink-100 transition-colors"
                  >
                    {copied === i ? <Check size={13} className="text-success-400" /> : <Copy size={13} />}
                    {copied === i ? t('已复制', 'Copied') : t('复制', 'Copy')}
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
            <div key={item.step.zh} className="glass glass-hover p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-success-500/10 border border-success-500/20 flex items-center justify-center flex-shrink-0">
                <KeyRound size={16} className="text-success-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-50 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-success-400" />
                  {t(item.step.zh, item.step.en)}
                </h3>
                <p className="text-xs text-ink-400 mt-1 leading-relaxed">{t(item.text.zh, item.text.en)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
