import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LRM, RLM } from "./direction";
import { applyAutoMarks, forcedDirection, toggleMark } from "./marks";

let editor: HTMLElement;

beforeEach(() => {
  editor = document.createElement("div");
  editor.className = "ql-editor";
  editor.contentEditable = "true";
  document.body.append(editor);
  editor.focus();
});

afterEach(() => {
  editor.remove();
});

function addLine(text: string): HTMLParagraphElement {
  const p = document.createElement("p");
  p.textContent = text;
  editor.append(p);
  return p;
}

function placeCaret(line: Element, offset: number): void {
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    if (remaining <= node.length) {
      const range = document.createRange();
      range.setStart(node, remaining);
      range.collapse(true);
      const selection = getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }
    remaining -= node.length;
  }
}

/** Mirrors marks.ts's own private caretOffset, for asserting caret position after an edit. */
function caretOffset(line: Element): number {
  const selection = getSelection();
  if (!selection?.focusNode || !line.contains(selection.focusNode)) return -1;
  const range = document.createRange();
  range.setStart(line, 0);
  range.setEnd(selection.focusNode, selection.focusOffset);
  return range.toString().length;
}

describe("toggleMark", () => {
  it("insert: adds the leading mark and shifts the caret past it", () => {
    const line = addLine("PR #123 עודכן, תבדוק בבקשה.");
    placeCaret(line, 5);

    toggleMark(line, "rtl");

    expect(line.textContent).toBe(`${RLM}PR #123 עודכן, תבדוק בבקשה.`);
    expect(forcedDirection(line)).toBe("rtl");
    expect(caretOffset(line)).toBe(6);
  });

  it("replace: swaps an existing mark for the opposite one, caret offset unchanged", () => {
    const line = addLine(`${LRM}PR #123 עודכן`);
    placeCaret(line, 4);

    toggleMark(line, "rtl");

    expect(line.textContent).toBe(`${RLM}PR #123 עודכן`);
    expect(forcedDirection(line)).toBe("rtl");
    expect(caretOffset(line)).toBe(4);
  });

  it("remove: pressing the same direction again removes the mark", () => {
    const line = addLine(`${RLM}PR #123 עודכן`);
    placeCaret(line, 4);

    toggleMark(line, "rtl");

    expect(line.textContent).toBe("PR #123 עודכן");
    expect(forcedDirection(line)).toBeUndefined();
    expect(caretOffset(line)).toBe(3);
  });
});

describe("applyAutoMarks", () => {
  it("marks only lines whose first strong letter disagrees with the word majority", () => {
    const disagreeingRtl = addLine("PR #123 עודכן, תבדוק בבקשה.");
    const disagreeingLtr = addLine("שלום, the build is green now");
    const agreeing = addLine("תודה רבה!");
    const alreadyMarked = addLine(`${LRM}PR #123 עודכן`);
    const noStrongLetter = addLine("12345");

    applyAutoMarks(editor);

    expect(disagreeingRtl.textContent).toBe(`${RLM}PR #123 עודכן, תבדוק בבקשה.`);
    expect(disagreeingLtr.textContent).toBe(`${LRM}שלום, the build is green now`);
    expect(agreeing.textContent).toBe("תודה רבה!");
    expect(alreadyMarked.textContent).toBe(`${LRM}PR #123 עודכן`);
    expect(noStrongLetter.textContent).toBe("12345");
  });

  it("keeps the caret on its own line, shifted past a newly inserted mark", () => {
    addLine("Deploy is done.");
    const caretLine = addLine("PR #123 עודכן, תבדוק בבקשה.");
    placeCaret(caretLine, 5);

    applyAutoMarks(editor);

    expect(caretLine.textContent).toBe(`${RLM}PR #123 עודכן, תבדוק בבקשה.`);
    expect(caretOffset(caretLine)).toBe(6);
  });
});
