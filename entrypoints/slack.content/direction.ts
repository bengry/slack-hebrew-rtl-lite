export type Direction = "rtl" | "ltr";

export const RLM = "\u200F";
export const LRM = "\u200E";

const RTL_SCRIPTS =
  "\\p{Script=Hebrew}\\p{Script=Arabic}\\p{Script=Syriac}\\p{Script=Thaana}\\p{Script=Nko}\\p{Script=Samaritan}\\p{Script=Mandaic}\\p{Script=Adlam}";
const RTL_LETTER = new RegExp(`[${RTL_SCRIPTS}${RLM}]`, "u");
const LTR_LETTER = new RegExp(`${LRM}|(?![${RTL_SCRIPTS}])\\p{L}`, "u");
// Group 1 = RTL letter, group 2 = any other letter; alternation order makes RTL win.
const FIRST_STRONG = new RegExp(`([${RTL_SCRIPTS}${RLM}])|(${LRM}|\\p{L})`, "u");

export function leadingMark(text: string): Direction | undefined {
  const first = text.trimStart()[0];
  if (first === RLM) return "rtl";
  if (first === LRM) return "ltr";
  return undefined;
}

export function firstStrongDirection(text: string): Direction | undefined {
  const match = FIRST_STRONG.exec(text);
  if (!match) return undefined;
  return match[1] ? "rtl" : "ltr";
}

export function directionOf(text: string): Direction | undefined {
  const mark = leadingMark(text);
  if (mark) return mark;

  let rtlWords = 0;
  let ltrWords = 0;
  for (const word of text.split(/\s+/)) {
    const hasRtl = RTL_LETTER.test(word);
    const hasLtr = LTR_LETTER.test(word);
    if (hasRtl && !hasLtr) rtlWords += 1;
    else if (hasLtr && !hasRtl) ltrWords += 1;
  }

  if (rtlWords !== ltrWords) return rtlWords > ltrWords ? "rtl" : "ltr";
  return firstStrongDirection(text);
}

/** The mark to prepend so a first-strong renderer shows the line in its word-majority direction. */
export function autoMarkFor(line: string): string | undefined {
  if (leadingMark(line)) return undefined;
  const majority = directionOf(line);
  if (!majority || majority === firstStrongDirection(line)) return undefined;
  return majority === "rtl" ? RLM : LRM;
}
