import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { CONTACT_EMAIL, POLICY_EFFECTIVE_DATE } from '../lib/site';
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

export function PrivacyPage() {
  const { t } = useI18n();
  const effective = POLICY_EFFECTIVE_DATE.replace(/-/g, ' / ');
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-4">
            <ShieldCheck size={13} />
            <span>{t('法律条款', 'LEGAL')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
            {t('隐私政策', 'Privacy policy')}
          </h1>
          <p className="mt-3 text-ink-300 leading-relaxed max-w-md mx-auto">
            {t(
              '我们收集什么、为什么不收集更多，以及你能怎么控制自己的数据。',
              'What we collect, why we cannot collect more, and how you stay in control of your data.'
            )}
          </p>
          <p className="mt-2 text-2xs font-mono text-ink-500">{t('生效日期', 'Effective')}: {effective}</p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-8">
          <Section title={t('一、一句话版本', '1. The short version')}>
            <p>
              {t('本工具是', 'This tool is a ')}
              <strong className="text-ink-100">{t('纯前端静态页面', 'pure static frontend')}</strong>
              {t('，没有后端服务、没有数据库、没有账号体系。我们', ' — no backend, no database, no accounts. We ')}
              <strong className="text-ink-100">{t('无法', 'cannot')}</strong>
              {t(
                '收集你的任何数据 —— 不是「承诺不收集」，是结构上做不到。',
                ' collect any of your data. That is not a promise — it is structurally impossible.'
              )}
            </p>
            <p>
              {t('唯一会把数据发出浏览器的动作，是你自己发起的：向', 'The only thing that sends data out of your browser is an action you start yourself: a probe to ')}
              <strong className="text-ink-100">{t('你填写的那个 API 地址', 'the API address you entered')}</strong>
              {t('发探测请求。请求发往哪里、带什么 Key，完全由你决定。', '. Where the request goes and which key it carries is entirely up to you.')}
            </p>
          </Section>

          <Section title={t('二、API Key', '2. Your API key')}>
            <Bullets
              items={[
                <>
                  {t('你的 API Key 只存在于', 'Your API key only exists in ')}
                  <strong className="text-ink-100">{t('当前页面的内存', 'this page’s memory')}</strong>
                  {t('中，用于构造发往目标接口的请求头。', ', where it is used to build the headers for the target endpoint.')}
                </>,
                <>
                  {t('我们', 'We do ')}
                  <strong className="text-ink-100">{t('不存储、不上传、不记录', 'not store, upload or log')}</strong>
                  {t(
                    '它。请求由浏览器 `fetch` 直发你填的 Base URL，可在 DevTools → Network 中逐条验证。',
                    ' it. The browser `fetch` sends requests to the Base URL you entered, and you can verify each one in DevTools → Network.'
                  )}
                </>,
                <>
                  {t('Key 在界面上以', 'The key is shown ')}
                  <strong className="text-ink-100">{t('脱敏形式', 'masked')}</strong>
                  {t(
                    '展示（仅前后各留几位），分享链接与导出报告中也只包含脱敏后的形式。',
                    ' in the UI (a few leading and trailing characters only), and the same masked form is all that appears in share links and exported reports.'
                  )}
                </>,
                <>
                  {t('唯一例外：若你选择把 Key 填进表单草稿，它会以明文存在', 'One exception: if you let the form keep a draft, the key is stored in plain text in ')}
                  <strong className="text-ink-100">{t('你自己浏览器的 localStorage', "your own browser's localStorage")}</strong>
                  {t('里（见第四节）。这是我们唯一触及 Key 的地方，且仅在本机。', ' (see section 4). That is the only place the key ever lands, and it stays on your machine.')}
                </>,
              ]}
            />
          </Section>

          <Section title={t('三、检测过程产生的数据', '3. Data produced by a check')}>
            <Bullets
              items={[
                <>
                  {t(
                    '目标 Base URL、被测模型 ID、响应延迟、首字节时间、HTTP 状态码、错误信息、返回内容预览等。',
                    'The target Base URL, the model IDs being checked, response latency, time to first byte, HTTP status codes, error messages, a preview of the response, and so on.'
                  )}
                </>,
                <>
                  {t('这些数据', 'This data ')}
                  <strong className="text-ink-100">{t('只存在于你的浏览器内存', 'lives only in your browser memory')}</strong>
                  {t('，用于当场渲染诊断报告。', ' and is used to render the report on the spot.')}
                </>,
                <>
                  {t('刷新页面即消失 —— 我们没有任何地方可以保存它。', 'Refreshing the page makes it disappear — there is nowhere for us to keep it.')}
                </>,
              ]}
            />
          </Section>

          <Section title={t('四、本地存储（localStorage）', '4. Local storage (localStorage)')}>
            <p>
              {t('以下数据保存在你自己的浏览器里，不会离开本机：', 'The following stays in your own browser and never leaves your machine:')}
            </p>
            <Bullets
              items={[
                <>
                  {t(
                    '检测表单草稿：Base URL、协议、所选模型，以及（若你勾选了记住）API Key。',
                    'The check form draft: Base URL, protocol, selected models, and — only if you asked to remember it — the API key.'
                  )}
                </>,
                <>{t('界面偏好设置。', 'UI preferences.')}</>,
                <>
                  {t(
                    '你可以随时通过浏览器设置清除这些数据，不影响工具继续使用。',
                    'You can clear this at any time through your browser settings, and the tool keeps working.'
                  )}
                </>,
              ]}
            />
          </Section>

          <Section title={t('五、分享链接请注意', '5. A word about share links')}>
            <p>
              {t('诊断报告支持生成分享链接，', 'A report can be turned into a share link: ')}
              <strong className="text-ink-100">{t('检测结果数据被编码在链接本身当中', 'the result data is encoded in the link itself')}</strong>
              {t(
                '（压缩后放在 URL 的 hash 片段里，不经过任何服务器）。任何获得该链接的人都可以查看其中的内容，因此请勿在公开场合分享包含敏感信息的报告链接。',
                ', compressed into the URL hash and never passed through any server. Anyone who has the link can read what is inside it, so do not post report links containing sensitive information in public.'
              )}
            </p>
            <p>
              {t('由于数据在 `#` 之后，这部分内容', 'Because the data sits after `#`, it is ')}
              <strong className="text-ink-100">{t('不会', 'never')}</strong>
              {t(
                '随 HTTP 请求发送到托管服务器 —— 这也是我们把数据放在 hash 而非 query 里的原因。',
                ' sent to the hosting server with the HTTP request. That is exactly why we put it in the hash and not the query string.'
              )}
            </p>
          </Section>

          <Section title={t('六、第三方统计与分析', '6. Third-party analytics')}>
            <p>
              {t('本项目', 'This project uses ')}
              <strong className="text-ink-100">{t('未接入任何第三方统计、分析或广告服务', 'no third-party analytics, tracking or advertising')}</strong>
              {t(
                '（例如百度统计、Google Analytics 等），代码中也没有任何埋点。',
                ' (no Google Analytics, no Baidu Tongji, nothing of that kind), and there is no tracking code anywhere in the source.'
              )}
            </p>
            <p>
              {t(
                '页面会从 Google Fonts 加载字体。如果你希望完全避免这次外部请求，可以自行移除 `index.html` 中的字体引用，改用系统字体。',
                'The page loads fonts from Google Fonts. If you want to avoid even that external request, remove the font reference from `index.html` and fall back to system fonts.'
              )}
            </p>
          </Section>

          <Section title={t('七、你的权利', '7. Your rights')}>
            <p>
              {t(
                '由于我们不持有你的任何数据，你无需向我们申请查阅、更正或删除 —— 清除浏览器数据即可彻底抹去本工具留下的所有痕迹。',
                'Since we hold none of your data, there is nothing to request, correct or delete — clearing your browser data wipes every trace this tool could have left.'
              )}
            </p>
          </Section>

          <Section title={t('八、政策更新', '8. Changes to this policy')}>
            <p>
              {t(
                '当我们调整数据处理方式时，会更新本政策并在本页面公布新的生效日期。若变更涉及你的重要权利，我们会通过仓库的 Release 说明另行告知。',
                'If we change how data is handled, we update this page and publish a new effective date. If a change affects your rights in a meaningful way, we will also call it out in the repository release notes.'
              )}
            </p>
          </Section>

          <Section title={t('九、联系我们', '9. Contact')}>
            <p>
              {t(
                '如对本政策有任何疑问、意见或发现了安全问题，请发送邮件至：',
                'Questions about this policy, feedback, or a security issue you found? Email us at:'
              )}
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
