import { STAGES } from '../data';
import type { StageId } from '../types';
import {
  Wifi,
  KeyRound,
  Send,
  Download,
  Braces,
  Timer,
  ShieldCheck,
} from 'lucide-react';

const STAGE_ICONS: Record<StageId, typeof Wifi> = {
  idle: Wifi,
  connecting: Wifi,
  authenticating: KeyRound,
  'sending-request': Send,
  'receiving-response': Download,
  'parsing-stream': Braces,
  'analyzing-latency': Timer,
  'checking-safety': ShieldCheck,
  complete: ShieldCheck,
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 lg:py-28 overflow-hidden" style={{ zIndex: 1 }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-800/50 border border-ink-700/50 backdrop-blur-sm mb-4">
            <span className="label-mono">How It Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
            两段式检测流程
          </h2>
          <p className="mt-4 text-ink-300 leading-relaxed">
            先连接目标服务并拉取模型清单，再对每个模型分别做 Chat 与 SSE 流式探测，各步骤的耗时与判定汇聚为完整健康报告。
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute left-0 right-0 top-[44px] h-px bg-gradient-to-r from-transparent via-ink-600/50 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-6 lg:gap-3">
            {STAGES.map((stage, idx) => {
              const Icon = STAGE_ICONS[stage.id];
              return (
                <div key={stage.id} className="relative group">
                  <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                    <div className="relative z-10 w-12 h-12 rounded-xl glass flex items-center justify-center mb-4 group-hover:border-primary-500/40 transition-all duration-300 group-hover:scale-110">
                      <Icon size={20} className="text-ink-200 group-hover:text-primary-400 transition-colors" />
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xs font-mono font-bold text-white shadow-lg shadow-primary-500/30">
                        {idx + 1}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-ink-50 mb-1.5">{stage.label}</h3>
                    <p className="text-xs text-ink-400 leading-relaxed font-mono">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
