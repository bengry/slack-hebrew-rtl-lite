# Direction rule per paragraph

Type: grilling
Status: resolved

## Question

How is a paragraph's direction decided? (a) first strong char (Docs/Word/Unicode; `PR #123 עודכן` goes LTR), (b) word majority, ties by first strong char (current; T3 goes RTL), (c) first strong char after skipping leading tokens (mentions, channels, links, code, IDs like `PR #123` / `WZ-1234`).

User marked T3 RTL as correct. Recommendation: (b).

## Answer

(b) Word majority, ties by first strong char. Under A+ this governs single-line containers; lines inside multi-line containers resolve by first strong char (accepted in the Rendering mechanism ticket).
