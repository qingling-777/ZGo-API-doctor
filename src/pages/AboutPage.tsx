import type { ReactNode } from 'react';
import { Activity, ShieldCheck, Code2, Mail } from 'lucide-react';
import { CONTACT_EMAIL, GITHUB_URL } from '../lib/site';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-ink-50 mb-2.5">{title}</h2>
      <div className="text-sm text-ink-300 leading-relaxed space-y-2.5">{children}</div>
    </section>
  );
}

export function AboutPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-4">
            <Activity size={13} />
            <span>关于我们</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
            ZGo API Doctor
          </h1>
          <p className="mt-3 text-ink-300 leading-relaxed max-w-md mx-auto">
            一个专注于 AI API 接口健康检测的开源工具。
          </p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-8">
          <Section title="我们是谁">
            <p>
              ZGo API Doctor 是一个面向 AI 开发者的<strong className="text-ink-100">接口健康检测工具</strong>。
              我们相信，把 API 接到应用里之前，应该先确认它「真的能用、响应多快、会不会在流式输出中途断掉」。
            </p>
            <p>
              因此我们做了这样一件事：粘贴一个 Base URL，自动发现它提供的全部模型，再逐一对每个模型做
              Chat 与 SSE（流式）探测，最后给出评分、延迟、可用性和错误分类，生成一份可分享的诊断报告。
            </p>
          </Section>

          <Section title="我们做什么">
            <div className="grid sm:grid-cols-3 gap-3 pt-1">
              {[
                { icon: Activity, t: '连接探测', d: '发现 /v1/models，逐模型验证 Chat 与流式响应。' },
                { icon: ShieldCheck, t: '零信任直连', d: '请求从浏览器直达你的接口，Key 不经过任何服务器。' },
                { icon: Code2, t: '诊断报告', d: 'A/B/F 分级、健康评分、延迟分布，可分享可导出。' },
              ].map((f) => (
                <div key={f.t} className="rounded-xl bg-ink-800/40 border border-ink-700/40 p-4">
                  <f.icon size={16} className="text-primary-300 mb-2" />
                  <div className="text-sm font-semibold text-ink-50">{f.t}</div>
                  <div className="mt-1 text-2xs text-ink-400 leading-relaxed">{f.d}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="我们的原则">
            <div className="space-y-2.5">
              <p className="flex gap-2.5">
                <ShieldCheck size={16} className="text-primary-300 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-ink-100">不卖 API，只做检测。</strong>
                  我们不是中转站，不代理、不转售任何模型流量，只负责告诉你接口的真实状态。
                </span>
              </p>
              <p className="flex gap-2.5">
                <ShieldCheck size={16} className="text-primary-300 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-ink-100">零信任直连。</strong>
                  你的 API Key 只在「你的浏览器」与「你的 API 服务」之间传输，
                  不经过任何中间服务器 —— 打开 DevTools 就能验证。
                </span>
              </p>
              <p className="flex gap-2.5">
                <ShieldCheck size={16} className="text-primary-300 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-ink-100">最小必要收集。</strong>
                  本工具是纯前端静态页面，没有后端与数据库，因此<strong className="text-ink-100">不收集任何数据</strong>。
                  唯一会触及 Key 的地方是表单草稿（存在你自己浏览器的 localStorage 里），可随时清除。
                </span>
              </p>
            </div>
          </Section>

          <Section title="开源">
            <p>
              本项目以 <strong className="text-ink-100">AGPL-3.0</strong> 完全开源 ——
              欢迎 Star、提 Issue、贡献代码，也欢迎自行部署一份。
            </p>
            <p>
              选用 AGPL 而非 MIT，是因为它含有一条对网络服务特别重要的约束（§13）：
              你若修改本程序并通过网络向用户提供服务，必须公开修改后的源代码。
              也就是说，商业使用没问题，但不能改成闭源 SaaS。
            </p>
            <p>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-300 hover:text-primary-200 transition-colors font-mono text-sm"
              >
                <Code2 size={14} />
                {GITHUB_URL.replace(/^https?:\/\//, '').replace(/\.git$/, '')}
              </a>
            </p>
          </Section>

          <Section title="联系我们">
            <p>
              有任何问题、建议或合作意向，欢迎通过以下方式联系我们：
            </p>
            <p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 text-primary-300 underline underline-offset-2 hover:text-primary-200 transition-colors font-mono"
              >
                <Mail size={14} />
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
