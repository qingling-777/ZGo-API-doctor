import { useState } from 'react';
import { Check, Eye, Download } from 'lucide-react';

// ============================================================
// 报告模板预览（可复用）
//   用于检测页（进入检测前提前看到报告长啥样）。
//   预览使用示例数据；正式导出时替换为本次探测真实数据与评分。
// ============================================================

const REPORT_MODULES = [
  '综合评分（A/B/C/D）与状态分级',
  '延迟表现（Chat / 流式双通道瀑布图）',
  '模型明细（含实际返回模型核对列）',
  'Token 用量构成（Prompt / Completion）',
  '响应预览与检测口径附录',
];

const PREVIEWS = {
  cover: { src: '/report-preview/template-cover.png', label: '封面 · 概览与评分' },
  latency: { src: '/report-preview/template-latency.png', label: '延迟 · 双通道瀑布图' },
  detail: { src: '/report-preview/template-detail.png', label: '明细 · 模型核对与 Token' },
} as const;

type PreviewKey = keyof typeof PREVIEWS;

export function ReportTemplatePreview({ className = '' }: { className?: string }) {
  const [activePreview, setActivePreview] = useState<PreviewKey>('cover');

  return (
    <div className={className}>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-medium mb-4">
          <Eye size={13} />
          <span>报告模板预览</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-50">你的诊断报告长这样</h2>
        <p className="mt-3 text-ink-300 max-w-lg mx-auto">
          以下为本次检测生成报告的可视化预览。
        </p>
      </div>

      {/* 页签切换 */}
      <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
        {(Object.keys(PREVIEWS) as PreviewKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setActivePreview(k)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activePreview === k
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'text-ink-400 border border-ink-700/40 hover:text-ink-200'
            }`}
          >
            {PREVIEWS[k].label}
          </button>
        ))}
      </div>

      <div className="glass-strong p-4 sm:p-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-center">
          <div className="border border-ink-700/30 rounded-lg overflow-hidden">
            <img
              src={PREVIEWS[activePreview].src}
              alt={PREVIEWS[activePreview].label}
              className="w-full h-auto bg-white"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="text-2xs font-mono text-ink-500 mb-1 uppercase tracking-wide">报告包含模块</p>
            {REPORT_MODULES.map((m, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 w-5 h-5 rounded-md bg-primary-500/15 border border-primary-500/25 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-primary-300" />
                </span>
                <span className="text-xs text-ink-200 leading-relaxed">{m}</span>
              </div>
            ))}
            <div className="mt-3 p-3 rounded-lg bg-ink-800/40 border border-ink-700/40">
              <p className="text-2xs text-ink-400 leading-relaxed">
                <Download size={11} className="inline mr-1 -mt-0.5" />
                点击报告页右上角「导出报告」可下载为可离线打开的 HTML 文件。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
