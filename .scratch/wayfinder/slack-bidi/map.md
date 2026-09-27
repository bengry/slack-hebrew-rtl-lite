# Map: Docs/Word-grade BiDi for Slack

Label: wayfinder:map

## Destination

`spec.md` in this folder: every behavior and implementation decision locked for a slack-hebrew-rtl-lite rewrite that gives Slack per-paragraph BiDi/RTL like Google Docs / MS Word. An executor builds from it as a separate effort.

## Notes

- Domain: Chromium browser extension (WXT, MV3) running a content script + stylesheet on `*.slack.com`.
- Skills: `/grilling` + `/domain-modeling` for grilling tickets; `/frontend-skills:playwright-cli` attached to the user's Edge (`attach --extension=msedge`) for anything that needs live Slack.
- Test channel: test-channel `C0TESTCHAN` (user-authorized for test posts). Test corpus T1-T8 is posted there; texts in [Rendering mechanism](issues/02-rendering-mechanism.md).
- Verified baseline facts:
  - Slack sets `dir="auto"` on each `.p-rich_text_block`: first strong char decides the whole message.
  - Message lines are text nodes split by `<br>` inside one `.p-rich_text_section`; a blank line is a `span.c-mrkdwn__br`, not a block.
  - Composer (`.ql-editor`) has one `<p>` per line.
  - `unicode-bidi: plaintext` on `.p-rich_text_section` resolves direction per `<br>` line in Edge (first strong char per line).
  - Current build: whole-message word majority; mirrors the whole message layout for "hebrew"; "mixed" has no CSS. User verdicts: one-line messages correct (T3, T4, T6, T7), multi-line mixed broken (T1, T2, T5, T8).
- Standing preference: modern Chromium CSS is welcome (`:has()`, `:dir()`, logical properties, `@scope`, nesting); rewrite from scratch is allowed.

## Decisions so far

- [Target browsers](issues/01-target-browsers.md) — latest couple of Chrome/Edge/Chromium versions only, MV3.
- [Rendering mechanism](issues/02-rendering-mechanism.md) — A+: plaintext CSS per line in multi-line containers, JS word-majority `dir` on single-line ones; no DOM restructuring.
- [Direction rule per paragraph](issues/04-direction-rule.md) — word majority, ties by first strong char (single-line containers).
- [Message chrome mirroring](issues/05-message-chrome.md) — dropped; Slack layout stays LTR, only text flips.
- [Always-LTR islands and isolation](issues/06-ltr-islands.md) — code and URLs forced LTR + isolated; mentions/channels/emoji isolated only.
- [v1 surfaces](issues/09-v1-surfaces.md) — messages, composer, search, saved.
- [Script coverage](issues/11-script-coverage.md) — all RTL scripts.
- [Slack DOM inventory](issues/10-slack-dom-inventory.md) — messages, threads, DMs share one structure; Slack forces LTR on mentions; search and saved still unmapped.
- [Paragraph unit](issues/03-paragraph-unit.md) — each line gets its own direction and alignment (A+ unchanged); zig-zag accepted.
- [Lists and quotes](issues/07-lists-and-quotes.md) — per item: each item/quote line takes its own direction and side.
- [Rewrite or evolve](issues/12-rewrite-or-evolve.md) — rewrite content script and stylesheet from scratch.
- [Slack preserves bidi marks](issues/13-slack-preserves-bidi-marks.md) — RLM/LRM survive send and edit; A+ plaintext honours them per line.
- [DOM inventory for search and saved](issues/15-dom-inventory-search-saved.md) — full search results reuse message DOM; truncated snippets and saved previews are flattened, no per-line structure; edit mode = same Quill.
- [Direction marks behavior](issues/14-direction-marks-behavior.md) — manual + automatic RLM/LRM; `Ctrl+[` LTR / `Ctrl+]` RTL (physical keys); two toolbar buttons; strip own marks on copy.
- [Composer direction behavior](issues/08-composer-behavior.md) — auto per `<p>` via plaintext CSS; manual override moved to direction marks.

## Not yet specified

None. Destination reached: [spec.md](spec.md) (approved 2026-09-27). Performance budget and regression approach graduated into spec sections.

## Out of scope

- Slack desktop (Electron) app: cannot load extensions. The Slack PWA is covered.
- Firefox / Safari: see [Target browsers](issues/01-target-browsers.md).
- Canvases (Quip-based editor): separate editor, not in v1 per [v1 surfaces](issues/09-v1-surfaces.md).
- Notifications, sidebar/unread previews, channel topic/description, huddle chat: not in v1 per [v1 surfaces](issues/09-v1-surfaces.md).
- Distribution (Chrome Web Store / Edge Add-ons): separate from the spec; build loads unpacked.
