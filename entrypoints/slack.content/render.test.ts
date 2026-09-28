import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Direction } from "./direction";
import { renderWithin } from "./render";
import "./style.css";

const MARK_OR_SPACE = /[\s‎‏]/;

let root: HTMLElement;

beforeEach(() => {
  root = document.createElement("div");
  document.body.append(root);
});

afterEach(() => {
  root.remove();
});

function collectTextNodes(node: Node, out: Text[] = []): Text[] {
  if (node.nodeType === Node.TEXT_NODE) out.push(node as Text);
  else for (const child of node.childNodes) collectTextNodes(child, out);
  return out;
}

function findVisibleChar(
  nodes: Text[],
  fromEnd: boolean,
): { node: Text; offset: number } | undefined {
  const ordered = fromEnd ? [...nodes].reverse() : nodes;
  for (const node of ordered) {
    const text = node.data;
    const offsets = fromEnd
      ? Array.from({ length: text.length }, (_, i) => text.length - 1 - i)
      : Array.from({ length: text.length }, (_, i) => i);
    for (const offset of offsets) {
      if (!MARK_OR_SPACE.test(text[offset])) return { node, offset };
    }
  }
  return undefined;
}

function charRect(node: Text, offset: number): DOMRect {
  const range = document.createRange();
  range.setStart(node, offset);
  range.setEnd(node, offset + 1);
  return range.getBoundingClientRect();
}

function edgeSide(rect: DOMRect, containerRect: DOMRect): "left" | "right" {
  const distanceFromLeft = rect.left - containerRect.left;
  const distanceFromRight = containerRect.right - rect.right;
  return distanceFromLeft <= distanceFromRight ? "left" : "right";
}

/** Splits a container's direct children into line groups on `<br>` / `.c-mrkdwn__br` boundaries. */
function splitLines(container: Element): Node[][] {
  const lines: Node[][] = [[]];
  for (const child of Array.from(container.childNodes)) {
    const isBreak = child instanceof Element && child.matches("br, .c-mrkdwn__br");
    if (isBreak) lines.push([]);
    else lines.at(-1)?.push(child);
  }
  return lines;
}

/**
 * The rendered direction of one line: which edge its first visible character starts at,
 * cross-checked against the last character progressing away from that same edge.
 */
function lineDirection(container: Element, lineNodes: Node[]): Direction {
  const textNodes = lineNodes.flatMap((node) => collectTextNodes(node));
  const first = findVisibleChar(textNodes, false);
  const last = findVisibleChar(textNodes, true);
  if (!first || !last) throw new Error("line has no visible character to measure");
  const containerRect = container.getBoundingClientRect();
  const firstRect = charRect(first.node, first.offset);
  const lastRect = charRect(last.node, last.offset);
  const direction: Direction = edgeSide(firstRect, containerRect) === "left" ? "ltr" : "rtl";

  const isSingleChar = first.node === last.node && first.offset === last.offset;
  if (!isSingleChar) {
    const progressesAway =
      direction === "ltr" ? lastRect.left >= firstRect.left : lastRect.left <= firstRect.left;
    if (!progressesAway) {
      throw new Error(
        `inconsistent rendered direction: first char at x=${firstRect.left}, last char at x=${lastRect.left}`,
      );
    }
  }
  return direction;
}

/** Rendered direction of every non-blank line in a text container (br-split lines, or the whole container for single-line ones). */
function renderedLineDirections(container: Element): Direction[] {
  return splitLines(container)
    .filter((line) => line.flatMap((node) => collectTextNodes(node)).some((n) => n.data.trim()))
    .map((line) => lineDirection(container, line));
}

function buildSection(lines: string[]): HTMLElement {
  const section = document.createElement("div");
  section.className = "p-rich_text_section";
  lines.forEach((line, index) => {
    if (line) section.append(document.createTextNode(line));
    if (index < lines.length - 1) {
      const br = document.createElement("br");
      br.setAttribute("aria-hidden", "true");
      section.append(br);
    }
  });
  return section;
}

function buildMessage(lines: string[]): { block: HTMLElement; section: HTMLElement } {
  const block = document.createElement("div");
  block.className = "p-rich_text_block";
  block.dir = "auto";
  const section = buildSection(lines);
  block.append(section);
  return { block, section };
}

const RLM = "‏";
const LRM = "‎";

