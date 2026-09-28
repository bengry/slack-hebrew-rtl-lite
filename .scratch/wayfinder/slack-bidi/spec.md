# Spec: Docs/Word-grade BiDi for Slack (slack-hebrew-rtl-lite v2)

Status: approved 2026-09-27. Decisions and evidence live in the linked tickets of [map.md](map.md); this file states what to build.

## Goal

Every line of Slack text renders in its own direction and alignment, the way a Google Docs / Word paragraph does. Mixed Hebrew/English messages read correctly line by line. Senders can force a line's direction, and receivers with the extension see it as intended.

## Constraints

- Latest couple of Chrome / Edge / Chromium versions only, Manifest V3, WXT. ([Target browsers](issues/01-target-browsers.md))
- Rewrite `entrypoints/slack.content/index.ts` and `style.css` from scratch. ([Rewrite or evolve](issues/12-rewrite-or-evolve.md))
- Never restructure Slack's DOM (no wrapping, no moving nodes). Only set attributes/classes/styles on existing elements. Slack's React re-render wipes restructured nodes. ([Rendering mechanism](issues/02-rendering-mechanism.md))
- Slack's layout (avatar, gutter, hover actions, reactions) stays LTR. No mirroring. ([Message chrome mirroring](issues/05-message-chrome.md))

## Terms

- **Line**: a run of text between `<br>` / `span.c-mrkdwn__br` inside one text container, or one `<p>` in the composer.
- **Text container**: an element that holds inline text directly: `.p-rich_text_section`, a list item in `.p-rich_text_list`, a quote in `.c-mrkdwn__quote`.
- **Multi-line container**: a text container that contains `br` or `.c-mrkdwn__br`. Otherwise **single-line**.
- **RTL letter**: a character matching `/[\p{Script=Hebrew}\p{Script=Arabic}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Samaritan}\p{Script=Mandaic}\p{Script=Adlam}]/u`, or U+200F. ([Script coverage](issues/11-script-coverage.md))
- **LTR letter**: any `\p{L}` that is not an RTL letter, or U+200E.
- **Mark**: U+200F (RLM) or U+200E (LRM).

## Direction rule

`directionOf(text)`:

1. If the text (ignoring leading whitespace) starts with a mark: RLM = `rtl`, LRM = `ltr`.
2. Split on whitespace. Count words containing an RTL letter vs words containing an LTR letter (a word with both counts for neither).
3. More RTL words = `rtl`; more LTR words = `ltr`.
4. Tie: first strong letter wins; no strong letter = leave untouched.

([Direction rule per paragraph](issues/04-direction-rule.md), [Direction marks behavior](issues/14-direction-marks-behavior.md))

## Rendering

### Message surfaces

Applies inside `.p-rich_text_block` in channels, threads, DMs and full search results. These share one DOM. ([Slack DOM inventory](issues/10-slack-dom-inventory.md), [DOM inventory for search and saved](issues/15-dom-inventory-search-saved.md))

- Multi-line container: CSS `unicode-bidi: plaintext; text-align: start`. Each line resolves from its own first strong character, and a leading mark counts as one. Each line aligns to its own side, and the zig-zag is intended. ([Paragraph unit](issues/03-paragraph-unit.md))
- Single-line container: JS sets `dir = directionOf(text)` and CSS `text-align: start`.
- Lists and quotes: per item. Each item/quote line gets its own direction and side; the bullet/number and quote bar follow it. Use logical properties (`padding-inline-start`, `margin-inline-start`, `inset-inline-start`) so markers flip with the item. ([Lists and quotes](issues/07-lists-and-quotes.md))
- Slack's `dir="auto"` on `.p-rich_text_block` stays; the rules above act on its children.

### Islands

([Always-LTR islands and isolation](issues/06-ltr-islands.md))

- Code block `.c-mrkdwn__pre` and inline code `.c-mrkdwn__code`: `direction: ltr; unicode-bidi: isolate; text-align: left`.
- Links whose visible text is the URL itself: `dir="ltr"`, isolated. Other links: `unicode-bidi: plaintext`.
- Mentions `<ts-mention>` (Slack hard-codes `dir="ltr"`): `unicode-bidi: plaintext`, so a Hebrew name resolves RTL and stays isolated.
- Channel mentions and emoji: isolated (`unicode-bidi: isolate`), direction not forced. Channel-mention selector to confirm at build.

### Composer (new and edit)

`.ql-editor`, one `<p>` per line; edit mode is the same editor (`aria-label="Edit message"`, `data-feat="edit_composer"`). ([Composer direction behavior](issues/08-composer-behavior.md))

