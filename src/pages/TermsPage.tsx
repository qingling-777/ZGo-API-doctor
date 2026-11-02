import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import {
  CONTACT_EMAIL,
  POLICY_EFFECTIVE_DATE,
  BUSINESS_ENTITY,
  BUSINESS_ENTITY_EN,
  GITHUB_URL,
} from '../lib/site';
import { useI18n } from '../lib/i18n';

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
  const { t } = useI18n();
  const effective = POLICY_EFFECTIVE_DATE.replace(/-/g, ' / ');
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-4">
            <FileText size={13} />
            <span>{t('法律条款', 'LEGAL')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
            {t('服务条款', 'Terms of service')}
          </h1>
          <p className="mt-3 text-ink-300 leading-relaxed max-w-md mx-auto">
            {t('使用 ZGo API Doctor 前，请先了解这些约定。', 'A few ground rules before you use ZGo API Doctor.')}
          </p>
          <p className="mt-2 text-2xs font-mono text-ink-500">{t('生效日期', 'Effective')}: {effective}</p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-8">
          <Section title={t('一、这是什么', '1. What this is')}>
            <p>
              {t('ZGo API Doctor 是一款', 'ZGo API Doctor is an ')}
              <strong className="text-ink-100">{t('开源、纯前端', 'open-source, pure-frontend')}</strong>
              {t(
                '的 API 接口健康诊断工具，提供模型发现、连接与流式（SSE）探测、分级评分与诊断报告生成。',
                ' tool for diagnosing API endpoints: model discovery, buffered and streaming (SSE) probes, graded scoring and diagnostic reports.'
              )}
            </p>
            <p>
              {t('它', 'It is ')}
              <strong className="text-ink-100">{t('不是一项在线服务', 'not an online service')}</strong>
              {t(
                '：没有后端、没有账号体系、不收取任何费用。代码以 AGPL-3.0 发布，任何人都可以自行部署一份，或按需修改。',
                ': no backend, no accounts, no fees. The code is released under AGPL-3.0, so anyone may deploy their own copy or modify it as needed.'
              )}
            </p>
            <p>
              {t('我们', 'We do ')}
              <strong className="text-ink-100">{t('不代理销售、也不转售任何第三方 API 服务', 'not resell or act as an agent for any third-party API service')}</strong>
              {t(
                '；你与上游 API 供应商之间的服务关系与费用结算，由你与对方自行约定。',
                '. The service relationship and billing between you and your upstream API provider are strictly between the two of you.'
              )}
            </p>
          </Section>

          <Section title={t('二、使用规范', '2. Acceptable use')}>
            <p>{t('使用本工具时，你同意不会：', 'By using this tool you agree not to:')}</p>
            <Bullets
              items={[
                <>
                  {t('对', 'Probe an API endpoint you do ')}
                  <strong className="text-ink-100">{t('你不拥有合法访问权限', 'not have lawful access to')}</strong>
                  {t('的 API 接口发起探测。', '.')}
                </>,
                <>
                  {t(
                    '利用本工具对他人系统进行未授权扫描、渗透、压力测试或攻击。',
                    'Use this tool to scan, penetrate, stress-test or attack anyone else’s systems without authorisation.'
                  )}
                </>,
                <>
                  {t(
                    '绕过、规避上游服务方的限流、鉴权或其他安全措施。',
                    'Bypass or evade rate limits, authentication or any other security control of the upstream provider.'
                  )}
                </>,
                <>
                  {t(
                    '将本工具用于任何违反中华人民共和国法律法规的用途。',
                    'Use this tool for any purpose that violates applicable law.'
                  )}
                </>,
              ]}
            />
            <p>
              {t('探测会向目标接口发出', 'Probes send ')}
              <strong className="text-ink-100">{t('真实请求', 'real requests')}</strong>
              {t(
                '并可能消耗你的账户余额，请在发起前确认你已获得相应授权，并自行评估由此产生的费用。',
                ' and may consume your account balance. Confirm you are authorised to do so, and judge the resulting cost yourself.'
              )}
            </p>
          </Section>

          <Section title={t('三、你的责任', '3. Your responsibility')}>
            <Bullets
              items={[
                <>
                  <strong className="text-ink-100">{t('API Key 由你自行保管。', 'Your API key is yours to look after.')}</strong>
                  {t(
                    '本工具不存储、不上传你的 Key；请勿在共享设备上填写，并注意表单草稿可能残留在本地存储中。',
                    'This tool neither stores nor uploads your key — but avoid entering it on a shared machine, and remember a form draft may linger in local storage.'
                  )}
                </>,
                <>
                  <strong className="text-ink-100">{t('分享链接会公开报告内容。', 'A share link exposes the report.')}</strong>
                  {t(
                    '报告数据被编码在链接中，任何拿到链接的人都能查看，请自行判断分享范围。',
                    'The report data is encoded in the link, so anyone who has it can read it. Decide for yourself who gets it.'
                  )}
                </>,
                <>
                  {t(
                    '你基于检测结果做出的决策与行为，由你自行承担相应后果。',
                    'You bear the consequences of the decisions and actions you take based on a check result.'
                  )}
                </>,
              ]}
            />
          </Section>

          <Section title={t('四、诊断结果的性质', '4. What a result actually tells you')}>
            <p>
              {t('检测结果反映的是', 'A result reflects the state of the endpoint ')}
              <strong className="text-ink-100">{t('发起检测那一刻', 'at the moment the check ran')}</strong>
              {t(
                '的接口状态，受网络波动、上游限流、地域差异、浏览器跨域策略等因素影响，可能存在偏差。',
                '. Network jitter, upstream rate limiting, geography and browser CORS policy can all skew it.'
              )}
            </p>
            <p>
              {t('检测结果、评分与诊断建议', 'Results, scores and suggestions are ')}
              <strong className="text-ink-100">{t('仅供参考', 'for information only')}</strong>
              {t(
                '，不构成对任何第三方服务的可用性、性能或安全性的保证或承诺。',
                ', and are not a warranty or promise about any third-party service’s availability, performance or security.'
              )}
            </p>
          </Section>

          <Section title={t('五、知识产权与许可', '5. Intellectual property and licensing')}>
            <p>
              {t('本项目源代码以 ', 'The source is released under ')}
              <strong className="text-ink-100">AGPL-3.0-only</strong>
              {t(
                ' 开源，你可以在该许可条件下自由使用、修改与再分发（包括商业用途）。',
                ', so you may use, modify and redistribute it freely under that licence, commercial use included.'
              )}
            </p>
            <p>
              <strong className="text-ink-100">{t('版权许可不等于商标许可。', 'A copyright licence is not a trademark licence.')}</strong>
              {t(
                '「ZGo」名称与标识不在 AGPL 授权范围内；若你基于本项目部署自己的服务，请一并替换品牌标识与主体信息，详见仓库中的 NOTICE 文件。',
                'The “ZGo” name and marks are not covered by AGPL. If you deploy your own service from this project, replace the branding and entity details too — see the NOTICE file in the repository.'
              )}
            </p>
            <p>
              {t('仓库地址：', 'Repository:')}
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

          <Section title={t('六、责任限制', '6. Limitation of liability')}>
            <p>
              {t('本工具按', 'This tool is provided ')}
              <strong className="text-ink-100">{t('「现状」', '“as is”')}</strong>
              {t('提供，不附带任何明示或默示的担保。在法律允许的最大范围内，', ', without warranty of any kind, express or implied. To the maximum extent permitted by law, ')}
              {t(BUSINESS_ENTITY, BUSINESS_ENTITY_EN)}
              {t(
                ' 不对因使用或无法使用本工具而产生的直接或间接损失、利润损失、数据丢失或业务中断承担责任。',
                ' is not liable for any direct or indirect loss, loss of profit, loss of data or business interruption arising from the use of, or inability to use, this tool.'
              )}
            </p>
          </Section>

          <Section title={t('七、协议变更', '7. Changes to these terms')}>
            <p>
              {t(
                '我们可能适时修订本条款，更新后将在本页面公布新的生效日期。若你不同意修订后的条款，应停止使用本工具。',
                'We may revise these terms from time to time and publish a new effective date on this page. If you do not accept a revision, stop using the tool.'
              )}
            </p>
          </Section>

          <Section title={t('八、联系我们', '8. Contact')}>
            <p>{t('如对本条款有任何疑问，请发送邮件至：', 'Questions about these terms? Email us at:')}</p>
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
