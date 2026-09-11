import { Logo } from './Logo';
import { Shield, WifiOff, Terminal, GitFork } from 'lucide-react';
import { CONTACT_EMAIL, GITHUB_URL, HOSTED_URL, SHOW_HOSTED_LINK } from '../lib/site';


const FOOTER_LINKS = [
  {
    title: '产品',
    links: [
      { label: '功能特性', href: '#/features' },
      { label: '检测流程', href: '#/how-it-works' },
      { label: '技术原理', href: '#/tech' },
      { label: 'Key 去哪了', href: '#/key-trust' },
      { label: '立即体验', href: '#/detect' },
    ],
  },
  {
    title: '资源',
    links: [
      { label: '集成指南', href: '#/integration' },
      { label: '更新日志', href: '#/changelog' },
      { label: '源码仓库', href: GITHUB_URL },
      ...(SHOW_HOSTED_LINK ? [{ label: '在线体验', href: HOSTED_URL }] : []),
    ],
  },
  {
    title: '条款',
    links: [
      { label: '服务条款', href: '#/terms' },
      { label: '隐私政策', href: '#/privacy' },
    ],
  },
  {
    title: '更多',
    links: [
      { label: '关于我们', href: '#/about' },
      { label: '联系我们', href: `mailto:${CONTACT_EMAIL}` },
    ],
  },
];

// 只展示可验证为真的能力声明 —— 这些标签都能在源码里逐条核对
const TRUST_ICONS = [
  { icon: Shield, label: '零信任直连' },
  { icon: WifiOff, label: '无后端' },
  { icon: Terminal, label: '开源 AGPL' },
  { icon: GitFork, label: '可自由 Fork' },
];

export function Footer() {
  return (
    <footer className="relative border-t border-ink-700/40 bg-ink-900/40 backdrop-blur-xl" style={{ zIndex: 1 }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-8">
            <div className="col-span-2 lg:col-span-2">
              <Logo size="sm" />
              <p className="mt-4 text-sm text-ink-400 max-w-xs leading-relaxed">
                为 AI 应用提供专业的 API 接口健康诊断。从连接到安全，全链路可视化检测。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {TRUST_ICONS.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-ink-800/50 border border-ink-700/40 backdrop-blur-sm"
                  >
                    <item.icon size={13} className="text-ink-300" />
                    <span className="text-2xs font-mono text-ink-300 tracking-wide">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {FOOTER_LINKS.map((section) => (
              <div key={section.title}>
                <h4 className="label-mono mb-4">{section.title}</h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-ink-300 hover:text-ink-50 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-ink-700/30 flex flex-col items-center gap-4">
            <p className="text-xs text-ink-400 text-center leading-relaxed">
              纯前端静态应用 · 无需后端 · 你的 API Key 不会离开浏览器
            </p>
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-ink-400 text-center sm:text-left">
                © 2026 ZGo API Doctor
                {' · '}
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-ink-200 transition-colors"
                >
                  AGPL-3.0 开源
                </a>
              </p>
              <div className="flex items-center gap-3 text-xs">
                {SHOW_HOSTED_LINK && (
                  <>
                    <a
                      href={HOSTED_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-300 hover:text-primary-200 transition-colors"
                    >
                      在线版本
                    </a>
                    <span className="text-ink-600">·</span>
                  </>
                )}
                <a href="#/terms" className="text-ink-400 hover:text-ink-200 transition-colors">
                  服务条款
                </a>
                <span className="text-ink-600">·</span>
                <a href="#/privacy" className="text-ink-400 hover:text-ink-200 transition-colors">
                  隐私政策
                </a>
                <span className="text-ink-600">·</span>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-mono text-ink-400 hover:text-ink-200 transition-colors"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
