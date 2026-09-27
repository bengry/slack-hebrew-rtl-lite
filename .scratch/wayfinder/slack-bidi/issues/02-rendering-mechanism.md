# Rendering mechanism

Type: prototype
Status: resolved

## Question

How does the extension give each paragraph (line) its own direction inside Slack's `<br>`-split `.p-rich_text_section`?

- A: CSS only, `unicode-bidi: plaintext` + `text-align: start` (first strong char per line).
- A+: A, plus JS sets `dir` by word majority on sections with no line breaks.
- B: JS per-line majority by wrapping lines in spans or inserting U+200E/U+200F marks. Check edit, copy-paste, and React re-render side effects.

Test corpus (test-channel):

- T1: `PR review notes:` / `השינוי נראה טוב, אבל צריך לבדוק את הטסטים.` / `תעדכן אותי כשזה מוכן.`
- T2: `סיכום הפגישה:` / `We agreed to ship on Monday, pending QA.` / `תודה לכולם!`
- T3: `PR #123 עודכן, תבדוק בבקשה מתי שיש לך זמן.`
- T4: `הבעיה היא ב-useEffect שרץ פעמיים ב-StrictMode.`
- T5: `Deploy is done.` / `All checks passed on staging and prod.` / (blank) / `תודה רבה!`
- T6: `אני חושב שה-feature flag צריך להיות off by default עד שנסיים QA.`
- T7: `Can you check the ticket about דוחות חודשיים before Sunday?`
- T8: `בדקתי את זה:` / `npm run build fails on CI` / `אבל מקומית זה עובד.` / `Any idea why?`

Asset: live prototype run by the `rtl-prototype` agent; screenshots in `/tmp/rtl-proto/`.

## Comments

**2026-09-27, rtl-prototype findings (awaiting user reaction):**

| Msg | A | A+ | B |
|---|---|---|---|
| T1, T2, T5, T8 (multi-line) | correct | correct | correct |
| T3 (1 line, starts Latin, Hebrew majority) | broken (LTR) | correct | correct |
| T4, T6, T7 (1 line) | correct | correct | correct |

- A+ = `unicode-bidi: plaintext; text-align: start` on sections that contain `<br>`, plus JS word-majority `dir` on sections without `<br>`. Only sets attributes/styles on existing elements.
- B (span per line) is wiped by Slack's React re-render (edit then cancel reverted it to `<br>` markup). Copy-paste stayed clean. Would need re-wrapping after every re-render.
- Gap no option except B covers: a line inside a multi-line message that starts Latin but is Hebrew-majority. Not present in T1-T8.
- Composer: `.ql-editor p { unicode-bidi: plaintext; text-align: start }` resolves per `<p>` (checked via computed style; real typing not tested).
- Mixed, non-mirrored messages: RTL lines align to the pane's right edge, LTR lines to the left, as in Docs.
- Agent recommends: A+.
- Follow-up check: user's visual verdicts were the true baseline (no injections present). A+ re-injected and checked per line against word-majority expectation: every line of T1-T8 matched, including T2 and T8 (broken at baseline).

## Answer

A+. `unicode-bidi: plaintext; text-align: start` on line containers that hold more than one line; JS word-majority `dir` on single-line containers. B rejected: Slack's React re-render wipes restructured nodes. Accepted gap: inside multi-line messages, a line's direction comes from its first strong char.
