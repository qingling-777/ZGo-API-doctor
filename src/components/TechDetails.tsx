import {
  Terminal,
  Activity,
  ShieldAlert,
  Gauge,
} from 'lucide-react';
import { useI18n } from '../lib/i18n';

const TECH_ITEMS = [
  {
    icon: Terminal,
    title: { zh: '流式 SSE 解析', en: 'Streaming SSE parsing' },
    description: {
      zh: '逐块读取 Server-Sent Events，记录首字节时间与总耗时，校验流是否以 [DONE] 正常结束。',
      en: 'Reads Server-Sent Events chunk by chunk, timestamps the first byte and the total duration, and checks that the stream terminates properly with [DONE].',
    },
    code: `// chunked SSE parsing
const stream = await fetch(endpoint, {
  method: 'POST',
  headers: { Authorization },
  body: JSON.stringify({ stream: true, ...payload }),
});

let firstByteMs = null;
const chunks = [];
for await (const line of stream) {
  if (firstByteMs === null && line.trim()) {
    firstByteMs = performance.now() - t0;
  }
  if (line.trim() === 'data: [DONE]') break;
  chunks.push(line);
}`,
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
  },
  {
    icon: Activity,
    title: { zh: '首字节与耗时段', en: 'Latency and time to first byte' },
    description: {
      zh: '每次探测分别测量总耗时 latency_ms、首字节延迟 first_byte_ms 与 HTTP 状态码，用于定位慢点。',
      en: 'Each probe records total latency_ms, first_byte_ms and the HTTP status code separately, which is what lets you pinpoint where it is slow.',
    },
    code: `// latency measurement (buffered / streaming)
const latency     = res.latency_ms;     // total duration
const ttft        = res.first_byte_ms;  // time to first token
const statusCode  = res.status_code;    // HTTP status
const streamOk    = res.done;           // did the stream finish cleanly`,
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/20',
  },
  {
    icon: ShieldAlert,
    title: { zh: '可用性判定引擎', en: 'Availability classifier' },
    description: {
      zh: '基于 HTTP 状态码与网络异常判别渠道状态：鉴权失败、权限不足、触发限流、网络错误、超时等。',
      en: 'Maps HTTP status codes and network failures to a channel state: auth failure, missing permission, rate limit, network error, timeout.',
    },
    code: `// status code -> availability verdict
if (res.status === 401)      code = 'auth_error';       // key invalid or expired
else if (res.status === 403) code = 'permission_error'; // no access to this model
else if (res.status === 429) code = 'rate_limited';     // being throttled
else if (timeout)            code = 'timeout';          // connection timed out
else if (network)            code = 'network_error';

// Chat and SSE both pass = healthy / A
// partly passing = degraded / B; all failing = down / F`,
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
  },
  {
    icon: Gauge,
    title: { zh: '健康评分聚合', en: 'Health score aggregation' },
    description: {
      zh: '把每个模型的结果聚合成 0-100 分：健康计 100、降级计 65、失败计 0，加权平均后换算等级。',
      en: 'Aggregates per-model results into a 0-100 score: healthy counts 100, degraded 65, failed 0 — then averages and maps to a grade.',
    },
    code: `// health score aggregation (0-100)
const score = Math.round(
  (healthy * 100 + degraded * 65) / n
);

// overall state
const overall =
  healthy === n            ? 'healthy' :
  healthy + degraded > 0   ? 'degraded' : 'down';`,
    color: 'text-warning-400',
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/20',
  },
];

export function TechDetails() {
  const { t } = useI18n();
  return (
    <section id="tech" className="relative py-20 lg:py-28" style={{ zIndex: 1 }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800/50 border border-ink-700/50 backdrop-blur-sm mb-4">
            <span className="label-mono">Under the Hood</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
            {t('技术原理', 'How it works under the hood')}
          </h2>
          <p className="mt-4 text-ink-300 leading-relaxed">
            {t(
              '从连接发现到模型探测，每一层都有可量化的耗时指标和健康评分逻辑。',
              'From endpoint discovery to per-model probing, every layer emits measurable timing data and feeds the health score.'
            )}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {TECH_ITEMS.map((item) => (
            <div key={item.title.zh} className="glass glass-hover overflow-hidden group">
              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg ${item.bg} ${item.border} border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <item.icon size={18} className={item.color} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink-50">{t(item.title.zh, item.title.en)}</h3>
                    <p className="text-xs text-ink-400 mt-1 leading-relaxed">{t(item.description.zh, item.description.en)}</p>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5">
                <pre className="bg-ink-950/60 backdrop-blur-sm border border-ink-700/40 rounded-lg p-4 text-2xs font-mono text-ink-200 leading-relaxed overflow-x-auto">
                  <code>{item.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
