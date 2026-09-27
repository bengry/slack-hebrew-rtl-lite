# Slack DOM inventory

Type: research
Status: resolved
Blocked by: 02

## Question

For each candidate surface (messages in channel/thread/DM, composer new + edit, search results, saved/Later, canvases, channel topic, sidebar previews), how does Slack's DOM represent paragraphs, lines, lists, quotes, code blocks, inline code, links, mentions, emoji? Record selectors, whether lines are `<br>` or elements, existing `dir` attributes, and anything React re-renders often.

Blocked by 02 only because both need the single attached Edge tab.

## Answer

Partial; full detail in [research/slack-dom-inventory.md](../research/slack-dom-inventory.md).

- Channel messages, threads, DMs share the same `.p-rich_text_block` structure: `<br>`-split `.p-rich_text_section`; lists, quotes, code blocks are sibling blocks. A+ covers all three.
- Code blocks (`c-mrkdwn__pre`) hold lines as literal `\n` in one element, not `<br>`.
- Slack forces `dir="ltr"` on `<ts-mention>`: conflicts with [Always-LTR islands and isolation](06-ltr-islands.md) (mentions isolated, not forced). The extension must override it.
- Composer: Quill `.ql-editor`, `<p>` per line; code block = one `div.ql-code-block` per line; mentions/emoji/channels are custom blots.
- Not reached: search, saved (v1), composer edit mode; canvas, topic, sidebar (fog). Follow-up: [DOM inventory for search and saved](15-dom-inventory-search-saved.md).
