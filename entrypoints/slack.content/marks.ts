import { autoMarkFor, LRM, RLM, type Direction } from "./direction";

// Every edit goes through execCommand so Quill sees it as user input; direct DOM edits desync Quill.
export const COMPOSER = '.ql-editor[contenteditable="true"]:not([role="combobox"])';

export function lineAt(node: Node | null | undefined): HTMLElement | undefined {
  const element = node instanceof Element ? node : node?.parentElement;
  const line = element?.closest<HTMLElement>("p");
  return line?.closest(COMPOSER) ? line : undefined;
}

export function forcedDirection(line: Element): Direction | undefined {
  const first = line.textContent?.[0];
  if (first === RLM) return "rtl";
  if (first === LRM) return "ltr";
  return undefined;
}

/** Insert, replace or (when already forced this way) remove the caret line's leading mark. */
export function toggleMark(line: HTMLElement, direction: Direction): void {
  const current = forcedDirection(line);
  const caret = caretOffset(line);
  if (current === direction) {
    selectLeadingChar(line);
    document.execCommand("delete");
    restoreCaret(line, caret - 1);
  } else if (current) {
    selectLeadingChar(line);
    document.execCommand("insertText", false, markFor(direction));
    restoreCaret(line, caret);
  } else {
    collapseAtStart(line);
    document.execCommand("insertText", false, markFor(direction));
    restoreCaret(line, caret + 1);
  }
}

/** Prepend a mark to every line whose first strong letter disagrees with its word majority. */
export function applyAutoMarks(editor: Element): void {
  const selection = getSelection();
  const caretLine = lineAt(selection?.focusNode);
  const caret = caretLine ? caretOffset(caretLine) : 0;
  let caretShift = 0;

  for (const line of editor.querySelectorAll<HTMLElement>("p")) {
    const mark = autoMarkFor(line.textContent ?? "");
    if (!mark) continue;
    collapseAtStart(line);
    document.execCommand("insertText", false, mark);
    if (line === caretLine) caretShift = 1;
  }

  if (caretLine) restoreCaret(caretLine, caret + caretShift);
}

function markFor(direction: Direction): string {
  return direction === "rtl" ? RLM : LRM;
}

function firstTextNode(line: Element): Text | undefined {
  return (
    (document.createTreeWalker(line, NodeFilter.SHOW_TEXT).nextNode() as Text | null) ?? undefined
  );
}

function select(range: Range): void {
  const selection = getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function collapseAtStart(line: Element): void {
  const range = document.createRange();
  // Element offset 0, not the first text node: that could sit inside a mention or emoji blot.
  range.setStart(line, 0);
  range.collapse(true);
  select(range);
}

function selectLeadingChar(line: Element): void {
  const text = firstTextNode(line);
  if (!text) return;
  const range = document.createRange();
  range.setStart(text, 0);
  range.setEnd(text, 1);
  select(range);
}

function caretOffset(line: Element): number {
  const selection = getSelection();
  if (!selection?.focusNode || !line.contains(selection.focusNode)) return 0;
  const range = document.createRange();
  range.setStart(line, 0);
  range.setEnd(selection.focusNode, selection.focusOffset);
  return range.toString().length;
}

function restoreCaret(line: Element, offset: number): void {
  if (!line.isConnected) return;
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
  let remaining = Math.max(offset, 0);
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    if (remaining <= node.length) {
      const range = document.createRange();
      range.setStart(node, remaining);
      range.collapse(true);
      select(range);
      return;
    }
    remaining -= node.length;
  }
  const end = document.createRange();
  end.selectNodeContents(line);
  end.collapse(false);
  select(end);
}
