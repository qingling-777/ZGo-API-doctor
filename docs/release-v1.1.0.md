# ZGo API Doctor v1.1.0 — English interface

The headline change: **the whole UI now speaks English as well as Chinese**, with a one-click switch. Everything else is unchanged — same probe engine, same report format, same zero-trust model.

## What's new

### Bilingual interface (English / Simplified Chinese)

- A `中文 / EN` switch in the header (desktop and mobile).
- First visit picks a language from the browser; the choice is stored in `localStorage` (`zgo.lang`) and remembered.
- `<html lang>`, the document title, `meta description` and the Open Graph tags follow the selected language, so screen readers and link previews stay consistent.

Translation is inline — `t('中文原文', 'English')` with both versions side by side — rather than a separate key catalogue. See [Languages](../README.md#languages) for the reasoning and for how to add a third language.

### English source comments

Comments and user-facing strings throughout `src/lib/probeDirect.ts` and `src/lib/mappers.ts` were rewritten in English. The engine now produces localised error text at call time, so a failure on the check page reads in the language you picked instead of always Chinese.

### Smaller fixes

- The report page timestamp is formatted for the selected language instead of always `zh-CN`.
- `index.html` static metadata is English (crawlers and link previews read that copy); the runtime swaps it when the UI is in Chinese.
- The language switch is keyboard reachable and labelled.

## Upgrade notes

Nothing to migrate. If you forked and customised the UI, your edits to component text will conflict — the surrounding code changed shape from bare strings to `t(zh, en)` calls.

## Known limitations

- **Only two languages ship.** The architecture supports more (see the README), but adding one means filling in a translation, not flipping a flag.
- **No hosted demo.** This is a static frontend with no backend; run it locally or deploy your own copy.
- **The target endpoint must allow CORS.** Probes run from the browser, so an endpoint without `Access-Control-Allow-Origin` will fail — the tool detects this and says so explicitly rather than reporting a fake outage.
- **Probing costs quota.** Discovery is free (one `/v1/models` call), but each Chat and each SSE probe is a real billed request.

## Licence

AGPL-3.0-only. The "ZGo" name and marks are not covered — see [NOTICE](../NOTICE.md).
