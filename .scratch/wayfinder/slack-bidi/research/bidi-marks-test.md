# Slack bidi-mark survival test — results

User pressed Enter/Save by hand (agent never sent/saved — permission classifier
denies automated writes to Slack). Agent built messages via the safe Quill path
(`execCommand('insertText')` + `Shift+Enter`) and did all inspection read-only.

## Test 1 — 3-line message with RLM/LRM

Composed pre-send, codepoints verified in `.ql-editor` DOM (exact match to intent),
user pressed Enter.

**Rendered `.p-rich_text_section` after send** — text nodes and their leading codepoints:

| line | rendered text | leading codepoints | kept? |
|---|---|---|---|
| 1 | `‏PR #123 עודכן, תבדוק בבקשה.` | `200f,50,52,20` | kept |
| 2 | `‎שלום world` | `200e,5e9,5dc,5d5` | kept |
| 3 | `hello עולם` | `68,65,6c,6c` | kept (plain, as expected) |

Marks survive send exactly — no stripping, no reordering.

**`dir="auto"` resolution.** The attribute lives on the whole message block
(`div.p-rich_text_block[dir=auto]`), not per line. The 3 lines share one `<p>`-less
text run joined by `<br>` inside that single block, so direction is resolved ONCE
for the entire message from its first strong character (here, RLM on line 1) →
`getComputedStyle(body).direction === "rtl"` for all 3 lines together. **Implication
for the extension: a per-line mark does not get independent dir resolution from
Slack's own CSS** — lines 2 and 3 inherit line 1's resolved direction regardless of
their own leading mark, because there's no per-line block boundary. Any per-line
visual effect would need extension-injected CSS (e.g. `unicode-bidi: isolate` per
`<br>`-delimited run), not just the marks alone.

## Edit round-trip

Opened "Edit message" via the actions menu (mouse-move to trigger hover state,
then click — synthetic `mouseenter`/`mouseover` dispatch was not enough, a real
`mousemove` was needed). Edit composer reloaded the 3 lines with marks intact
(200f/200e verified again in the edit `.ql-editor`). Appended `" edited"` to line 3
via the same safe insertText path. User pressed Save.

**After save:** rendered message reads `...hello עולם edited (edited)`. Re-checked
codepoints — lines 1 and 2 unchanged, marks still exactly `200f`/`200e` at their
starts. Edit round-trip does not strip marks.

## Copy text — unreachable

Clicked "Copy message" in the actions menu, then `navigator.clipboard.readText()`
hung indefinitely (native OS permission prompt outside page content, can't dismiss
via JS/keyboard through automation). No verdict either way; not a Slack-side signal,
a tooling limitation.

## Search — skipped

Guessed a search-results URL; it opened an unrelated conversation instead. Backed out
immediately without reading it, returned to the test channel. Per instructions, did
not retry with real search-UI interaction (risk of navigating to other conversations)
— treated as "resists automation" and skipped.

## RLI/PDI single-line message — skipped

Per instructions, only attempted after everything else went smoothly; explicitly told
to skip it for this run.

## Screenshots

- `/tmp/bidi-marks/composer-ready-msg1.png` — composer pre-send
- `/tmp/bidi-marks/rendered-msg1.png` — message as rendered after send
- `/tmp/bidi-marks/rendered-msg1-edited.png` — message after edit+save

## Verdict

**Sender-side marks are viable, with one design correction.** RLM/LRM survive
compose → send → render → edit → save, byte-for-byte, in every DOM location checked.
But `dir="auto"` in Slack's rendering is scoped to the whole message block, not per
line — so a mark alone will not visually flip direction line-by-line the way the
design assumes. The extension needs to also apply its own per-line direction/isolation
styling (e.g. wrap each `<br>`-delimited run and set `unicode-bidi`/`direction`
explicitly) rather than relying on Slack's native `dir="auto"` to notice a
line-leading mark.
