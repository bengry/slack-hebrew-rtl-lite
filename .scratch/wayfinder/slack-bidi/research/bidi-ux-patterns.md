# BiDi/RTL manual-override UX patterns — research findings

Scope: how existing products let users force paragraph/line direction, whether a de-facto
shortcut exists in Chromium, Slack's handling of directional marks, and known downsides of
embedding RLM/LRM in chat text. Web search only, no browser automation.

## 1. Per-product direction-override UX

| Product | Shortcut (Win) | Shortcut (Mac) | Button/menu | Scope | Needs RTL lang enabled first? | Current-direction indicator |
|---|---|---|---|---|---|---|
| **Google Docs** | none dedicated (Ctrl+Shift+L/R/E/J are *alignment*, not direction) | none dedicated | "Paragraph direction" toolbar button | Per paragraph | No — RTL controls appear automatically when RTL text/doc is detected | Toolbar button state; alignment shifts |
| **Word (desktop, Win)** | System-wide `Ctrl+Right Shift` = RTL, `Ctrl+Left Shift` = LTR (Windows OS-level, not Word-specific) | n/a | "Right-to-Left"/"Left-to-Right" buttons in Home ribbon, Paragraph group (only shown once an RTL language is enabled) | Per paragraph | **Yes** — buttons/shortcut only appear/activate after an RTL language pack is installed | Cursor position (right vs left side of field) + ribbon button pressed-state |
| **Word (desktop, Mac)** | n/a | No reliable native Word shortcut. macOS *system* shortcuts `⌃⌘←`/`⌃⌘→` exist for paragraph direction but reportedly don't work consistently inside Word | Control-click → "Writing Direction" / "Paragraph Direction" in context menu; or Home ribbon buttons (need RTL keyboard/lang enabled, or add via Quick Access Toolbar) | Per paragraph (also a separate "Selection Direction" for a run of text) | Yes, for the ribbon buttons to auto-appear | Ribbon button state |
| **Word for the web** | Format > Paragraph > Text Direction, or Home > "More options" > Right-to-Left Text Direction | same (web, no OS-level shortcut) | Ribbon/format menu button | Per paragraph | Not fully confirmed for the web version specifically — desktop behavior requires RTL enabled; web docs unclear (unconfirmed) | Ribbon button state |
| **Gmail (compose, web)** | none | none | Explicit "Right-to-left" icon in the compose formatting toolbar (bottom-left, expand via the "A" icon) | Whole message body (not per-paragraph) | **Yes** — must turn on "Right-to-left editing support" in Settings > General first | Cursor jumps to right side of compose box when toggled on |
| **Outlook Web (OWA / new Outlook)** | none confirmed | none confirmed | Format Text > Paragraph > "Right-to-left" option in compose/reply | Per paragraph (in classic OWA); no way to set default direction in new Outlook/Outlook.com (unconfirmed exact ribbon path for "new Outlook") | Not clearly gated behind a language setting per sources found (unconfirmed) | Ribbon toggle state |
| **WhatsApp Web / Telegram Web** | none | none | **No native per-message/paragraph direction control found.** Direction is auto-detected via first-strong-character (Unicode bidi algorithm); users report English/Hebrew alignment bugs, especially in search fields. Fixes are third-party only (e.g. `omertuc/RTL-Whatsapp` Stylish style flips the *whole UI* to RTL, not per-message) | N/A (auto only) | N/A | No visible indicator; behavior is a frequent source of bug reports |
| **Notion** | none dedicated | none dedicated | Native (recently added): per-block "Text direction" submenu via the `⋮⋮` block-handle menu; a settings toggle "Always show direction controls" makes the control visible even when the workspace language is LTR | Per block (paragraph-equivalent) | No — auto-detects from first character typed, block-level manual switcher available regardless of workspace language; but full **UI mirroring** (sidebar etc.) requires setting workspace language to Arabic/Hebrew | Block-level menu shows current direction; whole interface mirrors when RTL language is set as display language |

