# Slack DOM inventory (workspace E0WORKSPACE, channel #test-channel)

Captured via `playwright-cli -s=msedge` attached to a real logged-in Edge. Two messages were
posted to the test channel (budget cap: 2). Composer automation is fragile (see Quirks below) —
some constructs came from earlier composer-only snapshots, not the final sent message.

## 1. Rich message in channel (`.p-rich_text_block`)

Root: `.p-rich_text_block[dir="auto"]` (unchanged from known facts). Full outerHTML of the posted
test message:

```html
<div class="p-rich_text_block" dir="auto">
  <ul data-stringify-type="unordered-list" data-list-tree="true"
      class="p-rich_text_list p-rich_text_list__bullet p-rich_text_list--nested"
      data-indent="0" data-border="0">
    <li data-stringify-indent="0" data-stringify-border="0">bullet one</li>
    <li data-stringify-indent="0" data-stringify-border="0">bullet two</li>
  </ul>
  <div class="p-rich_text_section">
    <span aria-label="&nbsp;" class="c-mrkdwn__br" data-stringify-type="paragraph-break"></span>
  </div>
  <ol data-stringify-type="ordered-list" data-list-tree="true"
      class="p-rich_text_list p-rich_text_list__ordered p-rich_text_list--nested"
      data-indent="0" data-border="0">
    <li data-stringify-indent="0" data-stringify-border="0">numbered one</li>
    <li data-stringify-indent="0" data-stringify-border="0">numbered two</li>
  </ol>
  <blockquote type="cite" class="c-mrkdwn__quote" data-stringify-type="quote">quoted line English</blockquote>
  <div class="p-rich_text_section">
    inline code: <code data-stringify-type="code" class="c-mrkdwn__code">inline_code()</code> end.
    <br aria-hidden="true">@Ben Gryn
    <br aria-hidden="true">:thumbsup
    <br aria-hidden="true">שלום world hello עולם
    <br aria-hidden="true">Mixed line: תודה רבה thanks a lot!
    <br aria-hidden="true">
  </div>
  <pre class="c-mrkdwn__pre" data-copy-code-block="true" data-stringify-type="pre">
    <div class="p-rich_text_block--no-overflow">const codeBlockExample = 1;
return codeBlockExample;</div>
    <span data-stringify-ignore="true"><button aria-label="Copy">...</button></span>
  </pre>
</div>
```

Key points per construct:

- **Lines within one paragraph**: split by `<br aria-hidden="true">`, confirmed (known fact).
- **Blank/paragraph break** (Enter between block types, e.g. after a list): rendered as a whole
  `<div class="p-rich_text_section">` containing only
  `<span class="c-mrkdwn__br" data-stringify-type="paragraph-break">`, matching known facts.
- **Bulleted list**: `<ul class="p-rich_text_list p-rich_text_list__bullet p-rich_text_list--nested" data-indent="0" data-border="0">`, each `<li data-stringify-indent="0" data-stringify-border="0">`. No `dir` attribute on the `<ul>` or `<li>` — direction is inherited from the parent `.p-rich_text_block[dir="auto"]`.
- **Numbered list**: identical shape, class `p-rich_text_list__ordered`, element `<ol>`.
- **Blockquote**: `<blockquote type="cite" class="c-mrkdwn__quote" data-stringify-type="quote">`, plain block, no nested `p-rich_text_section`.
- **Inline code**: `<code data-stringify-type="code" class="c-mrkdwn__code">`.
- **Code block**: `<pre class="c-mrkdwn__pre" data-copy-code-block="true">` wrapping a single
  `<div class="p-rich_text_block--no-overflow">` whose multiple source lines are joined by a
  **literal `\n` text node**, not `<br>` elements, plus a floating copy-button `<span>`. This
  matters for line-splitting logic: code blocks need `\n`-based splitting, not `<br>` splitting.
- **Mention (verified user)**: captured from an isolated (pre-send) composer snapshot, not the
  final message (see Quirks): `<ts-mention data-id="U0TESTUSER" data-label="@Test User" spellcheck="false" class="c-member_slug c-member_slug--link ts_tip_texty c-member_slug--mention" dir="ltr">@Test User</ts-mention>`. Note the explicit `dir="ltr"` on the mention element itself, independent of surrounding paragraph direction.
