import { describe, expect, it } from "vitest";
import { autoMarkFor, directionOf, firstStrongDirection, LRM, RLM } from "./direction";

// Multi-line containers render with unicode-bidi: plaintext (first strong char per line);
// single-line containers get directionOf. Blank lines carry no direction and are skipped.
function lineDirections(lines: string[]): Array<"ltr" | "rtl" | undefined> {
  const rule = lines.length > 1 ? firstStrongDirection : directionOf;
  return lines.filter((line) => line.trim()).map(rule);
}

describe("acceptance table", () => {
  it("T1: ltr, rtl, rtl", () => {
    expect(
      lineDirections([
        "PR review notes:",
        "השינוי נראה טוב, אבל צריך לבדוק את הטסטים.",
        "תעדכן אותי כשזה מוכן.",
      ]),
    ).toEqual(["ltr", "rtl", "rtl"]);
  });

  it("T2: rtl, ltr, rtl", () => {
    expect(
      lineDirections(["סיכום הפגישה:", "We agreed to ship on Monday, pending QA.", "תודה לכולם!"]),
    ).toEqual(["rtl", "ltr", "rtl"]);
  });

  it("T3: rtl", () => {
    expect(lineDirections(["PR #123 עודכן, תבדוק בבקשה מתי שיש לך זמן."])).toEqual(["rtl"]);
  });

  it("T4: rtl", () => {
    expect(lineDirections(["הבעיה היא ב-useEffect שרץ פעמיים ב-StrictMode."])).toEqual(["rtl"]);
  });

  it("T5: ltr, ltr, rtl (blank line skipped)", () => {
    expect(
      lineDirections([
        "Deploy is done.",
        "All checks passed on staging and prod.",
        "",
        "תודה רבה!",
      ]),
    ).toEqual(["ltr", "ltr", "rtl"]);
  });

  it("T6: rtl", () => {
    expect(
      lineDirections(["אני חושב שה-feature flag צריך להיות off by default עד שנסיים QA."]),
    ).toEqual(["rtl"]);
  });

  it("T7: ltr", () => {
    expect(lineDirections(["Can you check the ticket about דוחות חודשיים before Sunday?"])).toEqual(
      ["ltr"],
    );
  });

  it("T8: rtl, ltr, rtl, ltr", () => {
    expect(
      lineDirections([
        "בדקתי את זה:",
        "npm run build fails on CI",
        "אבל מקומית זה עובד.",
        "Any idea why?",
      ]),
    ).toEqual(["rtl", "ltr", "rtl", "ltr"]);
  });

  it("marks message: rtl, ltr, ltr", () => {
    expect(
      lineDirections([
        `${RLM}PR #123 עודכן, תבדוק בבקשה.`,
        `${LRM}שלום world`,
        "hello עולם edited",
      ]),
    ).toEqual(["rtl", "ltr", "ltr"]);
  });
});

describe("directionOf", () => {
  it("word majority, ties by first strong letter, no strong letter = untouched", () => {
    expect(directionOf("hello עולם")).toBe("ltr");
    expect(directionOf("שלום world")).toBe("rtl");
    expect(directionOf("ב-useEffect")).toBe("rtl");
    expect(directionOf("123 :) 456")).toBeUndefined();
    expect(directionOf("")).toBeUndefined();
  });

  it("a leading mark (after whitespace) overrides the majority", () => {
    expect(directionOf(`${RLM}hello big world`)).toBe("rtl");
    expect(directionOf(`  ${LRM}שלום עולם גדול`)).toBe("ltr");
    expect(firstStrongDirection(`${RLM}PR`)).toBe("rtl");
  });

  it("Arabic and other RTL scripts", () => {
    expect(directionOf("مرحبا بالعالم hello")).toBe("rtl");
    expect(directionOf("see the ملف attached")).toBe("ltr");
    expect(firstStrongDirection("123 ܫܠܡܐ")).toBe("rtl");
  });
});

describe("autoMarkFor", () => {
  it("only marks where first strong letter disagrees with the majority", () => {
    expect(autoMarkFor("PR #123 עודכן, תבדוק בבקשה.")).toBe(RLM);
    expect(autoMarkFor("שלום, the build is green now")).toBe(LRM);
    expect(autoMarkFor("תודה רבה!")).toBeUndefined();
    expect(autoMarkFor(`${LRM}PR #123 עודכן`)).toBeUndefined();
    expect(autoMarkFor("12345")).toBeUndefined();
  });
});
