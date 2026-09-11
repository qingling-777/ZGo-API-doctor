import {
  Network,
  KeyRound,
  Gauge,
  Braces,
  ShieldCheck,
  AlertTriangle,
  FileBarChart,
  Share2,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Network,
    title: '连接发现',
    description: '连接目标服务并拉取模型清单，校验 Base URL 与鉴权头，自动识别可调用端点。',
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
    glow: 'group-hover:shadow-primary-500/10',
  },
  {
    icon: KeyRound,
    title: '身份验证审计',
    description: 'API Key 有效性验证、权限范围检查、过期风险预警，确保认证链路安全。',
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/20',
    glow: 'group-hover:shadow-accent-500/10',
  },
  {
    icon: Gauge,
    title: '延迟测量',
    description: '每次探测记录总耗时与首字节 TTFT，结合 HTTP 状态码定位慢点与异常。',
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
    glow: 'group-hover:shadow-success-500/10',
  },
  {
    icon: Braces,
    title: '流式响应解析',
    description: 'SSE 分块解析、Token 计数、中断检测，确保流式传输稳定可靠。',
    color: 'text-warning-400',
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/20',
    glow: 'group-hover:shadow-warning-500/10',
  },
  {
    icon: ShieldCheck,
    title: '鉴权与可用性判定',
    description: '基于 HTTP 状态码判别鉴权失败、权限不足、限流与网络异常，给出可用性等级。',
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
    glow: 'group-hover:shadow-primary-500/10',
  },
  {
    icon: AlertTriangle,
    title: '异常告警诊断',
    description: '自动识别 429 限流、5xx 错误、超时中断等异常，提供修复建议。',
    color: 'text-error-400',
    bg: 'bg-error-500/10',
    border: 'border-error-500/20',
    glow: 'group-hover:shadow-error-500/10',
  },
  {
    icon: FileBarChart,
    title: '健康评分报告',
    description: '综合评分模型，量化 API 健康状态，生成可分享的诊断报告。',
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/20',
    glow: 'group-hover:shadow-accent-500/10',
  },
  {
    icon: Share2,
    title: '报告分享',
    description: '报告编码进链接即可分享，无需服务端；也可导出为可离线打开的 HTML。',
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
    glow: 'group-hover:shadow-success-500/10',
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-20 lg:py-28" style={{ zIndex: 1 }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800/50 border border-ink-700/50 backdrop-blur-sm mb-4">
            <span className="label-mono">Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
            全链路诊断，无盲区覆盖
          </h2>
          <p className="mt-4 text-ink-300 leading-relaxed">
            从网络层到应用层，从性能到安全，8 大维度构建 AI API 接口的完整健康画像。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, idx) => (
            <div
              key={feature.title}
              className="glass glass-hover p-5 group cursor-default animate-fade-in-up"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className={`w-11 h-11 rounded-xl ${feature.bg} ${feature.border} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon size={20} className={feature.color} />
              </div>
              <h3 className="text-sm font-semibold text-ink-50 mb-2">{feature.title}</h3>
              <p className="text-xs text-ink-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
