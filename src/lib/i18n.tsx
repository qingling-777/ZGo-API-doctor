/**
 * 极简 i18n —— **双语内联**：`t('中文原文', 'English')`。
 *
 * 为什么不用「中文原文当 key + 独立字典」：
 *   · 本项目 500+ 条中文字面量，独立字典必然出现 key 漂移（改了原文忘了改 key ⇒ 静默回落中文）；
 *   · JSX 里大量 `<code>`/`<strong>` 把一句话切成几段，逐段查字典译出来必然语序错乱；
 *   · 内联写法让译文紧贴原文，review diff 时一眼能看出哪句没译。
 * 代价：源码里中英各存一份（可读性略降、体积可忽略）。
 *
 * 需要翻译的非 React 场景（模块级常量、导出函数）用 `pick(lang, zh, en)`。
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Lang = 'zh' | 'en';

const STORAGE_KEY = 'zgo.lang';

/** 支持的语言与展示名（顺序即切换器顺序） */
export const LANGS: { id: Lang; label: string; htmlLang: string }[] = [
  { id: 'zh', label: '中文', htmlLang: 'zh-CN' },
  { id: 'en', label: 'EN', htmlLang: 'en' },
];

/** 按语言取其中一个值；非 React 场景用 */
export function pick(lang: Lang, zh: string, en: string): string {
  return lang === 'en' ? en : zh;
}

/**
 * 非 React 场景（`lib/` 里的错误文案、导出函数）用的当前语言。
 * 由 I18nProvider 在语言变化时同步过来；这些场景发生在用户动作之后，
 * 读到的永远是最近一次渲染时的语言，不存在「读到旧值」的问题。
 */
let currentLang: Lang = 'zh';

/** 供 I18nProvider 内部同步，业务代码不要直接调用 */
export function setCurrentLang(next: Lang): void {
  currentLang = next;
}

/** 非 React 场景的 `t()`：`t('中文', 'English')` */
export function t(zh: string, en: string): string {
  return currentLang === 'en' ? en : zh;
}

/**
 * 初始语言：先看用户显式选择（localStorage），否则按浏览器语言猜 ——
 * 非中文一律给英文（这是面向海外的开源仓库，英文是默认受众）。
 */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    /* 隐私模式下 localStorage 可能抛错，忽略 */
  }
  const nav = (navigator.languages?.[0] || navigator.language || '').toLowerCase();
  return nav.startsWith('zh') ? 'zh' : 'en';
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** t(中文, English) —— 按当前语言取一 */
  t: (zh: string, en: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* 忽略 */
    }
  }, []);

  // <html lang> 跟着切，读屏与浏览器翻译提示才不会错；
  // 同时把语言同步给非 React 场景的 t()
  useEffect(() => {
    setCurrentLang(lang);
    const hit = LANGS.find((l) => l.id === lang);
    document.documentElement.lang = hit ? hit.htmlLang : lang;
  }, [lang]);

  const t = useCallback((zh: string, en: string) => pick(lang, zh, en), [lang]);

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n() 必须在 <I18nProvider> 内使用');
  return ctx;
}
