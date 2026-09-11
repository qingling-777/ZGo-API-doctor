export function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-ink-950" />

      <div
        className="absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full opacity-20 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)',
          animation: 'aurora-float-1 20s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)',
          animation: 'aurora-float-2 25s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[700px] h-[400px] rounded-full opacity-10 blur-[120px]"
        style={{
          background: 'radial-gradient(circle, #10B981 0%, transparent 70%)',
          animation: 'aurora-float-3 30s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full opacity-8 blur-[80px]"
        style={{
          background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
          animation: 'aurora-float-4 22s ease-in-out infinite',
        }}
      />

      <div className="absolute inset-0 bg-grid opacity-30" style={{
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 100%)',
      }} />
    </div>
  );
}