- **Mention (unverified / partial match)**: also seen in composer only:
  `<ts-mention data-id="UNVERIFIED" data-label="@Ben" data-title="Several matches for @Ben" role="link" aria-roledescription="Unknown user mention" class="c-member_slug c-member_slug--link ts_tip_texty c-member_slug--unverified" dir="ltr">@Ben</ts-mention>`. An unverified mention did **not** survive to the sent message — it flattened back to plain text ("@Ben Gryn") on send. Real verified mentions presumably keep the `ts-mention` tag through send (not independently confirmed in the final render this session — the only user mention that made it into the actually-posted message stayed literal text because the autocomplete pick didn't commit before Send).
- **Emoji (custom shortcode, e.g. `:thumbsup:`)**: captured in an isolated composer snapshot:
  `<img data-id=":thumbsup:" data-title=":thumbsup:" data-stringify-text=":thumbsup:" class="emoji" data-has-skin-tone="" alt="thumbsup emoji" src="data:image/gif;base64,...(1x1 placeholder)..." style="background-image:url(https://a.slack-edge.com/production-standard-emoji-assets/16.0/apple-large/1f44d@2x.png)">`. Rendering is CSS `background-image` on a 1x1 GIF placeholder `<img>`, not a real `src`. Emoji did not survive into the sent message either (autocomplete pick flakiness — see Quirks); the final message has literal `:thumbsup`.
- **Channel mention (`#channel`)**: never got the live autocomplete to commit in the composer
  (multiple attempts, including full mouse-event sequences and a `formats/slackslug` blot value
  of `{id, label, type}` inspected from Quill's registry — the latter was not tried live because
  it crashed/reloaded the tab once when tried for `slackmention`, see Quirks). No DOM sample
  captured. Treat `#channel` markup as unverified; likely a `<ts-mention>`-sibling custom element
  given the shared `formats/slackslug` Quill blot, but unconfirmed.
- **Link (auto-linked URL)**: not captured. Typing a bare URL followed by a space did not
  auto-link live in the composer, and the URL text got lost during a composer scripting mishap
  before send. Not confirmed whether Slack auto-links plain "https://..." text at all in the new
  rich-text composer, or only via explicit paste/markdown-link syntax. **Gap — recommend a manual
  follow-up test.**
- **Mixed Hebrew/English lines**: rendered as plain text inside the `p-rich_text_section`,
  separated by `<br>` like any other line; no special per-line wrapper or `dir` override — this
  is the crux of the RTL problem (block-level `dir="auto"` picks one direction for the whole
  section based on first-strong character, not per line).

## 2. Thread pane

URL: opened via the "Threads" nav icon (`[data-qa="channel_sidebar_vall_threads"]`), root class
`.p-threads_view`, virtualized (`.p-threads_view .c-virtual_list__item` present). The thread root
message container: `.c-message_kit__thread_message.c-message_kit__thread_message--root` inside
`.p-multi_thread_background`. **Reuses the exact same `.p-rich_text_block` / `.p-rich_text_section`
markup as channel messages** — confirmed by pulling a real thread's root message HTML (bold,
inline `code`, strike, paragraph-break spans all present, identical classes to channel view).
No thread-specific DOM differences found for text/line rendering.

## 3. DM

One of the user's DMs, read-only. Confirmed: **same
`.p-rich_text_block[dir="auto"]` > `.p-rich_text_section` structure**, Hebrew text renders fine
via the same virtualized list item pattern. No DM-specific wrapper differences found.

## 4. Composer (new message + edit mode)

Root: `.ql-editor[dir="auto"][contenteditable="true"]` (Quill), confirmed. One `<p>` per plain
line (known fact), but block formats use different wrapper elements, mirroring the sent-message
side fairly closely:

- Bullet list: `<ul><li>...</li></ul>` (no extra classes in the common case)
- Numbered list: `<ol><li>...</li></ol>`
- Blockquote: `<blockquote>text</blockquote>`
- Code block: `<div class="ql-code-block">line</div>` — **one div per line**, unlike the sent
  message's single `\n`-joined `<div>`.