- `.ql-editor p { unicode-bidi: plaintext; text-align: start }`.
- `.ql-editor .ql-code-block`: LTR as code blocks above.
- No JS `dir` on `<p>` unless a build prototype shows Quill keeps the attribute.

### Previews without line structure

Truncated search snippets (one flattened `.p-rich_text_section`, no `<br>`) and saved/Later previews (`.c-truncate` items): one `dir = directionOf(text)` per preview. Truncated search snippets are single-line containers, so the message rule already covers them. Never remove the marks Slack itself inserts into snippets. Saved-preview selector to confirm at build. ([v1 surfaces](issues/09-v1-surfaces.md))

## Direction marks (sender side)

Slack keeps RLM/LRM byte-exact through send, render and edit. ([Slack preserves bidi marks](issues/13-slack-preserves-bidi-marks.md))

- **Insertion path**: only through input Quill listens to (`document.execCommand('insertText')` with the caret at line start). Never mutate `.ql-editor` DOM directly and never call Quill's `insertEmbed`. Both desynced or crashed Slack in testing.
- **Automatic**: when a message is sent, for each `<p>` whose first strong letter disagrees with `directionOf`, prepend the mark for the majority direction. Skip lines that already start with a mark. Lines that agree get no mark, so most messages carry none.
- **Manual shortcuts**: `Ctrl+[` = LTR, `Ctrl+]` = RTL on Mac and Windows, matched on `event.code` (`BracketLeft` / `BracketRight`). macOS's Hebrew layout swaps what the bracket keys type. Applies to the caret's line: insert or replace the leading mark. Pressing the shortcut matching the line's current forced direction removes the mark (back to auto).
- **Buttons**: two buttons, "LTR" and "RTL", injected into Slack's composer toolbar (`div[role=toolbar].c-wysiwyg_container__formatting`), same toggle rule as the shortcuts. The button matching the caret line's forced direction shows pressed (`aria-pressed="true"`), updated on `selectionchange`. Re-inject if the toolbar is replaced. It survives keystrokes; survival across send and channel switch is unmeasured.
- **Copy out**: on `copy` from message surfaces, strip marks at line starts from `text/plain` and `text/html`. Do not intercept copy inside search snippets.

## Engine

- One MutationObserver on `document.body` (childList, subtree, characterData). Batch per animation frame. Process only added or changed subtrees. The current `scheduleScan` scoping approach is a reference.
- Idempotent: recompute only when a container's text changed, tracked with a data attribute holding a text hash. Ignore mutations to the extension's own attributes.
- Runs in the content script's isolated world. The DOM and `execCommand` are shared with the page, so no main-world script is needed unless a prototype shows otherwise.
- Performance: a scan must not add a long task (>50 ms) on a channel with 500 rendered messages. `entrypoints/slack.content/perf.test.ts` checks render plus forced layout in real Chromium against 2x that budget.

## Acceptance

Test corpus in test-channel (`C0TESTCHAN`); texts in [Rendering mechanism](issues/02-rendering-mechanism.md). Expected per-line directions:

| Msg | Lines |
|---|---|
| T1 | ltr, rtl, rtl |
| T2 | rtl, ltr, rtl |
| T3 | rtl |
| T4 | rtl |
| T5 | ltr, ltr, rtl |
| T6 | rtl |
| T7 | ltr |
| T8 | rtl, ltr, rtl, ltr |
| Marks message | rtl (RLM + "PR #123 עודכן..."), ltr (LRM + "שלום world"), ltr ("hello עולם edited") |

Also:

- The rich message (lists, quote, code, inline code, link, mention, channel, emoji): markers and quote bar follow each item's side, code stays LTR, and a mention with a Hebrew name resolves RTL.
- Composer: T2's three lines typed without sending resolve rtl, ltr, rtl.
- Shortcuts and buttons insert, replace and remove marks as specified. An automatically marked "PR #123 עודכן" second line renders RTL for a receiver.
- Check method: a playwright-cli script that, for each line, compares the first character's rect position with the container edges (method used in the Rendering mechanism prototype).
- Sending and saving in Slack need a human. Agent sends are blocked by the permission system.

## Build-time checks

1. Chrome's own bindings for `Ctrl+[` / `Ctrl+]` on Mac and Windows: confirm none. Slack has none.
2. Prototype the on-send hook for automatic marks. A capture-phase `keydown` Enter (no Shift, no open autocomplete) must insert the marks before Slack reads the Quill contents. If this is racy, fall back to inserting when the caret leaves a line.
3. Confirm selectors for channel mentions and saved previews.

## Out of scope

Canvases, notifications, sidebar previews, channel topic, huddle chat, store distribution, the Slack desktop app, and Firefox/Safari. See [map.md](map.md).
