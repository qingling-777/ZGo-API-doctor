import { History } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface Entry {
  date: string;
  title: { zh: string; en: string };
  items: { zh: string; en: string }[];
}

const ENTRIES: Entry[] = [
  {
    date: '2026-09-11',
    title: { zh: '开源发布', en: 'Open-sourced' },
    items: [
      {
        zh: '以 AGPL-3.0 开源前端与检测引擎：浏览器直连探测，API Key 不经过任何服务器。',
        en: 'The frontend and probe engine are open-sourced under AGPL-3.0: probes run straight from the browser, so the API key never passes through any server.',
      },
      {
        zh: '移除全部后端依赖 —— 账号、支付、密钥库、定时监控等需要服务端的功能不在本仓库中。',
        en: 'All backend dependencies removed — accounts, payments, the key vault and scheduled monitoring are server-side features and are not part of this repository.',
      },
      {
        zh: '接入模板与报告导出改为纯前端实现：前者按协议本地生成，后者导出为可离线打开的 HTML。',
        en: 'Integration templates and report export are now pure frontend: templates are generated locally per protocol, and the report exports to a standalone HTML file you can open offline.',
      },
      {
        zh: '隐私政策与服务条款按「纯前端、无后端」的实际情况重写。',
        en: 'Privacy policy and terms rewritten to match what this actually is: a pure frontend with no backend.',
      },
    ],
  },
  {
    date: '2026-09-10',
    title: { zh: '品牌与信任建设', en: 'Brand and trust' },
    items: [
      {
        zh: '全新品牌视觉：站点 Logo、favicon 统一替换，右上角新增 GitHub 入口。',
        en: 'New brand identity: site logo and favicon replaced, with a GitHub link in the top-right corner.',
      },
      {
        zh: '首页新增「零信任 · 源码自证」区块，把探测引擎的关键源码直接展示在页面上。',
        en: 'New “zero trust · read the source” section on the home page, showing the core probe code right on the page.',
      },
      {
        zh: '修正「关键行一字不差」的表述 —— 实际为节选，并补上指向原文件的链接。',
        en: 'Corrected a claim that the quoted code was verbatim — it is an excerpt, and a link to the original file was added.',
      },
    ],
  },
  {
    date: '2026-09-04',
    title: { zh: '视觉与动效定稿', en: 'Visual and motion pass' },
    items: [
      { zh: '首页粒子弧线架构图，发光视觉统一。', en: 'Particle-arc architecture diagram on the home page, unified glow treatment.' },
      { zh: '动效原语沉淀：磁性按钮、聚光灯、视差滚动。', en: 'Reusable motion primitives: magnetic buttons, spotlight, parallax.' },
    ],
  },
  {
    date: '2026-09-03',
    title: { zh: '多协议支持', en: 'Multi-protocol support' },
    items: [
      {
        zh: '检测支持 OpenAI / Anthropic / Gemini / Mistral / Cohere 五种协议规则，自动适配请求头与端点。',
        en: 'Checks support five protocol families — OpenAI, Anthropic, Gemini, Mistral and Cohere — adapting headers and endpoints automatically.',
      },
      { zh: '厂商 Logo 与协议选择器落地。', en: 'Vendor logos and the protocol picker shipped.' },
    ],
  },
  {
    date: '2026-09-02',
    title: { zh: '核心检测闭环', en: 'Core check loop' },
    items: [
      {
        zh: '粘贴 Base URL → 自动发现 /v1/models → 逐模型 Chat + SSE 探测 → A/B/F 分级 / 延迟 / 首字节 / 错误分类。',
        en: 'Paste a Base URL → auto-discover /v1/models → per-model Chat + SSE probes → A/B/F grading, latency, time-to-first-byte and error classification.',
      },
      {
        zh: '可分享诊断卡片，报告编码进链接生成分享地址。',
        en: 'Shareable diagnostic card: the report is encoded into the URL.',
      },
    ],
  },
];

export function ChangelogPage() {
  const { t } = useI18n();
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-4">
            <History size={13} />
            <span>{t('更新日志', 'CHANGELOG')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
            {t('更新日志', 'Changelog')}
          </h1>
          <p className="mt-3 text-ink-300 leading-relaxed max-w-md mx-auto">
            {t(
              '记录 ZGo API Doctor 每一次值得被看见的变化。',
              'Every change to ZGo API Doctor that is worth seeing.'
            )}
          </p>
        </div>

        <div className="space-y-6">
          {ENTRIES.map((e) => (
            <div key={e.date} className="glass rounded-2xl p-6 sm:p-7">
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-base font-semibold text-ink-50">{t(e.title.zh, e.title.en)}</h2>
                <span className="text-2xs font-mono text-ink-500">{e.date}</span>
              </div>
              <ul className="space-y-2">
                {e.items.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-ink-300 leading-relaxed">
                    <span className="text-primary-400 shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-primary-400/70" />
                    <span>{t(item.zh, item.en)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