- Inline code: `<code>text</code>` inside a `<p>`
- Mention (typed, autocomplete-committed): `<ts-mention data-id="..." data-label="...">` (same
  custom element family as sent-message markup, confirmed above)
- Emoji (autocomplete-committed): `<img class="emoji" data-id=":name:" ...>` (same as sent side)
- A toolbar exists with explicit format buttons, more reliable than typed markdown-shortcuts for
  scripted composition: `button[data-qa="bullet-list-composer-button"]`,
  `ordered-list-composer-button`, `blockquote-composer-button`, `code-composer-button` (inline),
  `code-block-composer-button`, `link-composer-button`, `bold/italic/underline/strike-composer-button`.
- Quill instance is reachable at `document.querySelector('.ql-container').__quill` (internal, not
  a public API — useful for a real extension to read/write structured content directly instead of
  simulating keystrokes, but a production extension should prefer the DOM read-side only and not
  poke Quill's internals to avoid the crash risk described below).
- Registered custom Quill formats of interest (`quill.constructor.imports`):
  `formats/slackmention`, `formats/slackslug` (probably channel/user-group refs), `formats/slackemoji`,
  `formats/slacktag`, `formats/slackhorizontalrule`, `formats/slackopaqueblock`, `formats/canvasvariable`,
  `formats/workflowtoken`. These are the non-standard blots an RTL/BiDi rewrite needs to treat as
  opaque atomic (LTR) tokens inside an otherwise-RTL line, alongside `code`/`link`.
- Edit mode of an own message: not separately captured this session (ran out of time budget) —
  expected to reuse the same `.ql-editor` structure based on Slack's known architecture (same
  composer component mounts inline under the message). **Not independently verified.**

## 5. Search results, Saved/Later list, Canvas, Channel topic/description header, Sidebar previews

**Not reached** — ran out of a reasonable time budget after the search UI turned out to be a
multi-step flexpane that this automation approach (synthetic DOM events on a backgrounded window)
couldn't drive reliably (the "Find a conversation" quick-switcher kept intercepting instead of
full search; direct URL navigation to `/search/...` and `/search?q=...` both redirected to
unrelated channels rather than opening real search results). The test channel also has no topic
set, and canvas/saved were not attempted. **Recommend a follow-up pass focused only on these five
surfaces**, ideally with a real (non-backgrounded) browser window where click/type work normally.

## Quirks / automation gotchas (useful for whoever continues this)

- The backgrounded Edge window silently drops **real keyboard input** — `playwright-cli type`
  and `press` do nothing to `contenteditable` content (no error, just no-op) because Chrome's
  native key-to-text pipeline doesn't run for a document with `document.hidden === true`. Only
  `document.execCommand('insertText', ...)` reliably inserts text (it doesn't need real focus/
  visibility), or driving Quill directly via `container.__quill`.
- Live markdown-shortcut conversion (typing `- `, `1. `, etc.) can be faked by
  `execCommand('insertText', false, '-')` then dispatching a synthetic `keydown` for Space —
  Quill's list-shortcut binding fires on that keydown even without a real native space insertion.
  This does **not** work for blockquote/code-block — those apparently aren't wired to the same
  keydown-triggered shortcut path in Slack's Quill config. Using the composer's format **toolbar
  buttons** (`button[data-qa="..."]`, real DOM buttons, `.click()` works) is far more reliable for
  blockquote/code-block/inline-code than trying to reverse-engineer the exact trigger event.
  Toggling a block format back off via the same button is unreliable (often leaves stale
  formatting on the next empty line); double `execCommand('insertParagraph')` on an empty item
  works for lists but not consistently for blockquote/code-block.
  Direct manual DOM surgery (`el.innerHTML = ...`, `el.lastElementChild.remove()`) to patch up a
  broken composer state **desyncs Quill's internal Delta model from the visible DOM** — the first
  full test message actually posted as literally just "bullet one" despite the DOM/`innerHTML`
  clearly showing full rich content immediately before Send, because the DOM had drifted out of
  sync with Quill's real internal document. Avoid raw DOM mutation on the composer entirely;
  always go through `execCommand` or the toolbar buttons, or the internal `__quill` API.
