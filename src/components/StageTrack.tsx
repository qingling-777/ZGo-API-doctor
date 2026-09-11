import type { StageId } from '../types';
import { STAGES } from '../data';
import {
  Wifi,
  KeyRound,
  Send,
  Download,
  Braces,
  Timer,
  ShieldCheck,
  Check,
  Loader2,
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
  complete: Check,
};

interface StageTrackProps {
  currentStage: StageId;
  stageProgress: number;
}

export function StageTrack({ currentStage, stageProgress }: StageTrackProps) {
  const activeIndex = STAGES.findIndex((s) => s.id === currentStage);
  const isComplete = currentStage === 'complete';

  return (
    <div className="glass-strong p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-success-400" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-success-400 animate-ping opacity-60" />
          </div>
          <span className="label-mono">Live Diagnostics Pipeline</span>
        </div>
        <span className="text-2xs font-mono text-ink-400 px-2 py-1 rounded bg-ink-800/50 border border-ink-700/40">
          {isComplete ? 'COMPLETE' : activeIndex >= 0 ? `STAGE ${activeIndex + 1}/${STAGES.length}` : 'READY'}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-6">
        {STAGES.map((stage, idx) => {
          const isActive = idx === activeIndex && !isComplete;
          const isDone = isComplete || idx < activeIndex;
          const Icon = STAGE_ICONS[stage.id];

          return (
            <div key={stage.id} className="flex flex-col items-center gap-2">
              <div className="relative w-full">
                <div
                  className={`h-1 rounded-full transition-all duration-500 ${
                    isDone
                      ? 'bg-gradient-to-r from-success-500 to-success-400'
                      : isActive
                      ? 'bg-primary-500/40'
                      : 'bg-ink-700/50'
                  }`}
                >
                  {isActive && (
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-400 overflow-hidden relative transition-all duration-100"
                      style={{ width: `${stageProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-progress" />
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-300 ${
                  isDone
                    ? 'bg-success-500/15 border-success-500/30 text-success-400'
                    : isActive
                    ? 'bg-primary-500/15 border-primary-500/40 text-primary-300 scale-110 shadow-lg shadow-primary-500/20'
                    : 'bg-ink-800/40 border-ink-700/40 text-ink-500'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-lg border border-primary-400/30 animate-ping" />
                )}
                {isDone ? (
                  <Check size={15} strokeWidth={2.5} />
                ) : isActive ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Icon size={15} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="min-h-[60px]">
        {isComplete ? (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-success-500/10 border border-success-500/20 animate-scale-in">
            <div className="relative w-9 h-9 rounded-full bg-success-500/20 flex items-center justify-center flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-success-500/20 animate-ping opacity-40" />
              <Check size={18} className="text-success-400" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-success-400">诊断完成</p>
              <p className="text-xs text-ink-300 mt-0.5">
                所有检测阶段已完成，查看下方详细报告
              </p>
            </div>
          </div>
        ) : activeIndex >= 0 ? (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-primary-500/10 border border-primary-500/20 animate-fade-in">
            <div className="relative w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping opacity-40" />
              <Loader2 size={18} className="text-primary-400 animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-50">
                {STAGES[activeIndex].label}
              </p>
              <p className="text-xs text-ink-300 mt-0.5 font-mono">
                {STAGES[activeIndex].description}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-16 h-1 rounded-full bg-ink-700/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-400 transition-all duration-100"
                  style={{ width: `${stageProgress}%` }}
                />
              </div>
              <span className="text-2xs font-mono text-primary-400 w-8 text-right">
                {Math.round(stageProgress)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-ink-800/30 border border-ink-700/30">
            <div className="w-9 h-9 rounded-full bg-ink-700/40 flex items-center justify-center flex-shrink-0">
              <Wifi size={16} className="text-ink-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-200">等待开始检测</p>
              <p className="text-xs text-ink-400 mt-0.5">
                选择模型并输入 API Key 以启动诊断流程
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
