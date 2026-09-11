import type { StageId } from '../types';
import { StageTrack } from './StageTrack';
import { ArrowRight, Sparkles, Zap, ShieldCheck, Activity, Cpu, Lock, Gauge } from 'lucide-react';

interface HeroProps {
  onStartClick: () => void;
}

const STATS = [
  { icon: Zap, value: '< 500ms', label: '平均诊断耗时' },
  { icon: ShieldCheck, value: '7 项', label: '安全检查维度' },
  { icon: Activity, value: '4 模型', label: '主流 AI API' },
];

const FLOATING_CARDS = [
  {
    icon: Cpu,
    label: 'GPT-4o',
    status: 'healthy',
    statusLabel: 'Healthy',
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
    delay: '0s',
    position: 'top-0 right-0',
  },
  {
    icon: Lock,
    label: 'TLS 1.3',
    status: 'pass',
    statusLabel: 'Verified',
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
    delay: '1.5s',
    position: 'top-8 -left-4',
  },
  {
    icon: Gauge,
    label: '340ms TTFT',
    status: 'fast',
    statusLabel: 'Fast',
    color: 'text-accent-400',
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/20',
    delay: '3s',
    position: 'bottom-4 right-8',
  },
];

export function Hero({ onStartClick }: HeroProps) {
  const currentStage: StageId = 'idle';
  const stageProgress = 0;
  return (
    <section id="top" className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8" style={{ zIndex: 1 }}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-6 backdrop-blur-sm">
              <Sparkles size={13} className="animate-glow-pulse" />
              <span>AI API 接口健康诊断工具</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink-50 leading-[1.1] tracking-tight text-balance">
              让 AI API
              <span className="block mt-2">
                <span className="gradient-text glow-text">
                  诊断可视化
                </span>
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-ink-300 leading-relaxed max-w-xl">
              从连接握手到流式解析，从延迟分析到安全审计——
              ZGo API Doctor 为你呈现 AI 接口的完整健康画像。
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button onClick={onStartClick} className="btn-primary group">
                <span>立即体验诊断</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="#how-it-works" className="btn-secondary">
                了解工作原理
              </a>
            </div>

            <div className="mt-10 flex items-center gap-6 sm:gap-8">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-ink-800/60 border border-ink-700/50 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <stat.icon size={16} className="text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-50 leading-none">{stat.value}</p>
                    <p className="text-2xs text-ink-400 mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in-up animation-delay-200">
            <div className="relative">
              {FLOATING_CARDS.map((card, idx) => (
                <div
                  key={idx}
                  className={`absolute ${card.position} z-20 hidden sm:block animate-float-slow`}
                  style={{ animationDelay: card.delay }}
                >
                  <div className={`glass-strong px-3 py-2.5 flex items-center gap-2.5 ${card.border} border`}>
                    <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                      <card.icon size={13} className={card.color} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink-50 leading-none">{card.label}</p>
                      <p className={`text-2xs font-mono mt-0.5 ${card.color}`}>{card.statusLabel}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="relative z-10">
                <StageTrack currentStage={currentStage} stageProgress={stageProgress} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
