#!/usr/bin/env node
// Self-check for the direction rule against the spec's Acceptance table. Run: node scripts/check-direction.mjs
import assert from "node:assert/strict";
import {
  autoMarkFor,
  directionOf,
  firstStrongDirection,
} from "../entrypoints/slack.content/direction.ts";

const RLM = "\u200F";
const LRM = "\u200E";

// Multi-line containers render with unicode-bidi: plaintext (first strong char per line);
// single-line containers get directionOf. Blank lines carry no direction and are skipped.
function lineDirections(lines) {
  const rule = lines.length > 1 ? firstStrongDirection : directionOf;
  return lines.filter((line) => line.trim()).map(rule);
}

const acceptance = {
  T1: [
    ["PR review notes:", "השינוי נראה טוב, אבל צריך לבדוק את הטסטים.", "תעדכן אותי כשזה מוכן."],
    ["ltr", "rtl", "rtl"],
  ],
  T2: [
    ["סיכום הפגישה:", "We agreed to ship on Monday, pending QA.", "תודה לכולם!"],
    ["rtl", "ltr", "rtl"],
  ],
  T3: [["PR #123 עודכן, תבדוק בבקשה מתי שיש לך זמן."], ["rtl"]],
  T4: [["הבעיה היא ב-useEffect שרץ פעמיים ב-StrictMode."], ["rtl"]],
  T5: [
    ["Deploy is done.", "All checks passed on staging and prod.", "", "תודה רבה!"],
    ["ltr", "ltr", "rtl"],
  ],
  T6: [["אני חושב שה-feature flag צריך להיות off by default עד שנסיים QA."], ["rtl"]],
  T7: [["Can you check the ticket about דוחות חודשיים before Sunday?"], ["ltr"]],
  T8: [
    ["בדקתי את זה:", "npm run build fails on CI", "אבל מקומית זה עובד.", "Any idea why?"],
    ["rtl", "ltr", "rtl", "ltr"],
  ],
  marks: [
    [`${RLM}PR #123 עודכן, תבדוק בבקשה.`, `${LRM}שלום world`, "hello עולם edited"],
    ["rtl", "ltr", "ltr"],
  ],
};

for (const [name, [lines, expected]] of Object.entries(acceptance)) {
  assert.deepEqual(lineDirections(lines), expected, name);
}

// Word majority, ties by first strong letter, no strong letter = untouched.
assert.equal(directionOf("hello עולם"), "ltr", "tie, Latin first");
assert.equal(directionOf("שלום world"), "rtl", "tie, Hebrew first");
assert.equal(
  directionOf("ב-useEffect"),
  "rtl",
  "mixed word counts for neither; tie falls to first strong",
);
assert.equal(directionOf("123 :) 456"), undefined, "no strong letter");
assert.equal(directionOf(""), undefined, "empty");

// A leading mark (after whitespace) overrides the majority.
assert.equal(directionOf(`${RLM}hello big world`), "rtl", "leading RLM");
assert.equal(directionOf(`  ${LRM}שלום עולם גדול`), "ltr", "LRM after leading whitespace");
assert.equal(firstStrongDirection(`${RLM}PR`), "rtl", "RLM is a strong RTL letter");

// Arabic and other RTL scripts.
assert.equal(directionOf("مرحبا بالعالم hello"), "rtl", "Arabic majority");
assert.equal(directionOf("see the ملف attached"), "ltr", "Arabic minority");
assert.equal(firstStrongDirection("123 ܫܠܡܐ"), "rtl", "Syriac");

// Automatic send-time marks: only where first strong letter disagrees with the majority.
assert.equal(autoMarkFor("PR #123 עודכן, תבדוק בבקשה."), RLM, "Latin-first Hebrew line gets RLM");
assert.equal(
  autoMarkFor("שלום, the build is green now"),
  LRM,
  "Hebrew-first English line gets LRM",
);
assert.equal(autoMarkFor("תודה רבה!"), undefined, "agreeing line gets none");
assert.equal(autoMarkFor(`${LRM}PR #123 עודכן`), undefined, "already marked");
assert.equal(autoMarkFor("12345"), undefined, "no strong letter");

console.log("check-direction: all assertions passed");