describe("message rendering acceptance", () => {
  const cases: Record<string, [string[], Direction[]]> = {
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

  for (const [name, [lines, expected]] of Object.entries(cases)) {
    it(`${name}: ${expected.join(", ")}`, () => {
      const { block, section } = buildMessage(lines);
      root.append(block);
      renderWithin(root);
      expect(renderedLineDirections(section)).toEqual(expected);
    });
  }
});

describe("composer", () => {
  it("T2's three lines resolve rtl, ltr, rtl without sending", () => {
    const editor = document.createElement("div");
    editor.className = "ql-editor";
    editor.contentEditable = "true";
    const lines = ["סיכום הפגישה:", "We agreed to ship on Monday, pending QA.", "תודה לכולם!"];
    for (const line of lines) {
      const p = document.createElement("p");
      p.textContent = line;
      editor.append(p);
    }
    root.append(editor);

    const directions = Array.from(editor.querySelectorAll("p")).map((p) =>
      lineDirection(p, Array.from(p.childNodes)),
    );
    expect(directions).toEqual(["rtl", "ltr", "rtl"]);
  });
});

describe("rich message: lists, quote, code, mention", () => {
  function buildRichMessage(): HTMLElement {
    const block = document.createElement("div");
    block.className = "p-rich_text_block";
    block.dir = "auto";

    const bulletList = document.createElement("ul");
    bulletList.className = "p-rich_text_list p-rich_text_list__bullet p-rich_text_list--nested";
    bulletList.dataset.indent = "0";
    bulletList.dataset.border = "0";
    const hebrewItem = document.createElement("li");
    hebrewItem.textContent = "פריט ראשון";
    const englishItem = document.createElement("li");
    englishItem.textContent = "second item";
    bulletList.append(hebrewItem, englishItem);

    const paragraphBreak = document.createElement("div");
    paragraphBreak.className = "p-rich_text_section";
    const breakSpan = document.createElement("span");
    breakSpan.className = "c-mrkdwn__br";
    breakSpan.dataset.stringifyType = "paragraph-break";
    paragraphBreak.append(breakSpan);

    const quote = document.createElement("blockquote");
    quote.className = "c-mrkdwn__quote";
    quote.dataset.stringifyType = "quote";
    quote.textContent = "ציטוט בעברית לבדיקה";

    const codeSection = document.createElement("div");
    codeSection.className = "p-rich_text_section";
    codeSection.append(document.createTextNode("inline code: "));
    const inlineCode = document.createElement("code");
    inlineCode.className = "c-mrkdwn__code";
    inlineCode.textContent = "reversed_עברית()";
    codeSection.append(inlineCode, document.createTextNode(" end."));

    const pre = document.createElement("pre");
    pre.className = "c-mrkdwn__pre";
    pre.dataset.copyCodeBlock = "true";
    const preInner = document.createElement("div");
    preInner.className = "p-rich_text_block--no-overflow";
    preInner.textContent = "const codeBlockExample = 1;\nreturn codeBlockExample;";
    pre.append(preInner);

    const mentionSection = document.createElement("div");
    mentionSection.className = "p-rich_text_section";
    const mention = document.createElement("ts-mention");
    mention.dataset.id = "U0TESTUSER";
    mention.className = "c-member_slug c-member_slug--link ts_tip_texty c-member_slug--mention";
    mention.setAttribute("dir", "ltr");
    mention.textContent = "@שרה כהן";
    mentionSection.append(mention);

    block.append(bulletList, paragraphBreak, quote, codeSection, pre, mentionSection);
    return block;
  }

  it("bullet list items get their own direction and the marker follows the item's side", () => {
    const block = buildRichMessage();
    root.append(block);
    renderWithin(root);

    const [hebrewItem, englishItem] = block.querySelectorAll("li");
    expect(hebrewItem.dir).toBe("rtl");
    expect(englishItem.dir).toBe("ltr");

    // marker moves to the item's own inline-start, i.e. the physical right edge for an rtl item.
    expect(getComputedStyle(hebrewItem).marginRight).toBe("28px");
    expect(getComputedStyle(hebrewItem).marginLeft).toBe("0px");
    expect(getComputedStyle(englishItem).marginLeft).toBe("0px");
    expect(getComputedStyle(englishItem).marginRight).toBe("0px");
  });

  it("quote bar follows the quote's direction", () => {
    const block = buildRichMessage();
    root.append(block);
    renderWithin(root);

    const quote = block.querySelector(".c-mrkdwn__quote") as HTMLElement;
    expect(quote.dir).toBe("rtl");
    expect(getComputedStyle(quote).paddingRight).toBe("16px");
    expect(getComputedStyle(quote).paddingLeft).toBe("0px");
  });

  it("code stays LTR and isolated regardless of its content", () => {
    const block = buildRichMessage();
    root.append(block);
    renderWithin(root);

    const inlineCode = block.querySelector(".c-mrkdwn__code") as HTMLElement;
    const codeBlock = block.querySelector(".c-mrkdwn__pre") as HTMLElement;
    for (const el of [inlineCode, codeBlock]) {
      const style = getComputedStyle(el);
      expect(style.direction).toBe("ltr");
      expect(style.unicodeBidi).toContain("isolate");
    }
  });

  it("a mention with a Hebrew name resolves RTL despite its hard-coded dir=ltr", () => {
    const block = buildRichMessage();
    root.append(block);
    renderWithin(root);

    const mention = block.querySelector("ts-mention") as HTMLElement;
    expect(mention.getAttribute("dir")).toBe("ltr");
    expect(lineDirection(mention, Array.from(mention.childNodes))).toBe("rtl");
  });

  it("the blank paragraph-break section does not throw and gets no forced direction", () => {
    const block = buildRichMessage();
    root.append(block);
    expect(() => renderWithin(root)).not.toThrow();
    const breakSection = block.querySelector(
      '.p-rich_text_section:has(> .c-mrkdwn__br[data-stringify-type="paragraph-break"])',
    ) as HTMLElement;
    expect(breakSection.hasAttribute("dir")).toBe(false);
  });
});
