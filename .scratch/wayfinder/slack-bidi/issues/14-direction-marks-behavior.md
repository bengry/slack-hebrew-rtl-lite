# Direction marks behavior

Type: grilling
Status: resolved
Blocked by: 13

## Question

How does the sender side use invisible bidi marks so receivers with the extension render each line as intended?

- Manual: keyboard shortcut inserts RLM/LRM at the start of the current line (which keys; toggle vs two keys).
- Automatic: on send, insert a mark only on lines where the first strong char disagrees with word majority (the A+ gap), so most messages carry no marks.
- Both.
- Receiver rule: a leading mark overrides word majority on single-line containers; in multi-line containers the mark is already the first strong char, so plaintext honours it with no JS.


Requirement (user, 2026-09-27): every manual shortcut has a visible button equivalent for non-power users. Sub-questions: where the buttons live (Slack's composer formatting toolbar vs own floating control), how they survive React re-renders of the toolbar, and how they show the current line's direction state.

## Comments

**2026-09-27, bidi-ux-research** (full detail + sources: [research/bidi-ux-patterns.md](../research/bidi-ux-patterns.md)):

- Per-paragraph control is the norm (Docs, Word, Notion); Gmail is whole-message. Docs has a toolbar button and no shortcut; Notion has a block-menu "Text direction".
- Windows: Chromium's built-in `Ctrl+RightShift` / `Ctrl+LeftShift` sets direction on editable fields (Word/OS convention). It sets `dir` on the editable element, not a per-line mark, so the extension would intercept it.
- macOS (the user's platform): no confirmed native shortcut; needs a custom chord. The agent's example `Cmd+Shift+M` likely collides with Slack's own mentions/activity shortcut; Slack already uses many `Cmd+Shift+<key>` chords for formatting (X, C, 7, 8, 9). Pick a chord only after checking Slack's shortcut list.
- No evidence either way on Slack keeping U+200E/U+200F/U+2066-2069; the live test in [Slack preserves bidi marks](13-slack-preserves-bidi-marks.md) is still needed.
- Existing Slack RTL extensions (yuvalbl/slack-rtl, shlomimatichin/slack-hebrew, TarekAlQaddy/slack-rtl-support) look display-only per READMEs; none do sender-side marks.
- Risks of marks: search/exact-match breakage, marks leaking into copy-paste, bidi-control spoofing flags or sanitizers stripping them.

**2026-09-27, user decisions (shortcut keys still open):**

- Both manual and automatic. Automatic: on send, prepend a mark only to lines whose first strong char disagrees with word majority. Timing of the on-send hook is unproven; needs a prototype during build.
- Buttons: two "RTL" / "LTR" buttons injected into Slack's composer formatting toolbar (`div[role=toolbar].c-wysiwyg_container__formatting`); the active one shows pressed when the current line is forced; pressing the active one returns the line to auto. Shortcuts follow the same toggle rule.
- Receiver rule: a leading RLM/LRM overrides word majority on single-line containers.
- Copy out of Slack: strip leading RLM/LRM the extension may have added; never strip Slack's own marks in search snippets.
- Slack shortcut list checked (slack.com/help/articles/201374536): `Cmd+[` / `Cmd+]` = Slack history back/forward (Mac); Windows `Ctrl+Shift+L` = Browse channels; no Slack binding on `Ctrl+[` / `Ctrl+]` on either platform.

## Answer

Both manual and automatic marks. Shortcuts: Ctrl+[ = LTR, Ctrl+] = RTL on Mac and Windows, matched on event.code (BracketLeft/BracketRight) so the Hebrew layout's bracket swap does not flip them; toggle rule as the buttons. Two RTL/LTR buttons in Slack's composer toolbar. Leading mark overrides word majority on single-line containers. Strip extension-added leading marks on copy; keep Slack's own. Chrome's own Ctrl+[ / Ctrl+] bindings to be checked at build. Word's Ctrl+Left/Right Shift alias not included.
