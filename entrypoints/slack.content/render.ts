import { directionOf, firstStrongDirection } from "./direction";

const SAVED_PREVIEW = '[data-qa="activity-item-message"] > .c-truncate';
export const TEXT_CONTAINER = `.p-rich_text_block :is(.p-rich_text_section, .p-rich_text_list > li, .c-mrkdwn__quote), ${SAVED_PREVIEW}`;
// "s:" / "m:" prefix = single- / multi-line; the stylesheet keys plaintext rendering off "m:".
const STATE_ATTRIBUTE = "data-rtl-lite";
const LINE_BREAK = "br, .c-mrkdwn__br";
const URL_TEXT = /^(https?:\/\/|www\.)\S+$/i;

export function renderWithin(root: Element): void {
  if (root.matches(TEXT_CONTAINER)) renderContainer(root as HTMLElement);
  for (const container of root.querySelectorAll<HTMLElement>(TEXT_CONTAINER)) {
    renderContainer(container);
  }
}

function renderContainer(container: HTMLElement): void {
  const text = container.textContent ?? "";
  const multiLine =
    !container.matches(SAVED_PREVIEW) && container.querySelector(LINE_BREAK) !== null;
  const state = `${multiLine ? "m" : "s"}:${hashOf(text)}`;
  if (container.getAttribute(STATE_ATTRIBUTE) === state) return;
  container.setAttribute(STATE_ATTRIBUTE, state);

  // Multi-line lines resolve per line in CSS; the container dir only places list markers and quote bars.
  const direction = multiLine ? firstStrongDirection(text) : directionOf(text);
  if (direction) container.dir = direction;
  else container.removeAttribute("dir");

  for (const link of container.querySelectorAll<HTMLElement>("a.c-link")) {
    if (URL_TEXT.test(link.textContent?.trim() ?? "")) link.dir = "ltr";
  }
}

function hashOf(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
  }
  return (hash >>> 0).toString(36);
}