- Driving `container.__quill` directly (`quill.insertText`/`insertEmbed`/`formatLine`) works and
  is much cleaner for lists/blockquote/code-block/inline-code, and is documented above under
  "Quill instance". However, calling `quill.insertEmbed(idx, 'slackmention', {...})` **crashed/
  reloaded the whole tab** once during this session (page went unresponsive for ~90s then came
  back with a fresh reload, draft preserved via Slack's autosave). Don't use `insertEmbed` for the
  Slack-custom blots (`slackmention`, `slackslug`, `slackemoji`) against a real logged-in session —
  use the autocomplete-click technique instead (type the trigger char + query text via
  `execCommand`, dispatch `input` event, then `mousedown` on the resulting
  `li[role="option"]` in the suggestion `<ul role="listbox">`). That technique is itself flaky —
  it worked on ~50% of attempts, with no clear signal for why, and there's a lag before you can
  tell whether the pick actually committed (checking `.ql-editor` innerHTML immediately after the
  `mousedown` sometimes shows the old literal text, and it converts a few hundred ms later, or
  never).
- `data-slack-hebrew-rtl` marker from the existing installed extension was seen once, value
  `"mixed"`, on a `.c-virtual_list__item` for a genuinely mixed-language message — consistent with
  "don't rely on it" guidance, but confirms the extension does per-message (not per-line)
  classification today.

## Summary table

| Surface | Reuses message DOM? | Line/paragraph split | Notable quirks |
|---|---|---|---|
| Channel message | — (reference) | `<br aria-hidden="true">` within a `.p-rich_text_section`; block elements (`ul`/`ol`/`blockquote`/`pre`) are siblings, each its own block | Code block joins lines with literal `\n` inside one `<div>`, not `<br>` |
| Thread pane | Yes, identical `.p-rich_text_block` | same | Virtualized; no thread-specific text markup differences |
| DM | Yes, identical `.p-rich_text_block` | same | none found |
| Composer (compose) | No — separate Quill `.ql-editor`, one `<p>` per line | native `<p>` per line | Code block = one `<div class="ql-code-block">` per line (differs from sent-message's single `\n`-joined div); mentions/emoji/channel-refs are custom Quill blots (`slackmention`/`slackemoji`/`slackslug`) |
| Composer (edit mode) | No — same Quill `.ql-editor` as compose, `<p>` per line | native `<p>` per line | Confirmed this session (see below) |
| Search results | Yes, identical `.p-rich_text_block` for full single-line matches; **no**, flattened single-`<div>` snippet for truncated multi-line matches | `<br>` when short enough to show untruncated; **collapsed to one line with inline "..." expand buttons** when the match spans an original line break | Slack injects its own RLM/LRM Unicode control chars into truncated snippets (see below) — a real prior-art bidi mitigation to account for |
| Saved/Later | No — separate "activity item" preview DOM, not `.p-rich_text_block` | Plain text / `<br>`, CSS line-clamp (`--lines: 2`) truncation, not per-line blocks | See below |
| Canvas | Unknown | Unknown | Not attempted |
| Channel topic/header | Unknown | Unknown | Test channel has no topic set; not checked on another channel |
| Sidebar previews/Activity | Unknown | Unknown | Sidebar in this workspace shows channel names only, no message-text previews were found to inspect |

Rendering-approach implication: CSS `unicode-bidi: plaintext` on line containers is a good fit for
the channel/thread/DM message `p-rich_text_section` (lines are `<br>`-separated text runs, not
separate block elements, so per-line direction needs either `unicode-bidi: plaintext` +
`<br>`-aware splitting, or JS-inserted per-line wrapper spans). The composer needs a different
strategy since each line **is** already its own DOM block (`<p>`/`<li>`/code-block `<div>`), so a
per-block `dir`/`unicode-bidi` attribute is simpler there than in the rendered message. Any
solution must treat `<code>`, `<ts-mention>`, `<img class="emoji">`, and (probably) `<ts-mention>`-
family channel-ref elements as atomic LTR/opaque tokens when computing word-majority direction for
a line, since they carry their own `dir="ltr"` and their internal text isn't meant to flip.

## 6. Search, saved, edit mode

Captured via `playwright-cli -s=msedge` attached to the user's real Edge. Search query
`in:#test-channel עודכן` scoped to the test channel returned only the user's own 2 messages
(no other users' content was inspected beyond DOM structure/classnames of the Later list, per the
privacy constraint — no message text from those items is reproduced here).

### Search (top-nav search → full results page)

- The top-nav "Search" icon (`.p-top_nav__search`, `aria-label="Search"`) opens a **Quill-based**
  search box: `.ql-editor[role="combobox"][contenteditable="true"]`, not a plain `<input>`. Typing
  and Enter both work as real Quill/`page.keyboard` input (unlike the composer, this one did not
  need `execCommand` — plausibly because the tab was in real foreground for this session).
  - **Gotcha**: clicking the search icon via `element.click()` in `eval` opens the wrong UI (the
    "Find a conversation…" quick-switcher instead), reproducing the exact issue noted in the
    Quirks section for `#5`. A native Playwright `click` (real CDP `Input.dispatchMouseEvent`, not
    a synthetic DOM `.click()`) opens the actual search box reliably. Prefer native `click`/`hover`/
    `mouse.move`+`down`+`up` over `el.click()` for anything Slack has custom pointer-down handling
    on (search icon, message hover-toolbar kebab, menu items) — this generalizes the composer-only
    guidance in the existing Quirks section to non-composer UI too.
  - A second, unrelated gotcha: Playwright's own actionability wait ("visible, enabled and
    stable") timed out (5s) on several real, on-screen, clickable elements (a menu item, a
    composer). Screenshots confirmed the elements were fully painted and interactive; only
    `mouse.move` + `mouse.down` + `mouse.up` at raw coordinates got the click to register. Likely
    cause: Slack's message list re-renders/animates continuously (virtualized list), so
    Playwright's "two consecutive stable frames" bounding-box check never resolves for it. Prefer
    coordinate-based `mousedown`/`mouseup` (after a `screenshot` to find coordinates) as a fallback
    whenever `click <selector>` times out with a "stable" wait error, rather than retrying the same
    locator.
- Typing the query opens an inline **flexpane preview dropdown** first (`Enter` on it opens the
  full page). This preview already renders a message snippet with the query word wrapped in
  `<span class="c-mrkdwn__highlight">`, same as the full results page (see below) — same
  highlight mechanism in both.
- Full results page (`/…/search`, right side becomes `Results for: …`): each hit is
  `[data-qa="search_result"]` / `.c-search_message` (`--light`/`--ia4` modifiers). Sender header
  (`c-search_message__content_header`), then `c-message__message_blocks` >
  `p-block_kit_renderer__block_wrapper` > **the exact same `.p-rich_text_block[dir="auto"]` >
  `.p-rich_text_section`** markup as a channel message, when the whole match fits on one line:
  ```html
  <div class="p-rich_text_block" dir="auto">
    <div class="p-rich_text_section">PR #123 <span class="c-mrkdwn__highlight">עודכן</span>, תבדוק בבקשה מתי שיש לך זמן.</div>
  </div>
  ```
  Highlight is a single `<span class="c-mrkdwn__highlight">` around just the matched word — no
  extra word-splitting elsewhere in the line.
- **When the original message is multi-line and the snippet must truncate/collapse it**, the
  result is *not* `.p-rich_text_section` + `<br>` any more. It becomes a **single flattened
  `.p-rich_text_section` div with no `<br>` at all**, and the elided line breaks are replaced with
  inline `<button class="c-search__expand"><span class="c-search__expand_ellipsis">...</span></button>`
  markers plus a trailing `... Show more` expand button. Concretely (word text elided, only
  structure/marks matter):
  ```html
  <div class="p-rich_text_block" dir="auto">
    <div class="p-rich_text_section">
      ‏<segment1><button class="c-search__expand">...</button>‎<segment2><button class="c-search__expand">...</button><segment3><span class="c-message__edited_label" dir="ltr"> (edited) </span><button data-qa="search_expand">... Show more</button>
    </div>
  </div>
  ```
  **Important finding**: Slack itself inserts raw Unicode bidi control characters into this
  collapsed snippet — `U+200F` (RLM) as the literal first character, and `U+200E` (LRM) before a
  later Hebrew-starting segment — with no visible glyph, presumably to keep `dir="auto"`'s
  first-strong-character resolution and each segment's internal ordering sane once line breaks are
  discarded and segments are concatenated. This means: (a) multi-line search snippets have **no
  discoverable line boundaries** to hang a per-line `dir` on — there's one physical line of mixed,
  concatenated fragments; (b) Slack is already doing its own crude bidi-mark injection here, so a
  content-script fix for search should either leave this surface alone or be very careful not to
  double-process/strip Slack's own RLM/LRM marks. Recommend treating search snippets as **out of
  scope for v1** per-line logic — there's nothing to split.

### Saved / Later

- Left rail button `button[aria-label="Later"]` → `/…/later`. List is virtualized
  (`.c-virtual_list__item`), same pattern as the message list, but item bodies use a completely
  separate **"activity item" / preview** component, not `.p-rich_text_block`:
  `[data-qa="message_content"] .p-activity_ia4_page__item__senders` (sender), then
  `<span data-qa="activity-item-message"><span class="c-truncate" style="--lines: 2; word-break: break-word;">…</span></span>`.
  - Plain multi-line text is **not** split with `<br>` inside `.c-truncate` in the general case —
    it's CSS line-clamped (`-webkit-line-clamp`-style, via the `--lines` custom property) rather
    than DOM-split per line. One sample item did carry a single trailing `<br>` plus a
    `<span dir="auto" data-qa="simple_message_preview">` wrapper around part of its content, so the
    preview markup is not fully consistent between items (short vs. longer messages, presence of
    an inline emoji, etc.).
  - Inline formatting that does survive: `<code class="c-mrkdwn__code">` for inline code,
    `<a class="c-link">` for links, `<img class="emoji">` for custom emoji — same classes as the
    full message render.
  - Link-only messages skip the rich-text wrapper entirely and render as a bare `<a class="c-link">`
    directly inside `.c-truncate`.
  - **Implication**: Saved/Later previews are single/double-line CSS-clamped snippets, structurally
    closer to the search-snippet case than to the full channel message. No `<br>`-per-line
    structure to key off; skip per-line handling here for v1 as well, same reasoning as search.
    (Full items are presumably viewable by opening them, which was out of scope this pass — not
    checked.)

### Composer edit mode

- Confirmed via the message hover-toolbar kebab (`button[aria-label="More actions"]` — only
  renders after real hover/keyboard-focus, not `eval`-triggered `.click()`) → "Edit message" menu
  item → inline editor swaps in below the rendered message.
- The edit editor is **the exact same Quill component** as the send composer:
  `.ql-editor[dir="auto"][contenteditable="true"][data-qa="texty_input"]`, one `<p>` per line.
  The only DOM differences from the compose box: `aria-label="Edit message"` (vs. `"Message to
  <channel>"`) and `data-feat="edit_composer"` (vs. `data-feat="composer"`) — useful selectors to
  distinguish which composer instance a content script is looking at.
- The existing installed extension already tags edit-mode editors too: saw
  `data-slack-hebrew-rtl="hebrew"` live on the `.ql-editor` being edited — confirms it instruments
  composer instances generically (by component), not just the read-side message list.
- No edit-mode-specific block/line quirks found beyond what's already documented for compose in
  section 4 — treat edit mode as "compose, same rules" for the per-line/per-block `dir` strategy.
- Cancelled via the message's own "Cancel" button (not autosaved/sent) after inspection.

### Automation notes for this pass (addendum to Quirks)

- This session's window behaved like a **real foreground window** for keyboard input (Quill
  `page.keyboard.type` worked directly in the search box, no `execCommand` workaround needed),
  unlike the backgrounded-window behavior documented in section 4's Quirks for the original
  composer-scripting session. Native mouse actions (`click`, `hover`) still frequently failed
  Playwright's actionability "stable" check on real, visible, clickable elements — use raw
  `mouse.move` + `mouse.down` + `mouse.up` at screenshot-derived coordinates as the reliable
  fallback for anything inside Slack's virtualized message list or its popover menus.
