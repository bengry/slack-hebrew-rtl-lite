# Paragraph unit

Type: prototype
Status: resolved
Blocked by: 10

## Question

What is the unit that gets its own direction and alignment, judged on real conversations (user's DMs and #frontend-team, read-only)?

- P1: each `<br>` line gets its own direction and its own alignment (A+ as decided). Lines of one message can zig-zag between the left and right edges.
- P2: each line gets its own direction, but the whole message shares one alignment, set by message word majority.
- P3: whole message gets one direction and alignment (today's behavior, without layout mirroring).
- P4: each blank-line-separated paragraph gets its own direction. Needs line wrapping (fragile, see Rendering mechanism); simulate for visual comparison only.

Also measure on real messages: how often a line inside a multi-line message starts with Latin but is Hebrew-majority (the accepted A+ gap).

Blocked by 10 only because both need the single attached Edge tab. Private message text stays out of this repo; screenshots go to `/tmp`.

## Comments

**2026-09-27, paragraph-unit agent:** DMs blocked by the permission system (personal data); only the test channel and #frontend-team (2 messages) inspected. P1 zig-zag confirmed visible in a wide pane; sample too thin to separate P2/P3/P4. Gap lines: 0 of 10 (curated sample, not a base rate).

**2026-09-27, live comparison:** P1 and P2 injected on T1-T8 in the user's Edge for side-by-side viewing. P3 conflicts with [Rendering mechanism](02-rendering-mechanism.md) (drops per-line direction); P4 needs line wrapping (rejected option B).

## Answer

P1: each line gets its own direction and its own alignment (`text-align: start`), i.e. A+ unchanged. User approved after viewing P1 live on T1-T8. Zig-zag between edges is accepted, matching Docs/Word paragraph behavior.
