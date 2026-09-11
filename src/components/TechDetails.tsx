import {
  Terminal,
  Activity,
  ShieldAlert,
  Gauge,
} from 'lucide-react';

const TECH_ITEMS = [
  {
    icon: Terminal,
    title: '流式 SSE 解析',
    description: '逐块读取 Server-Sent Events，记录首字节时间与总耗时，校验流是否以 [DONE] 正常结束。',
    code: `// SSE 分块解析
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
    title: '首字节与耗时段',
    description: '每次探测分别测量总耗时 latency_ms、首字节延迟 first_byte_ms 与 HTTP 状态码，用于定位慢点。',
    code: `// 延迟测量（非流式 / 流式）
const latency     = res.latency_ms;     // 总耗时
const ttft        = res.first_byte_ms;  // 首字节 TTFT
const statusCode  = res.status_code;    // HTTP 状态码
const streamOk    = res.done;           // 流是否正常结束`,
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/20',
  },
  {
    icon: ShieldAlert,
    title: '可用性判定引擎',
    description: '基于 HTTP 状态码与网络异常判别渠道状态：鉴权失败、权限不足、触发限流、网络错误、超时等。',
    code: `// 状态码 → 可用性判定
if (res.status === 401)      code = 'auth_error';       // Key 无效/过期
else if (res.status === 403) code = 'permission_error'; // 无模型权限
else if (res.status === 429) code = 'rate_limited';     // 触发限流
else if (timeout)            code = 'timeout';          // 连接超时
else if (network)            code = 'network_error';

// Chat 与 SSE 均通过 = healthy/A
// 部分通过 = degraded/B，全失败 = down/F`,
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
  },
  {
    icon: Gauge,
    title: '健康评分聚合',
    description: '把每个模型的结果聚合成 0-100 分：健康计 100、降级计 65、失败计 0，加权平均后换算等级。',
    code: `// 健康评分聚合（0-100）
const score = Math.round(
  (healthy * 100 + degraded * 65) / n
);

// 整体状态
const overall =
  healthy === n            ? 'healthy' :
  healthy + degraded > 0   ? 'degraded' : 'down';`,
    color: 'text-warning-400',
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/20',
  },
];

export function TechDetails() {
  return (
    <section id="tech" className="relative py-20 lg:py-28" style={{ zIndex: 1 }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800/50 border border-ink-700/50 backdrop-blur-sm mb-4">
            <span className="label-mono">Under the Hood</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
            技术原理
          </h2>
          <p className="mt-4 text-ink-300 leading-relaxed">
            从连接发现到模型探测，每一层都有可量化的耗时指标和健康评分逻辑。
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {TECH_ITEMS.map((item) => (
            <div key={item.title} className="glass glass-hover overflow-hidden group">
              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg ${item.bg} ${item.border} border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <item.icon size={18} className={item.color} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink-50">{item.title}</h3>
                    <p className="text-xs text-ink-400 mt-1 leading-relaxed">{item.description}</p>
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
