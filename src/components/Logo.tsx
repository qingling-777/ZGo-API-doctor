export function Logo({ size = 'md', icon = true }: { size?: 'sm' | 'md' | 'lg'; icon?: boolean }) {
  const dims = {
    sm: { box: 'w-9 h-9', text: 'text-lg', sub: 'text-2xs' },
    md: { box: 'w-10 h-10', text: 'text-lg', sub: 'text-2xs' },
    lg: { box: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
  }[size];

  return (
    <div className="flex items-center gap-2.5">
      {icon && (
        <img
          src="/brand-mark.png"
          alt="ZGo API Doctor"
          className={`${dims.box} rounded-xl object-cover ring-1 ring-ink-700/40`}
        />
      )}
      <div className="flex flex-col leading-none">
        <span className={`${dims.text} font-bold text-ink-50 tracking-tight`}>
          ZGo <span className="text-primary-400">API Doctor</span>
        </span>
        <span className={`${dims.sub} font-mono text-ink-400 tracking-wider mt-0.5`}>
          AI API HEALTH DIAGNOSTICS
        </span>
      </div>
    </div>
  );
}
