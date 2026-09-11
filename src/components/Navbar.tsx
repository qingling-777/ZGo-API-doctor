import { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Menu, X } from 'lucide-react';
import { ROUTES, type Route } from '../router';
import { GITHUB_URL } from '../lib/site';

function GitHubMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

interface NavbarProps {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
}

export function Navbar({ currentRoute, onNavigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (route: Route) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  const navLinks = ROUTES;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-ink-950/70 backdrop-blur-xl border-b border-ink-700/40'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => handleNav('home')} className="flex-shrink-0">
            <Logo size="sm" />
          </button>

          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = currentRoute === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNav(link.id)}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-ink-50 bg-ink-800/50'
                      : 'text-ink-300 hover:text-ink-50 hover:bg-ink-800/30'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-primary-400 to-accent-400" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub 开源仓库"
              title="查看开源仓库"
              className="p-2 text-ink-300 hover:text-ink-50 hover:bg-ink-800/30 rounded-lg transition-colors"
            >
              <GitHubMark size={18} />
            </a>
            <button
              onClick={() => handleNav('detect')}
              className="btn-primary text-sm"
            >
              开始检测
            </button>
          </div>

          <div className="lg:hidden flex items-center gap-1">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub 开源仓库"
              className="p-2 text-ink-300 hover:text-ink-50 transition-colors"
            >
              <GitHubMark size={20} />
            </a>
            <button
              className="p-2 text-ink-200 hover:text-ink-50 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="菜单"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-ink-700/40 bg-ink-950/90 backdrop-blur-xl">
          <nav className="px-5 py-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = currentRoute === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNav(link.id)}
                  className={`px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-colors ${
                    isActive
                      ? 'text-ink-50 bg-ink-800/50'
                      : 'text-ink-200 hover:text-ink-50 hover:bg-ink-800/50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
            <div className="mt-2 pt-2 border-t border-ink-700/40">
              <button
                onClick={() => handleNav('detect')}
                className="w-full px-3 py-2.5 text-sm font-medium rounded-lg text-left text-primary-300 hover:bg-ink-800/50 transition-colors"
              >
                开始检测
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
