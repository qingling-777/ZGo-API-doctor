import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { CONTACT_EMAIL, POLICY_EFFECTIVE_DATE } from '../lib/site';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-ink-50 mb-2.5">{title}</h2>
      <div className="text-sm text-ink-300 leading-relaxed space-y-2.5">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function PrivacyPage() {
  const effective = POLICY_EFFECTIVE_DATE.replace(/-/g, ' / ');
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-4">
            <ShieldCheck size={13} />
            <span>法律条款</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">隐私政策</h1>
          <p className="mt-3 text-ink-300 leading-relaxed max-w-md mx-auto">
            我们收集什么、为什么不收集更多，以及你能怎么控制自己的数据。
          </p>
          <p className="mt-2 text-2xs font-mono text-ink-500">生效日期：{effective}</p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-8">
          <Section title="一、一句话版本">
            <p>
              本工具是<strong className="text-ink-100">纯前端静态页面</strong>，没有后端服务、没有数据库、没有账号体系。
              我们<strong className="text-ink-100">无法</strong>收集你的任何数据 —— 不是「承诺不收集」，是结构上做不到。
            </p>
            <p>
              唯一会把数据发出浏览器的动作，是你自己发起的：向<strong className="text-ink-100">你填写的那个 API 地址</strong>
              发探测请求。请求发往哪里、带什么 Key，完全由你决定。
            </p>
          </Section>

          <Section title="二、API Key">
            <Bullets
              items={[
                <>
                  你的 API Key 只存在于<strong className="text-ink-100">当前页面的内存</strong>中，用于构造发往目标接口的请求头。
                </>,
                <>
                  我们<strong className="text-ink-100">不存储、不上传、不记录</strong>它。请求由浏览器 `fetch` 直发你填的 Base URL，
                  可在 DevTools → Network 中逐条验证。
                </>,
                <>
                  Key 在界面上以<strong className="text-ink-100">脱敏形式</strong>展示（仅前后各留几位），
                  分享链接与导出报告中也只包含脱敏后的形式。
                </>,
                <>
                  唯一例外：若你选择把 Key 填进表单草稿，它会以明文存在<strong className="text-ink-100">你自己浏览器的
                  localStorage</strong> 里（见第四节）。这是我们唯一触及 Key 的地方，且仅在本机。
                </>,
              ]}
            />
          </Section>

          <Section title="三、检测过程产生的数据">
            <Bullets
              items={[
                <>目标 Base URL、被测模型 ID、响应延迟、首字节时间、HTTP 状态码、错误信息、返回内容预览等。</>,
                <>这些数据<strong className="text-ink-100">只存在于你的浏览器内存</strong>，用于当场渲染诊断报告。</>,
                <>刷新页面即消失 —— 我们没有任何地方可以保存它。</>,
              ]}
            />
          </Section>

          <Section title="四、本地存储（localStorage）">
            <p>以下数据保存在你自己的浏览器里，不会离开本机：</p>
            <Bullets
              items={[
                <>检测表单草稿：Base URL、协议、所选模型，以及（若你勾选了记住）API Key。</>,
                <>界面偏好设置。</>,
                <>你可以随时通过浏览器设置清除这些数据，不影响工具继续使用。</>,
              ]}
            />
          </Section>

          <Section title="五、分享链接请注意">
            <p>
              诊断报告支持生成分享链接，<strong className="text-ink-100">检测结果数据被编码在链接本身当中</strong>
              （压缩后放在 URL 的 hash 片段里，不经过任何服务器）。
              任何获得该链接的人都可以查看其中的内容，因此请勿在公开场合分享包含敏感信息的报告链接。
            </p>
            <p>
              由于数据在 `#` 之后，这部分内容<strong className="text-ink-100">不会</strong>随 HTTP 请求发送到托管服务器 —— 
              这也是我们把数据放在 hash 而非 query 里的原因。
            </p>
          </Section>

          <Section title="六、第三方统计与分析">
            <p>
              本项目<strong className="text-ink-100">未接入任何第三方统计、分析或广告服务</strong>
              （例如百度统计、Google Analytics 等），代码中也没有任何埋点。
            </p>
            <p>
              页面会从 Google Fonts 加载字体。如果你希望完全避免这次外部请求，可以自行移除
              `index.html` 中的字体引用，改用系统字体。
            </p>
          </Section>

          <Section title="七、你的权利">
            <p>
              由于我们不持有你的任何数据，你无需向我们申请查阅、更正或删除 —— 
              清除浏览器数据即可彻底抹去本工具留下的所有痕迹。
            </p>
          </Section>

          <Section title="八、政策更新">
            <p>
              当我们调整数据处理方式时，会更新本政策并在本页面公布新的生效日期。
              若变更涉及你的重要权利，我们会通过仓库的 Release 说明另行告知。
            </p>
          </Section>

          <Section title="九、联系我们">
            <p>
              如对本政策有任何疑问、意见或发现了安全问题，请发送邮件至：
            </p>
            <p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary-300 underline underline-offset-2 hover:text-primary-200 transition-colors font-mono"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
