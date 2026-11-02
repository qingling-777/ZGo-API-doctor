import { LANGS, useI18n } from '../lib/i18n';

interface LangSwitchProps {
  /** compact：只显示当前语言，点一下切换（移动端用） */
  compact?: boolean;
  className?: string;
}

/**
 * 语言切换器。两种形态：
 *  · 默认：中文 / EN 两个并排按钮
 *  · compact：单个按钮，点一下在两种语言间来回切（窄屏够用）
 * 状态写进 localStorage，刷新后保持。
 */
export function LangSwitch({ compact = false, className = '' }: LangSwitchProps) {
  const { lang, setLang } = useI18n();

  const base =
    'inline-flex items-center rounded-lg border border-ink-700/50 bg-ink-800/30 text-xs font-medium';

  if (compact) {
    const next = lang === 'zh' ? 'en' : 'zh';
    return (
      <button
        type="button"
        onClick={() => setLang(next)}
        aria-label={lang === 'zh' ? 'Switch to English' : '切换到中文'}
        title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
        className={`${base} px-2.5 py-1.5 text-ink-200 hover:text-ink-50 hover:bg-ink-800/60 transition-colors ${className}`}
      >
        {lang === 'zh' ? 'EN' : '中文'}
      </button>
    );
  }

  return (
    <div className={`${base} p-0.5 ${className}`} role="group" aria-label="Language / 语言">
      {LANGS.map((l) => {
        const active = l.id === lang;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => setLang(l.id)}
            aria-pressed={active}
            className={`px-2 py-1 rounded-[6px] transition-colors ${
              active ? 'bg-ink-700/60 text-ink-50' : 'text-ink-400 hover:text-ink-100'
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
