import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { CONTACT_EMAIL, POLICY_EFFECTIVE_DATE, BUSINESS_ENTITY, GITHUB_URL } from '../lib/site';

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

export function TermsPage() {
  const effective = POLICY_EFFECTIVE_DATE.replace(/-/g, ' / ');
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-4">
            <FileText size={13} />
            <span>法律条款</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">服务条款</h1>
          <p className="mt-3 text-ink-300 leading-relaxed max-w-md mx-auto">
            使用 ZGo API Doctor 前，请先了解这些约定。
          </p>
          <p className="mt-2 text-2xs font-mono text-ink-500">生效日期：{effective}</p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-8">
          <Section title="一、这是什么">
            <p>
              ZGo API Doctor 是一款<strong className="text-ink-100">开源、纯前端</strong>的 API 接口健康诊断工具，
              提供模型发现、连接与流式（SSE）探测、分级评分与诊断报告生成。
            </p>
            <p>
              它<strong className="text-ink-100">不是一项在线服务</strong>：没有后端、没有账号体系、不收取任何费用。
              代码以 AGPL-3.0 发布，任何人都可以自行部署一份，或按需修改。
            </p>
            <p>
              我们<strong className="text-ink-100">不代理销售、也不转售任何第三方 API 服务</strong>；
              你与上游 API 供应商之间的服务关系与费用结算，由你与对方自行约定。
            </p>
          </Section>

          <Section title="二、使用规范">
            <p>使用本工具时，你同意不会：</p>
            <Bullets
              items={[
                <>
                  对<strong className="text-ink-100">你不拥有合法访问权限</strong>的 API 接口发起探测。
                </>,
                <>利用本工具对他人系统进行未授权扫描、渗透、压力测试或攻击。</>,
                <>绕过、规避上游服务方的限流、鉴权或其他安全措施。</>,
                <>将本工具用于任何违反中华人民共和国法律法规的用途。</>,
              ]}
            />
            <p>
              探测会向目标接口发出<strong className="text-ink-100">真实请求</strong>并可能消耗你的账户余额，
              请在发起前确认你已获得相应授权，并自行评估由此产生的费用。
            </p>
          </Section>

          <Section title="三、你的责任">
            <Bullets
              items={[
                <>
                  <strong className="text-ink-100">API Key 由你自行保管。</strong>
                  本工具不存储、不上传你的 Key；请勿在共享设备上填写，并注意表单草稿可能残留在本地存储中。
                </>,
                <>
                  <strong className="text-ink-100">分享链接会公开报告内容。</strong>
                  报告数据被编码在链接中，任何拿到链接的人都能查看，请自行判断分享范围。
                </>,
                <>你基于检测结果做出的决策与行为，由你自行承担相应后果。</>,
              ]}
            />
          </Section>

          <Section title="四、诊断结果的性质">
            <p>
              检测结果反映的是<strong className="text-ink-100">发起检测那一刻</strong>的接口状态，
              受网络波动、上游限流、地域差异、浏览器跨域策略等因素影响，可能存在偏差。
            </p>
            <p>
              检测结果、评分与诊断建议<strong className="text-ink-100">仅供参考</strong>，
              不构成对任何第三方服务的可用性、性能或安全性的保证或承诺。
            </p>
          </Section>

          <Section title="五、知识产权与许可">
            <p>
              本项目源代码以 <strong className="text-ink-100">AGPL-3.0-only</strong> 开源，
              你可以在该许可条件下自由使用、修改与再分发（包括商业用途）。
            </p>
            <p>
              <strong className="text-ink-100">版权许可不等于商标许可。</strong>
              「ZGo」名称与标识不在 AGPL 授权范围内；若你基于本项目部署自己的服务，
              请一并替换品牌标识与主体信息，详见仓库中的 NOTICE 文件。
            </p>
            <p>
              仓库地址：
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="text-primary-300 underline underline-offset-2 hover:text-primary-200 transition-colors"
              >
                {GITHUB_URL}
              </a>
            </p>
          </Section>

          <Section title="六、责任限制">
            <p>
              本工具按<strong className="text-ink-100">「现状」</strong>提供，不附带任何明示或默示的担保。
              在法律允许的最大范围内，{BUSINESS_ENTITY} 不对因使用或无法使用本工具而产生的
              直接或间接损失、利润损失、数据丢失或业务中断承担责任。
            </p>
          </Section>

          <Section title="七、协议变更">
            <p>
              我们可能适时修订本条款，更新后将在本页面公布新的生效日期。
              若你不同意修订后的条款，应停止使用本工具。
            </p>
          </Section>

          <Section title="八、联系我们">
            <p>如对本条款有任何疑问，请发送邮件至：</p>
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
