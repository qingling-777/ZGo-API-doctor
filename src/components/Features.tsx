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
import { useI18n } from '../lib/i18n';

const FEATURES = [
  {
    icon: Network,
    zh: ['连接发现', '连接目标服务并拉取模型清单，校验 Base URL 与鉴权头，自动识别可调用端点。'],
    en: [
      'Connect & discover',
      'Reach the target service and pull its model catalogue, validating the Base URL and auth header and identifying callable endpoints.',
    ],
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
  },
  {
    icon: KeyRound,
    zh: ['身份验证审计', 'API Key 有效性验证、权限范围检查、过期风险预警，确保认证链路安全。'],
    en: [
      'Auth audit',
      'Key validity, scope and expiry risk — so you know the authentication path is actually sound.',
    ],
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/20',
  },
  {
    icon: Gauge,
    zh: ['延迟测量', '每次探测记录总耗时与首字节 TTFT，结合 HTTP 状态码定位慢点与异常。'],
    en: [
      'Latency measurement',
      'Every probe records total time and time-to-first-byte, paired with the HTTP status so you can pinpoint where it slows down.',
    ],
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
  },
  {
    icon: Braces,
    zh: ['流式响应解析', 'SSE 分块解析、Token 计数、中断检测，确保流式传输稳定可靠。'],
    en: [
      'Streaming parser',
      'Chunk-by-chunk SSE parsing, token counting and interruption detection, so streaming reliability is measured rather than assumed.',
    ],
    color: 'text-warning-400',
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/20',
  },
  {
    icon: ShieldCheck,
    zh: ['鉴权与可用性判定', '基于 HTTP 状态码判别鉴权失败、权限不足、限流与网络异常，给出可用性等级。'],
    en: [
      'Auth & availability verdict',
      'HTTP status codes are classified into auth failure, insufficient scope, rate limiting and network error, then rolled into an availability grade.',
    ],
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
  },
  {
    icon: AlertTriangle,
    zh: ['异常告警诊断', '自动识别 429 限流、5xx 错误、超时中断等异常，提供修复建议。'],
    en: [
      'Failure diagnosis',
      'Recognises 429 rate limits, 5xx errors and mid-stream timeouts, and suggests what to do about each.',
    ],
    color: 'text-error-400',
    bg: 'bg-error-500/10',
    border: 'border-error-500/20',
  },
  {
    icon: FileBarChart,
    zh: ['健康评分报告', '综合评分模型，量化 API 健康状态，生成可分享的诊断报告。'],
    en: [
      'Health score report',
      'A weighted score turns endpoint health into one number, wrapped in a report you can share.',
    ],
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/20',
  },
  {
    icon: Share2,
    zh: ['报告分享', '报告编码进链接即可分享，无需服务端；也可导出为可离线打开的 HTML。'],
    en: [
      'Share & export',
      'The report is encoded into the link itself — no server needed — or exported as a self-contained HTML file.',
    ],
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
  },
];

export function Features() {
  const { t } = useI18n();

  return (
    <section id="features" className="relative py-20 lg:py-28" style={{ zIndex: 1 }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800/50 border border-ink-700/50 backdrop-blur-sm mb-4">
            <span className="label-mono">Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
            {t('全链路诊断，无盲区覆盖', 'Diagnose the whole path, no blind spots')}
          </h2>
          <p className="mt-4 text-ink-300 leading-relaxed">
            {t(
              '从网络层到应用层，从性能到安全，8 大维度构建 AI API 接口的完整健康画像。',
              'From the network layer to the application layer, from performance to security — eight dimensions that together describe an AI endpoint.',
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, idx) => {
            const title = t(feature.zh[0], feature.en[0]);
            const description = t(feature.zh[1], feature.en[1]);
            return (
              <div
                key={title}
                className="glass glass-hover p-5 group cursor-default animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className={`w-11 h-11 rounded-xl ${feature.bg} ${feature.border} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={20} className={feature.color} />
                </div>
                <h3 className="text-sm font-semibold text-ink-50 mb-2">{title}</h3>
                <p className="text-xs text-ink-400 leading-relaxed">{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
