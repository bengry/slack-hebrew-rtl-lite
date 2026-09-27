# Slack preserves bidi marks

Type: research
Status: resolved
Blocked by: 10

## Question

Do invisible bidi marks survive Slack end to end? Test U+200F (RLM), U+200E (LRM), and isolates U+2066-U+2069 inserted at line starts in the composer (via `document.execCommand('insertText')` or equivalent that Quill accepts):

- Present in the sent message DOM, per line, after send and after edit + save?
- Kept by the API/stored text (visible via copy message text / copy link unfurl)?
- Effect for receivers WITHOUT the extension (Slack's `dir="auto"` on the block sees the first mark).
- Search: does a word with a neighbouring mark still match?
- Copy-paste out of Slack: do marks come along?
- Notifications / sidebar previews: any visible artifacts?

Blocked by 10 only because both need the single attached Edge tab. Test channel only.

## Answer

Full detail: [research/bidi-marks-test.md](../research/bidi-marks-test.md). Sends and saves were done by the user (agent sends are blocked by the permission system).

- Quill keeps RLM/LRM inserted via `execCommand('insertText')`, code-point exact.
- Send: marks kept byte-exact at each line start in the rendered `.p-rich_text_section`.
- Edit + save: marks kept in the edit composer and in the re-rendered message.
- Without the extension: Slack's `dir="auto"` on `.p-rich_text_block` resolves once per message from the first strong char (a leading RLM made the whole 3-line message RTL). With A+, `unicode-bidi: plaintext` per line treats each leading mark as that line's first strong char.
- Composer toolbar (`div[role=toolbar].c-wysiwyg_container__formatting`) is not re-rendered on keystrokes; survival across send/channel switch not measured.
- Unreached: copy-to-clipboard (native permission prompt), search.

Verdict: sender-side marks are viable.
