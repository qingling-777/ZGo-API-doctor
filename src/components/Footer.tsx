import { Logo } from './Logo';
import { Shield, WifiOff, Terminal, GitFork } from 'lucide-react';
import { CONTACT_EMAIL, GITHUB_URL, HOSTED_URL, SHOW_HOSTED_LINK } from '../lib/site';
import { useI18n } from '../lib/i18n';

export function Footer() {
  const { t } = useI18n();

  // 链接与徽章都依赖 t()，因此放在组件内构造
  const footerLinks = [
    {
      title: t('产品', 'Product'),
      links: [
        { label: t('功能特性', 'Features'), href: '#/features' },
        { label: t('检测流程', 'How it works'), href: '#/how-it-works' },
        { label: t('技术原理', 'Under the hood'), href: '#/tech' },
        { label: t('Key 去哪了', 'Where your key goes'), href: '#/key-trust' },
        { label: t('立即体验', 'Try it now'), href: '#/detect' },
      ],
    },
    {
      title: t('资源', 'Resources'),
      links: [
        { label: t('集成指南', 'Integration guide'), href: '#/integration' },
        { label: t('更新日志', 'Changelog'), href: '#/changelog' },
        { label: t('源码仓库', 'Source repository'), href: GITHUB_URL },
        ...(SHOW_HOSTED_LINK ? [{ label: t('在线体验', 'Hosted demo'), href: HOSTED_URL }] : []),
      ],
    },
    {
      title: t('条款', 'Legal'),
      links: [
        { label: t('服务条款', 'Terms of service'), href: '#/terms' },
        { label: t('隐私政策', 'Privacy policy'), href: '#/privacy' },
      ],
    },
    {
      title: t('更多', 'More'),
      links: [
        { label: t('关于我们', 'About'), href: '#/about' },
        { label: t('联系我们', 'Contact'), href: `mailto:${CONTACT_EMAIL}` },
      ],
    },
  ];

  // 只展示可验证为真的能力声明 —— 这些标签都能在源码里逐条核对
  const trustIcons = [
    { icon: Shield, label: t('零信任直连', 'Zero-trust direct') },
    { icon: WifiOff, label: t('无后端', 'No backend') },
    { icon: Terminal, label: t('开源 AGPL', 'AGPL-3.0') },
    { icon: GitFork, label: t('可自由 Fork', 'Fork-friendly') },
  ];

  return (
    <footer className="relative border-t border-ink-700/40 bg-ink-900/40 backdrop-blur-xl" style={{ zIndex: 1 }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-8">
            <div className="col-span-2 lg:col-span-2">
              <Logo size="sm" />
              <p className="mt-4 text-sm text-ink-400 max-w-xs leading-relaxed">
                {t(
                  '为 AI 应用提供专业的 API 接口健康诊断。从连接到安全，全链路可视化检测。',
                  'Professional API health diagnostics for AI applications. The whole path — from connection to auth — made visible.',
                )}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {trustIcons.map((item) => (
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

            {footerLinks.map((section) => (
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
              {t(
                '纯前端静态应用 · 无需后端 · 你的 API Key 不会离开浏览器',
                'Static frontend only · No backend · Your API key never leaves the browser',
              )}
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
                  {t('AGPL-3.0 开源', 'AGPL-3.0 open source')}
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
                      {t('在线版本', 'Hosted version')}
                    </a>
                    <span className="text-ink-600">·</span>
                  </>
                )}
                <a href="#/terms" className="text-ink-400 hover:text-ink-200 transition-colors">
                  {t('服务条款', 'Terms')}
                </a>
                <span className="text-ink-600">·</span>
                <a href="#/privacy" className="text-ink-400 hover:text-ink-200 transition-colors">
                  {t('隐私政策', 'Privacy')}
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
