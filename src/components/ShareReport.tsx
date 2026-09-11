import type { DetectionReport } from '../types';
import { FileBarChart, AlertCircle, ArrowRight, Info } from 'lucide-react';

/** 只读报告视图：供分享链接（#/report?d=token）渲染，不含导航/重置/接入模板。 */
export function ShareReport({ report }: { report: DetectionReport }) {
  const scoreBar =
    report.score >= 85 ? 'bg-success-500/10' : report.score >= 55 ? 'bg-warning-500/10' : 'bg-error-500/10';
  const badgeTone =
    report.score >= 85
      ? 'bg-success-500/10 border-success-500/20 text-success-400'
      : report.score >= 55
      ? 'bg-warning-500/10 border-warning-500/20 text-warning-400'
      : 'bg-error-500/10 border-error-500/20 text-error-400';

  const statusCard = (item: { model: string; status: string; grade: string }) => {
    const conf =
      item.status === 'healthy'
        ? { label: '健康', color: 'text-success-400', bg: 'bg-success-500/10', border: 'border-success-500/20' }
        : item.status === 'degraded'
        ? { label: '降级', color: 'text-warning-400', bg: 'bg-warning-500/10', border: 'border-warning-500/20' }
        : { label: '严重', color: 'text-error-400', bg: 'bg-error-500/10', border: 'border-error-500/20' };
    return (
      <div className="flex items-center gap-3">
        <span className={`px-2 py-0.5 rounded text-2xs font-mono border ${conf.bg} ${conf.border} ${conf.color}`}>{conf.label}</span>
        <span className={`text-2xs font-mono ${conf.color}`}>{item.grade}</span>
      </div>
    );
  };

  return (
    <div className="pt-20 pb-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary-500/8 border border-primary-500/20 mb-4">
          <Info size={15} className="text-primary-300 mt-0.5 flex-shrink-0" />
          <p className="text-2xs text-ink-300 leading-relaxed">
            你正在查看分享的诊断报告（只读）。报告数据编码在链接本身，不经过任何服务器；如需重新检测或导出，请回到<span className="text-primary-300 font-medium">检测页</span>。
          </p>
        </div>
        <div className="glass-strong p-6 sm:p-8 mb-4">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center">
            <div className="flex items-center gap-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${scoreBar}`} />
                <div className="relative flex flex-col items-center">
                  <span className={`text-3xl font-bold ${report.score >= 85 ? 'text-success-400' : report.score >= 55 ? 'text-warning-400' : 'text-error-400'}`}>{report.score}</span>
                  <span className="text-2xs font-mono text-ink-400 mt-0.5">/ 100</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium border ${badgeTone}`}>
                    {report.score >= 85 ? '健康' : report.score >= 55 ? '降级' : '严重'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-ink-50">诊断报告</h2>
                <p className="text-xs font-mono text-ink-400 mt-1">{report.endpoint || report.baseUrl}</p>
                <p className="text-2xs font-mono text-ink-400 mt-0.5">
                  Key: {report.apiKeyMasked || '—'} · {new Date(report.timestamp).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:ml-auto w-full lg:w-auto">
              <div className="surface-3 p-3 text-center">
                <p className="text-2xs font-mono text-ink-400 mb-1">HEALTHY</p>
                <p className="text-lg font-bold text-success-400">{report.healthyCount}</p>
              </div>
              <div className="surface-3 p-3 text-center">
                <p className="text-2xs font-mono text-ink-400 mb-1">DEGRADED</p>
                <p className="text-lg font-bold text-warning-400">{report.degradedCount}</p>
              </div>
              <div className="surface-3 p-3 text-center">
                <p className="text-2xs font-mono text-ink-400 mb-1">DOWN</p>
                <p className="text-lg font-bold text-error-400">{report.downCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-5 sm:p-6 mb-4">
          <div className="flex items-center gap-2 mb-5">
            <FileBarChart size={16} className="text-primary-400" />
            <h4 className="text-sm font-semibold text-ink-50">模型探测结果</h4>
            <span className="text-2xs font-mono text-ink-400 ml-auto">{report.modelCount} models</span>
          </div>
          <div className="space-y-3">
            {report.models.map((m, idx) => (
              <div key={m.model} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl bg-ink-800/30 border border-ink-700/30 animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                <span className="text-sm font-mono text-ink-100 flex-1">{m.model}</span>
                {statusCard(m)}
                <div className="text-2xs font-mono text-ink-400">
                  Chat {m.chatLatencyMs}ms · SSE {m.firstByteMs ?? '-'}ms · {m.chunks} chunks
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-5 sm:p-6">
          <h4 className="text-sm font-semibold text-ink-50 mb-4">诊断发现</h4>
          <div className="space-y-3">
            {report.models.map((m) => {
              const issues: { level: 'critical' | 'warning' | 'info' | 'healthy'; title: string; detail: string; metric?: string }[] = [];
              if (m.status === 'down') {
                issues.push({ level: 'critical', title: '模型探测失败', detail: m.errorMessage || '对话请求失败', metric: m.errorCode || 'down' });
              } else if (m.status === 'degraded') {
                issues.push({ level: 'warning', title: '部分通路降级', detail: 'Chat 或 SSE 未完全通过', metric: m.grade });
              }
              if (m.firstByteMs && m.firstByteMs > 800) {
                issues.push({ level: 'warning', title: '首字节延迟偏高', detail: `TTFT ${m.firstByteMs}ms 超过 P75 基准`, metric: `${m.firstByteMs}ms` });
              }
              if (issues.length === 0) {
                issues.push({ level: 'healthy', title: '通路状态良好', detail: 'Chat 与 SSE 均通过', metric: m.grade });
              }
              const LEVEL_SEG = {
                critical: { c: 'text-error-400', bg: 'bg-error-500/10', b: 'border-error-500/20' },
                warning: { c: 'text-warning-400', bg: 'bg-warning-500/10', b: 'border-warning-500/20' },
                info: { c: 'text-primary-400', bg: 'bg-primary-500/10', b: 'border-primary-500/20' },
                healthy: { c: 'text-success-400', bg: 'bg-success-500/10', b: 'border-success-500/20' },
              };
              return issues.map((issue, i) => {
                const seg = LEVEL_SEG[issue.level];
                return (
                  <div key={`${m.model}-${i}`} className={`flex items-start gap-3 p-3.5 rounded-xl ${seg.bg} ${seg.b} border`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-ink-400">{m.model}</span>
                        <span className="text-sm font-semibold text-ink-50">{issue.title}</span>
                        {issue.metric && <span className="text-2xs font-mono text-ink-300 bg-ink-800/50 px-1.5 py-0.5 rounded">{issue.metric}</span>}
                      </div>
                      <p className="text-xs text-ink-300 mt-1 leading-relaxed">{issue.detail}</p>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-2xs text-ink-400 mb-3">这是一份只读分享报告，想诊断自己的 API？</p>
          <a href="#/detect" className="btn-primary inline-flex items-center gap-2">
            <span>去做一次检测</span>
            <ArrowRight size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}

export function ShareReportEmpty() {
  return (
    <div className="pt-32 pb-20 min-h-screen text-center">
      <div className="max-w-md mx-auto px-6">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-error-500/10 border border-error-500/20 flex items-center justify-center">
          <AlertCircle size={26} className="text-error-400" />
        </div>
        <h2 className="text-xl font-bold text-ink-50">无法打开这份报告</h2>
        <p className="text-sm text-ink-300 mt-3 leading-relaxed">
          分享链接无效或已过期。请重新生成，或直接去做一次新的检测。
        </p>
        <a href="#/detect" className="btn-secondary mt-6 inline-flex items-center gap-2">
          <span>去做检测</span>
          <ArrowRight size={15} />
        </a>
      </div>
    </div>
  );
}
