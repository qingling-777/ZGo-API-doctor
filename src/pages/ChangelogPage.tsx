import type { ReactNode } from 'react';
import { History } from 'lucide-react';

interface Entry {
  date: string;
  title: string;
  items: ReactNode[];
}

const ENTRIES: Entry[] = [
  {
    date: '2026-09-11',
    title: '开源发布',
    items: [
      <>以 AGPL-3.0 开源前端与检测引擎：浏览器直连探测，API Key 不经过任何服务器。</>,
      <>移除全部后端依赖 —— 账号、支付、密钥库、定时监控等需要服务端的功能不在本仓库中。</>,
      <>接入模板与报告导出改为纯前端实现：前者按协议本地生成，后者导出为可离线打开的 HTML。</>,
      <>隐私政策与服务条款按「纯前端、无后端」的实际情况重写。</>,
    ],
  },
  {
    date: '2026-09-10',
    title: '品牌与信任建设',
    items: [
      <>全新品牌视觉：站点 Logo、favicon 统一替换，右上角新增 GitHub 入口。</>,
      <>首页新增「零信任 · 源码自证」区块，把探测引擎的关键源码直接展示在页面上。</>,
      <>修正「关键行一字不差」的表述 —— 实际为节选，并补上指向原文件的链接。</>,
    ],
  },
  {
    date: '2026-09-04',
    title: '视觉与动效定稿',
    items: [
      <>首页粒子弧线架构图，发光视觉统一。</>,
      <>动效原语沉淀：磁性按钮、聚光灯、视差滚动。</>,
    ],
  },
  {
    date: '2026-09-03',
    title: '多协议支持',
    items: [
      <>检测支持 OpenAI / Anthropic / Gemini / Mistral / Cohere 五种协议规则，自动适配请求头与端点。</>,
      <>厂商 Logo 与协议选择器落地。</>,
    ],
  },
  {
    date: '2026-09-02',
    title: '核心检测闭环',
    items: [
      <>粘贴 Base URL → 自动发现 /v1/models → 逐模型 Chat + SSE 探测 → A/B/F 分级 / 延迟 / 首字节 / 错误分类。</>,
      <>可分享诊断卡片，报告编码进链接生成分享地址。</>,
    ],
  },
];

export function ChangelogPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-4">
            <History size={13} />
            <span>更新日志</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">更新日志</h1>
          <p className="mt-3 text-ink-300 leading-relaxed max-w-md mx-auto">
            记录 ZGo API Doctor 每一次值得被看见的变化。
          </p>
        </div>

        <div className="space-y-6">
          {ENTRIES.map((e) => (
            <div key={e.date} className="glass rounded-2xl p-6 sm:p-7">
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-base font-semibold text-ink-50">{e.title}</h2>
                <span className="text-2xs font-mono text-ink-500">{e.date}</span>
              </div>
              <ul className="space-y-2">
                {e.items.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-ink-300 leading-relaxed">
                    <span className="text-primary-400 shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-primary-400/70" />
                    <span>{item}</span>
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
