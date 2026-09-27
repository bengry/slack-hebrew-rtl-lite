# Always-LTR islands and isolation

Type: grilling
Status: resolved

## Question

Which inline/blocks content is forced LTR and which is only isolated? Candidates: code blocks, inline code, URLs, @mentions, #channels, emoji, timestamps.

Recommendation: force LTR + isolate for code and URLs; isolate without forcing for mentions, channels, emoji.

## Answer

(a) Code blocks, inline code, URLs: forced LTR + isolated. Mentions, channels, emoji: isolated, direction not forced.
