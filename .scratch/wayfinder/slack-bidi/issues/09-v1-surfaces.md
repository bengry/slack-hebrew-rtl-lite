# v1 surfaces

Type: grilling
Status: resolved

## Question

Which Slack surfaces are in v1? Candidates: messages (channels, threads, DMs), composer (new + edit), search results, saved/Later, canvases, channel topic/description, notifications/sidebar previews, huddle chat.

Recommendation: messages, composer, search, saved. Canvases to v2.
Informed by: [Slack DOM inventory](10-slack-dom-inventory.md).

## Answer

Messages (channels, threads, DMs), composer (new + edit), search results, saved/Later. Canvases and other surfaces deferred (fog).

## Comments

2026-09-27: follow-up after [DOM inventory for search and saved](15-dom-inventory-search-saved.md): search snippets and saved previews have no per-line structure. Decision: each such preview gets one direction by word majority; never strip Slack's own RLM/LRM there. Full search results get per-line A+.
