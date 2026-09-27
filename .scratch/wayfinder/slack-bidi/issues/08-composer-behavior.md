# Composer direction behavior

Type: grilling
Status: resolved
Blocked by: 04

## Question

In the composer (new message + edit): (a) auto direction per `<p>` using the direction rule, (b) auto + shortcut to force a paragraph's direction, (c) manual only.

Recommendation: (a) for v1; manual override stays in the fog.

## Answer

(a) Auto only: CSS `unicode-bidi: plaintext; text-align: start` per `<p>` (first strong char). JS word-majority `dir` on `<p>` only if a prototype shows Quill keeps the attribute. Manual override moves to the direction-marks tickets.
