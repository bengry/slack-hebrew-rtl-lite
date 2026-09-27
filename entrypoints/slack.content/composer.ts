import type { ContentScriptContext } from "wxt/utils/content-script-context";
import type { Direction } from "./direction";
import { applyAutoMarks, COMPOSER, forcedDirection, lineAt, toggleMark } from "./marks";
import { attachTooltip } from "./tooltip";

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
    if (toolbar.querySelector(`.${BUTTON_GROUP}`)) continue;
    // Next to Slack's own formatting buttons; the toolbar root would push them to the far edge.
    const host = toolbar.querySelector("button[data-format]")?.parentElement ?? toolbar;
    host.append(createButtons());
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

// Drawn on Slack's 20x20 icon grid with its 1.5 round-capped strokes: aligned text lines + direction arrow.
const ICON_PATHS: Record<Direction, string> = {
  ltr: "M2.75 3.25h14.5M2.75 7.75h9.5M2.75 15.25h14M14 12.5l2.75 2.75L14 18",
  rtl: "M17.25 3.25H2.75M17.25 7.75h-9.5M17.25 15.25h-14M6 12.5l-2.75 2.75L6 18",
};
// Slack's own toolbar button classes, so size, hover, pressed state and theme match its buttons.
const SLACK_BUTTON_CLASSES =
  "c-button-unstyled c-icon_button c-icon_button--size_smedium p-composer__button p-composer__button--composer_ia p-composer__selection_button p-composer__button--sticky c-icon_button--default";

function createButtons(): HTMLElement {
  const group = document.createElement("span");
  group.className = BUTTON_GROUP;
  const separator = document.createElement("span");
  separator.className = "p-composer__separator";
  group.append(
    separator,
    createButton("ltr", "Left-to-right line", "["),
    createButton("rtl", "Right-to-left line", "]"),
  );
  return group;
}

function createIcon(direction: Direction): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", ICON_PATHS[direction]);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.5");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  return svg;
}

function createButton(direction: Direction, label: string, key: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = SLACK_BUTTON_CLASSES;
  button.append(createIcon(direction));
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-keyshortcuts", `Control+${key}`);
  attachTooltip(button, label, key);
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
