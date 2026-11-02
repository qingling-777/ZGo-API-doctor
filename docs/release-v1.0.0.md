# v1.0.0 — first public release

**A zero-trust, browser-side health checker for OpenAI-compatible API endpoints.**

Paste a Base URL and an API key. ZGo API Doctor lists the models, sends one real chat request and
one SSE streaming request per model, then produces a report with an A/B/F grade and a 0–100
health score you can share as a link or export as HTML.

No backend. No account. No telemetry. The key never leaves your browser — every request is a
plain `fetch()` from the page straight to the endpoint you typed, verifiable in DevTools → Network.

## Highlights

- **Zero-trust probing** — the key appears only in the request header sent to the provider you
  chose. The engine is a single readable file: [`src/lib/probeDirect.ts`](src/lib/probeDirect.ts).
- **Model discovery without quota cost** — `/v1/models` gives you the catalogue; nothing is spent
  until you run a probe.
- **Chat + SSE double probe** — per model: one normal request, one `stream: true` request,
  recording latency, TTFT and chunk count.
- **A/B/F grading and a 0–100 score** — one comparable number when you are choosing between
  several resellers, with the raw per-model data kept so you can judge for yourself.
- **Pre-flight panel** — see every request that will be sent (URL, headers, body) before it goes
  out, with the key redacted.
- **Shareable and exportable reports** — the report is encoded into the URL hash, so a link is the
  whole report; export produces a self-contained HTML file that opens offline.
- **Five protocol templates** — OpenAI, Anthropic, Gemini, Mistral, Cohere, with automatic path and
  auth handling. Aliases such as `claude`, `google` and `command` are normalised.

## Quick start

```bash
git clone https://github.com/qingling-777/ZGo-API-doctor.git
cd ZGo-API-doctor
npm install
npm run dev        # http://localhost:5173
```

Build a static bundle with `npm run build` (output in `dist/`) and host it anywhere — Vercel,
Netlify, Nginx, object storage. A prebuilt `dist` is attached to this release as
`zgo-api-doctor-v1.0.0-dist.zip`.

## Known limitations

- **The interface is currently in Simplified Chinese.** The probing logic, report structure and
  exported HTML are language-neutral, but the UI strings are not yet externalised. i18n is on the
  roadmap; the engine is unaffected.
- **No hosted demo.** There is no official online instance right now, so run it locally or deploy
  your own copy — the result is identical, because everything happens in your browser.
- **The target endpoint must allow CORS.** Browsers require `Access-Control-Allow-Origin` from the
  provider. Most user-facing services send it; server-oriented APIs usually do not. See the FAQ in
  the README for the three workarounds, and note that a proxy breaks the zero-trust premise.
- **Probing costs quota.** Each probe is a real request. The tool tells you how many requests it
  will send and clamps `max_tokens` to 16.

## License

AGPL-3.0-only. Commercial use is allowed; modifications served over a network must be published
under the same licence (§13). The "ZGo" name and marks are **not** covered by the licence — see
[NOTICE.md](NOTICE.md).
