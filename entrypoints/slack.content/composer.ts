import type { ContentScriptContext } from "wxt/utils/content-script-context";
import type { Direction } from "./direction";
import { applyAutoMarks, COMPOSER, forcedDirection, lineAt, toggleMark } from "./marks";

const TOOLBAR = 'div[role="toolbar"].c-wysiwyg_container__formatting';
const BUTTON_GROUP = "rtl-lite-dir-buttons";
// event.code, not event.key: macOS's Hebrew layout swaps what the bracket keys type.
const SHORTCUTS: Partial<Record<string, Direction>> = { BracketLeft: "ltr", BracketRight: "rtl" };

export function installComposer(ctx: ContentScriptContext): void {
  // Window capture runs before Quill's own keydown handler on the editor.
  ctx.addEventListener(window, "keydown", onKeydown, { capture: true });
  ctx.addEventListener(document, "selectionchange", updatePressed);
}

export function injectToolbars(): void {
  for (const toolbar of document.querySelectorAll(TOOLBAR)) {
    if (!toolbar.querySelector(`.${BUTTON_GROUP}`)) toolbar.append(createButtons());
  }
}

function onKeydown(event: KeyboardEvent): void {
  const editor = event.target instanceof Element ? event.target.closest(COMPOSER) : null;
  if (!editor || event.isComposing) return;

  const shortcut = SHORTCUTS[event.code];
  if (shortcut && event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
    event.preventDefault();
    event.stopPropagation();
    const line = lineAt(getSelection()?.focusNode);
    if (line) toggleMark(line, shortcut);
    updatePressed();
    return;
  }

  const plainEnter =
    event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;
  if (plainEnter && !autocompleteOpen(editor)) applyAutoMarks(editor);
}

function autocompleteOpen(editor: Element): boolean {
  if (editor.getAttribute("aria-expanded") === "true") return true;
  return Array.from(document.querySelectorAll('[role="listbox"]')).some((list) =>
    list.checkVisibility(),
  );
}

function createButtons(): HTMLElement {
  const group = document.createElement("span");
  group.className = BUTTON_GROUP;
  group.append(
    createButton("ltr", "LTR", "Force line left-to-right (Ctrl+[)"),
    createButton("rtl", "RTL", "Force line right-to-left (Ctrl+])"),
  );
  return group;
}

function createButton(direction: Direction, label: string, title: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.title = title;
  button.dataset.rtlLiteDirection = direction;
  button.setAttribute("aria-pressed", "false");
  // Keeps focus and the caret in the editor on mouse clicks.
  button.addEventListener("mousedown", (event) => event.preventDefault());
  button.addEventListener("click", () => onButton(button, direction));
  return button;
}

function onButton(button: HTMLElement, direction: Direction): void {
  const editor = nearest(button, COMPOSER);
  const selection = getSelection();
  const line = lineAt(selection?.focusNode);
  if (!editor || !line || !editor.contains(line) || !selection?.rangeCount) return;

  // Keyboard activation moved focus to the button; execCommand needs the editor focused.
  if (!editor.contains(document.activeElement)) {
    const range = selection.getRangeAt(0);
    (editor as HTMLElement).focus({ preventScroll: true });
    selection.removeAllRanges();
    selection.addRange(range);
  }
  toggleMark(line, direction);
  updatePressed();
}

function updatePressed(): void {
  const line = lineAt(getSelection()?.focusNode);
  const editor = line?.closest(COMPOSER);
  if (!line || !editor) return;
  const forced = forcedDirection(line);
  const group = nearest(editor, `.${BUTTON_GROUP}`);
  for (const button of group?.querySelectorAll<HTMLElement>("button") ?? []) {
    button.setAttribute("aria-pressed", String(button.dataset.rtlLiteDirection === forced));
  }
}

/** Closest match in the nearest ancestor that has one; pairs a composer with its own toolbar. */
function nearest(from: Element, selector: string): Element | undefined {
  for (let ancestor = from.parentElement; ancestor; ancestor = ancestor.parentElement) {
    const found = ancestor.querySelector(selector);
    if (found) return found;
  }
  return undefined;
}
