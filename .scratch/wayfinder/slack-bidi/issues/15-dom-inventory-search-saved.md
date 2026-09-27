# DOM inventory for search and saved

Type: research
Status: resolved

## Question

For v1 surfaces missed by [Slack DOM inventory](10-slack-dom-inventory.md): search results, saved/Later, composer edit mode. Same facts: root selector, line split, `dir` attributes, list/quote/code/mention markup. Search is a flexpane that resisted automation while Edge was backgrounded; run with Edge frontmost. Read the research file's automation gotchas first.

## Answer

Detail in [research/slack-dom-inventory.md](../research/slack-dom-inventory.md), section 6.

- Search, full result: same `.p-rich_text_block[dir=auto]` > `.p-rich_text_section` as messages; A+ applies. Matched words wrapped in `span.c-mrkdwn__highlight`.
- Search, truncated multi-line match: one flattened `.p-rich_text_section`, no `<br>`; lines joined with "..." / "Show more". Slack itself injects RLM/LRM at segment boundaries. No per-line structure.
- Saved/Later: separate activity-item preview (`c-truncate`, CSS line clamp), not rich text; no per-line structure.
- Composer edit mode: same Quill `.ql-editor`, `<p>` per line; identifiable by `aria-label="Edit message"` / `data-feat="edit_composer"`.
- Consequence: search snippets and saved previews cannot get per-line direction; see the v1 surfaces follow-up question.
