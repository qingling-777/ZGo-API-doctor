import { useState, useEffect, useCallback } from 'react';

export type Route =
  | 'home'
  | 'detect'
  | 'privacy'
  | 'terms'
  | 'about'
  | 'changelog'
  | 'integration'
  | 'report';

export const ROUTES: { id: Route; label: string; href: string }[] = [
  { id: 'home', label: '首页', href: '#/' },
  { id: 'detect', label: '检测', href: '#/detect' },
  { id: 'integration', label: '接入', href: '#/integration' },
  { id: 'changelog', label: '更新日志', href: '#/changelog' },
  { id: 'about', label: '关于', href: '#/about' },
];

const VALID_ROUTES: Route[] = ['home', 'detect', 'privacy', 'terms', 'about', 'changelog', 'integration'];

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const match = VALID_ROUTES.find((r) => r === hash);
  if (match) return match;
  // 分享报告：#/report?d=...
  if (hash.startsWith('report')) return 'report';
  return 'home';
}

/**
 * 解析「首页区块锚点」，如 #/features、#/tech。
 * 本项目使用 hash 路由，#features 无法表达「首页 + 滚动到 features」，
 * 因此约定：hash 既不是路由名也不是分享报告时，视为首页区块 id，
 * 由 useRouter 在路由切换后滚动定位（见下方 scrollToSection）。
 */
function parseSection(hash: string): string | null {
  const raw = hash.replace(/^#\/?/, '').split('?')[0];
  if (!raw) return null;
  if (VALID_ROUTES.includes(raw as Route)) return null;
  if (raw.startsWith('report')) return null;
  return raw;
}

/**
 * 滚动到指定区块。跨页跳转时目标区块可能尚未渲染（如从 #/detect 跳 #/features），
 * 因此做短暂重试；始终找不到才回顶。并尊重 prefers-reduced-motion。
 */
function scrollToSection(id: string, attempt = 0): void {
  const el = document.getElementById(id);
  if (!el) {
    if (attempt < 10) {
      setTimeout(() => scrollToSection(id, attempt + 1), 60);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    return;
  }
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

/** 从当前 hash 解析分享 token（#/report?d=<token>），无则返回 null */
export function readShareToken(hash: string): string | null {
  try {
    const q = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : hash;
    const pathAndQuery = q.replace(/^\/?/, '');
    const [path, query = ''] = pathAndQuery.split('?');
    if (path !== 'report') return null;
    const params = new URLSearchParams(query);
    return params.get('d');
  } catch {
    return null;
  }
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash());
      const section = parseSection(window.location.hash);
      if (section) scrollToSection(section);
      else window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // 首次直接进入 #/features 这类链接时，也要滚动定位到对应区块
  useEffect(() => {
    const section = parseSection(window.location.hash);
    if (!section) return;
    const timer = setTimeout(() => scrollToSection(section), 120);
    return () => clearTimeout(timer);
  }, []);

  const navigate = useCallback((to: Route) => {
    // ROUTES 仅含主导航菜单项；未列入 VALID_ROUTES 的隐藏路由按 `#/<id>` 回退
    const href = ROUTES.find((r) => r.id === to)?.href || (to === 'home' ? '#/' : `#/${to}`);
    window.location.hash = href;
  }, []);

  return { route, navigate };
}