Sources:
- [Edit & view text from right to left – Google Docs Help](https://support.google.com/docs/answer/65166)
- [Keyboard shortcuts for Google Docs](https://support.google.com/docs/answer/179738)
- [Disable ctrl+shift to change text direction – Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/5179912/disable-ctrl-shift-to-change-text-direction)
- [Using right-to-left languages in Office – Microsoft Support](https://support.microsoft.com/en-us/office/using-right-to-left-languages-in-office-17d8a34d-36d6-49ad-b765-257cb7cd22e2)
- [WORD FOR MAC: how to manually override text direction – Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/5928867/word-for-mac-how-to-manually-override-text-directi)
- [Change the direction of text as you type on Mac – Apple Support](https://support.apple.com/en-bh/guide/mac-help/mh21243/mac)
- [Changing the Text Direction in Microsoft Word – Proofed](https://proofed.com/writing-tips/changing-direction-text/)
- [Gmail: How to Enable Right-to-Left Text – Technipages](https://www.technipages.com/gmail-right-to-left-text/)
- [Default text direction in the new outlook – Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/4657051/default-text-direction-in-the-new-outlook)
- [GitHub - assafshp/Outlook-Web-Right-to-Left-Chrome-Extension](https://github.com/assafshp/Outlook-Web-Right-to-Left-Chrome-Extension) (existence of this extension is itself evidence OWA's native control is inadequate/inconsistent)
- [GitHub - omertuc/RTL-Whatsapp](https://github.com/omertuc/RTL-Whatsapp)
- [WhatsApp black-dot / direction bug discussion – Apple Community](https://discussions.apple.com/thread/255323141)
- [Notion is now available in 21 languages... first RTL languages – Notion on X](https://x.com/NotionHQ/status/2015760408217374968)
- [Change your language in Notion – Notion Help Center](https://www.notion.com/help/change-your-language)

## 2. De-facto Chromium shortcut for forcing writing direction

**Windows/Linux:** Chromium has a real built-in feature for editable fields (`<input>`/`<textarea>`, so this includes Slack's Quill composer): right-click gives a **"Writing Direction"** submenu with Default / Left to Right / Right to Left. The same action is bound to a keyboard chord at the Blink/WebKit level: `Ctrl+Right Shift` → force RTL, `Ctrl+Left Shift` → force LTR. This originated from a patch (EditorClientImpl, `MakeTextWritingDirectionRightToLeft`/`...LeftToRight`) explicitly written to match Internet Explorer/Safari behavior. It's a system-wide-feeling shortcut but is actually Chromium's own key binding, active in any content-editable/text field on any site, no extension needed.
- Explicitly does **not** fire while there's an active text selection, to avoid clobbering the common `Ctrl+Shift+←/→` "select previous/next word" pattern.
- WebKit explicitly blocks changing direction of password fields (security carve-out).
- Source: [Chromium issue 40968612 — "cant align text to the right using right shift and right ctrl"](https://issues.chromium.org/issues/40968612)

**macOS:** The context-menu "Writing Direction" entry **does** appear on Mac Chrome (confirmed via W3C's own cross-browser doc and a Chromium accessibility-discoverability discussion which specifically flags Mac). However, no source found confirms the `Ctrl+Right Shift`/`Ctrl+Left Shift` keyboard chord also works on macOS Chrome — that chord is documented in Windows-flavored bug reports and matches Windows OS-level RTL toggle conventions. **Unconfirmed whether the same chord fires on macOS Chrome**; treat as needing manual verification (e.g. in a real Chrome-on-Mac session) before assuming it's free real estate.
- A Chromium dev thread flags this menu-only path as a Mac accessibility gap: there's no keyboard way to summon the context menu at cursor position on Mac (Windows/Linux have Shift+F10 / Menu key for that).
- Sources: [W3C — Structural markup and right-to-left text in HTML](https://www.w3.org/International/questions/qa-html-dir), [Chromium dev group — Context menu on Mac OS X](https://groups.google.com/a/chromium.org/g/chromium-dev/c/1CY3b7NNe0k)

**Conflict check against Slack's own shortcuts (from Slack's published shortcut list, general knowledge — not re-verified this pass):**
- `Ctrl+Shift+Right/Left Arrow` in Slack's composer likely inherits the browser/OS "select word" behavior, not a Slack-specific binding — low conflict risk since Chromium already special-cases "don't change direction during an active selection."
- The bare `Ctrl+Right Shift` / `Ctrl+Left Shift` chord (modifier keys only, no arrow) is unlikely to collide with Slack's documented shortcuts (which are mostly `Ctrl/Cmd+Shift+<letter>` combos for things like bold, strikethrough, code block, mark-as-read). **Recommend verifying against Slack's live shortcut list before shipping**, since Slack's Quill composer captures many key combos at a level above default browser handling and could still intercept it.

**Recommendation:**
- **Windows: reuse `Ctrl+Right Shift` (RTL) / `Ctrl+Left Shift` (LTR)** — it's the existing Chromium/Windows convention, already muscle memory for RTL users switching between Word/Notepad/browser fields. Low novelty cost.
- **macOS: no confirmed native equivalent exists inside Chrome's own editable-field handling.** Given the extension needs one deliberate binding anyway, a custom chord (e.g. `Cmd+Shift+M` for "mark direction", mnemonic) is safer than assuming `Ctrl+Right/Left Shift` works — that chord is Windows-idiom and Mac keyboards/Chrome may not route it the same way. **This needs a 5-minute manual check in real Chrome on Mac before finalizing**, since it's unconfirmed either way.

## 3. Slack's handling of U+200E/U+200F/U+2066–2069 in messages

**No primary-source evidence found** (Slack docs, official engineering posts, or a confirmed GitHub issue against Slack itself) that directly states whether Slack strips or preserves bidi control characters in sent messages, search indexing, notifications, or mobile apps. This is **unconfirmed** — flagging explicitly per your ask.

What is available, all indirect:
- General invisible-character guides claim "Slack, Twitter/X, and many email clients strip zero-width characters before storing or displaying text" but this is an unsourced blog claim lumping bidi marks in with true zero-width spaces (U+200B) — not verified against Slack specifically, and the same source elsewhere admits LRM/RLM are usually treated differently (as legitimate formatting, not junk) precisely because stripping them breaks real RTL text. Source: [invisiblemsg.com – Unicode Invisible Characters 2026 guide](https://invisiblemsg.com/blog/what-is-unicode-invisible-character/)
- A tool built specifically to clean Slack-pasted text (`unformat.online`) targets "smart quotes, non-breaking spaces, and zero-width characters that Slack adds to copied messages" — this is about characters Slack's *own UI* injects when you copy text out of it (e.g. non-breaking spaces from its rendering), not about whether Slack preserves marks you send in. Doesn't answer the sent-message-preservation question. Source: [unformat.online – Clean Slack Text Formatting](https://www.unformat.online/clean-slack-formatting)
- No GitHub issues found against Slack itself (or Slack's public API/SDK repos) discussing bidi-mark stripping.
- **Existing Slack RTL extensions inspected (READMEs only, not source code) show no evidence of sender-side mark insertion — all three (`yuvalbl/slack-rtl`, `shlomimatichin/slack-hebrew`, `TarekAlQaddy/slack-rtl-support`) appear to be purely client-side/display-only** (CSS `direction: rtl` toggling on rendered DOM), not touching outgoing message text. Their READMEs are too thin to be definitive (no mention of RLM/LRM at all), and I did not read their actual `.js` source — that would need a follow-up fetch of the raw JS files if you need certainty. The `shlomimatichin/slack-hebrew` README explicitly says "fix direction:rtl in slack, only for hebrew messages" (a CSS property name), which is a decent signal it's display-only auto-detection, not a sender-side mark scheme like what you're planning.
- Also found: `XYZET "Make it right!"` extension — auto-aligns Hebrew/Arabic across Slack/YouTube/Discord via "Smart Type" (align while typing) and "Smart Posts" (align per-post by detected language) — again framed as detection/alignment, not as inserting directional marks into the message payload.

**Bottom line: nobody in the existing Slack-RTL-extension ecosystem found by this search does what you're planning (sender-side invisible mark insertion for receiver-side rendering).** That's either a gap you can fill, or a sign the others considered it and rejected it for reasons like the risks in §4 below — no source clarifies which. Recommend a quick manual test (send a message containing U+200F between two Slack accounts, check if it round-trips) before committing to the mark-based design — this is directly testable and shouldn't stay unconfirmed for long.

## 4. Downsides of embedding RLM/LRM in chat text

1. **Search / matching breaks silently.** Marks are real code points; a search for "hello" won't match "hello" if a RLM/LRM sits mid-token, and diffs/exact-string comparisons will disagree even though text looks identical on screen. This is a well-documented class of bug (string length mismatches, failed find/replace, broken exact-match lookups). If Slack's search tokenizer doesn't strip these marks (unconfirmed either way, see §3), messages with an injected RLM could become harder to find via Slack search, or could split a word for tokenization purposes.
   Source: [dev.to – Why pasted text keeps breaking search and formatting](https://dev.to/begoodtool/why-pasted-text-keeps-breaking-search-and-formatting-and-the-regexes-i-ended-up-using-to-clean-it-100f)

2. **Copy-paste corruption / silent character-count drift.** Copying a message elsewhere (an email, a doc, a terminal, a code block) carries the invisible mark along; downstream systems that don't expect it can mis-render, mis-count characters, or reject input (e.g. a form validator treating the string as containing an "invalid" character). This is the same class of bug documented broadly for zero-width/bidi characters.
   Source: [bzic-tools.com – 10 Invisible Characters That Silently Break Copy-Paste](https://bzic-tools.com/blog/hidden-characters-break-copy-paste)

3. **Spoofing / Trojan-Source-style concerns.** Bidi control characters are the exact mechanism behind the 2021 "Trojan Source" vulnerability class (CVE-2021-42574) — using bidi overrides to make text *display* differently than its logical order, enabling deception (e.g. making a malicious URL/command look benign). RLM/LRM are milder members of the same character family as the more dangerous override/embedding controls (RLO/LRO/RLI/LRI/PDI, U+2066–2069 etc.) that your Q3 asked about. Even though RLM/LRM themselves are marks (weaker than overrides), any extension that programmatically inserts bidi controls into user-facing text should be aware that security tooling (GitHub's bidi-character warning banner, some email/Slack security scanners) may flag messages containing bidi control characters at all, since detection tools generally don't distinguish "helpful mark" from "malicious override" without deeper analysis.
   Sources: [Wikipedia – Trojan Source](https://en.wikipedia.org/wiki/Trojan_Source), [Krebs on Security – 'Trojan Source' Bug](https://krebsonsecurity.com/2021/11/trojan-source-bug-threatens-the-security-of-all-code/)

4. (Bonus, not asked but relevant) **Legitimate-content collateral damage.** Because RLM/LRM/ZWJ/ZWNJ are legitimate in real Arabic/Hebrew/Persian/Hindi text, any Slack-side or third-party sanitizer that blanket-strips "invisible characters" (a common defensive pattern, see §3's `unformat.online`) could strip *your* deliberately-inserted marks along with incidental ones, silently defeating the feature for a subset of users/pipelines. Confirmed pattern: a real-world sanitizer bug stripped ZWJ from family emoji and ZWNJ from Persian text because it conflated joiners with bidi controls.
   Source: [GitHub issue – uttrflow-swift #1718](https://github.com/uttrflow/uttrflow-swift/issues/1718)

## Unconfirmed items (need manual/primary-source verification)

- Whether Slack strips/preserves U+200E/U+200F/U+2066–2069 in sent messages, search, notifications, and mobile apps — **no primary source found either way**; recommend a live test (send a message with a leading RLM between two Slack clients/accounts and inspect via Slack's export/API or another extension).
- Whether Chromium's `Ctrl+Right Shift`/`Ctrl+Left Shift` writing-direction chord fires on **macOS** Chrome (context-menu path is confirmed on Mac; the keyboard chord is only confirmed in Windows-flavored bug reports).
- Exact ribbon path for setting per-paragraph direction in the *new* Outlook / Outlook.com web client (older OWA path is documented; new Outlook sources are contradictory/thin).
- Whether Word for the web requires an RTL language enabled first, same as desktop Word (not explicitly confirmed for the web SKU).
- Whether the three existing Slack RTL extensions are purely CSS/display-only — inferred from README wording only; not verified by reading their actual JS source.
