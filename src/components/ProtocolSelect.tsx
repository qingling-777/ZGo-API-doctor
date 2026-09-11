import { PROTOCOLS, type Protocol } from '../lib/api';
import { VendorLogo } from './VendorLogo';

interface ProtocolSelectProps {
  value: Protocol;
  onChange: (p: Protocol) => void;
  disabled?: boolean;
}

// 各厂商品牌色柔和浅底衬（哑光、低饱和，提供色彩辨识度但不止眼见白刺眼）
const TILE_BG: Record<Protocol, string> = {
  openai: 'bg-ink-100/20',
  anthropic: 'bg-[#D97757]/25',
  gemini: 'bg-[#8E75B2]/25',
  mistral: 'bg-[#FA520F]/25',
  cohere: 'bg-[#39594D]/40',
};

export function ProtocolSelect({ value, onChange, disabled }: ProtocolSelectProps) {
  return (
    <div>
      <label className="label-mono block mb-3">接口协议规则</label>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {PROTOCOLS.map((p) => {
          const isActive = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p.id)}
              className={`relative p-3 rounded-lg border text-left transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500/10 border-primary-500/40 shadow-lg shadow-primary-500/10'
                  : 'bg-ink-900/40 border-ink-700/40 hover:border-ink-600 hover:bg-ink-800/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {/* 品牌色柔和浅底衬 + 白色 logo（Cohere 多彩），不刺眼又保留辨识度 */}
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${TILE_BG[p.id]}`}
                >
                  <VendorLogo protocol={p.id} size={17} />
                </div>
                <span className={`text-xs font-semibold ${isActive ? 'text-ink-50' : 'text-ink-200'}`}>
                  {p.label}
                </span>
              </div>
              <p className="text-2xs font-mono text-ink-400 truncate" title={p.hint}>{p.hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
