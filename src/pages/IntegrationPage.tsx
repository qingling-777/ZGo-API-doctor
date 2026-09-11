import type { ReactNode } from 'react';
import { Plug, Terminal, Braces, ShieldCheck } from 'lucide-react';

function Code({ children }: { children: ReactNode }) {
  return (
    <pre className="mt-2 text-xs font-mono leading-relaxed bg-ink-900/60 border border-ink-700/40 rounded-lg p-4 overflow-x-auto text-ink-200">
      {children}
    </pre>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-ink-50 mb-1.5">{title}</h3>
        <div className="text-sm text-ink-300 leading-relaxed space-y-2">{children}</div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: any; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-ink-800/40 border border-ink-700/40 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-primary-300" />
        <h3 className="text-sm font-semibold text-ink-50">{title}</h3>
      </div>
      <div className="text-sm text-ink-300 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export function IntegrationPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-4">
            <Plug size={13} />
            <span>集成指南</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">集成指南</h1>
          <p className="mt-3 text-ink-300 leading-relaxed max-w-md mx-auto">
            检测通过后，把你的接口接进自己的应用。整个过程都在你自己的代码里完成，不经过本站服务器。
          </p>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 sm:p-8">
            <h2 className="text-base font-semibold text-ink-50 mb-5">三步接入</h2>
            <div className="space-y-6">
              <Step n={1} title="拿到你的 Base URL 与 API Key">
                <p>
                  在检测页填过的<code className="font-mono text-primary-300"> Base URL </code>
                  和<code className="font-mono text-primary-300"> API Key </code>，就是接入时要用的两样东西。
                  Key 只写在你自己的代码或环境变量里，不要提交到公开仓库。
                </p>
              </Step>
              <Step n={2} title="按协议选择客户端">
                <p>根据接口遵循的协议（OpenAI / Anthropic / Gemini / Mistral / Cohere），选对应的 SDK 或直接 curl。</p>
              </Step>
              <Step n={3} title="替换三件套">
                <p>把示例里的 base_url、api_key、model 换成你自己的值即可。OpenAI 兼容协议还可复用绝大多数现成客户端。</p>
              </Step>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="text-base font-semibold text-ink-50">代码示例</h2>
            <Card icon={Terminal} title="curl（OpenAI 兼容）">
              <Code>{`curl https://<你的 Base URL>/chat/completions \\
  -H "Authorization: Bearer <你的 API Key>" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"<模型名>","messages":[{"role":"user","content":"你好"}]}'`}</Code>
            </Card>
            <Card icon={Braces} title="Python（openai SDK，base_url 指向你的接口）">
              <Code>{`from openai import OpenAI

client = OpenAI(
    base_url="<你的 Base URL>",
    api_key="<你的 API Key>",
)
resp = client.chat.completions.create(
    model="<模型名>",
    messages=[{"role": "user", "content": "你好"}],
)
print(resp.choices[0].message.content)`}</Code>
            </Card>
            <Card icon={Braces} title="Python（anthropic SDK）">
              <Code>{`import anthropic

client = anthropic.Anthropic(
    base_url="<你的 Base URL>",
    api_key="<你的 API Key>",
)
msg = client.messages.create(
    model="<模型名>",
    max_tokens=1024,
    messages=[{"role": "user", "content": "你好"}],
)
print(msg.content)`}</Code>
            </Card>
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-semibold text-ink-50">协议差异速查</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-ink-300">
                <thead>
                  <tr className="text-left text-2xs text-ink-400 border-b border-ink-700/40">
                    <th className="py-2 pr-4 font-medium">协议</th>
                    <th className="py-2 pr-4 font-medium">鉴权头</th>
                    <th className="py-2 font-medium">对话端点</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {[
                    ['OpenAI', 'Authorization: Bearer', '/chat/completions'],
                    ['Anthropic', 'x-api-key + anthropic-version', '/v1/messages'],
                    ['Gemini', 'x-goog-api-key', '/v1beta/models/{m}:generateContent'],
                    ['Mistral', 'Authorization: Bearer', '/chat/completions'],
                    ['Cohere', 'Authorization: Bearer', '/chat/completions'],
                  ].map((r) => (
                    <tr key={r[0]} className="border-b border-ink-700/20">
                      <td className="py-2 pr-4 text-ink-100">{r[0]}</td>
                      <td className="py-2 pr-4">{r[1]}</td>
                      <td className="py-2">{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="flex gap-2.5 text-sm text-ink-400 leading-relaxed">
              <ShieldCheck size={16} className="text-primary-300 shrink-0 mt-0.5" />
              <span>
                提示：接入只是把请求发到<strong className="text-ink-200">你自己指定的接口</strong>，全程在你的客户端完成，
                本站不会经手你的 Key 或流量。更多协议细节以各厂商官方文档为准。
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
