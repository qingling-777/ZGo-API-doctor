/**
 * 文档级元信息（title / description / og:*）随语言切换。
 *
 * 为什么不直接写死在 index.html：
 *   · index.html 是静态的，一份 HTML 只能有一种语言；
 *   · 爬虫与分享卡片读的是静态那份，所以 index.html 保留**英文**（仓库面向海外）；
 *   · 运行时切到中文时，由这里把 title/description 换掉，用户看到的标签页标题不会串语言。
 */

import type { Lang } from './i18n';

const TITLE = {
  zh: 'ZGo API Doctor — AI API 接口健康检测工具',
  en: 'ZGo API Doctor — find out whether an AI API actually works',
};

const DESCRIPTION = {
  zh: '在浏览器里直连检测任意 AI API 中转/代理接口：模型发现、Chat 与 SSE 探测、A/B/F 分级与健康评分。API Key 不经过任何服务器。',
  en: 'Probe any AI API endpoint straight from your browser: model discovery, Chat and SSE probes, A/B/F grading and a health score. Your API key never touches a server.',
};

/** 把 title / description / og:* 写成当前语言；无对应 meta 标签时静默跳过。 */
export function applyDocumentMeta(lang: Lang): void {
  const title = TITLE[lang] ?? TITLE.en;
  const description = DESCRIPTION[lang] ?? DESCRIPTION.en;

  document.title = title;
  for (const [selector, value] of [
    ['meta[name="description"]', description],
    ['meta[property="og:title"]', title],
    ['meta[property="og:description"]', description],
    ['meta[name="twitter:title"]', title],
    ['meta[name="twitter:description"]', description],
  ] as const) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', value);
  }
}
