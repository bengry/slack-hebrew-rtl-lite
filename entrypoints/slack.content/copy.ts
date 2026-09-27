const MESSAGE_SURFACE = ".c-virtual_list__item, .p-rich_text_block";
// Slack inserts its own marks into search snippets; leave copies from there alone.
const EXCLUDED = '.ql-editor, .c-search_message, [data-qa="search_result"]';
const TEXT_LINE_START_MARKS = /^([^\S\n]*)[\u200E\u200F]+/gm;
const HTML_LINE_START_MARKS =
  /((?:^|<br[^>]*>|<\/?(?:div|p|li|ul|ol|blockquote)\b[^>]*>)\s*)[\u200E\u200F]+/gi;

/** Strips line-leading RLM/LRM from copies out of messages. Registered last so it sees Slack's own clipboard data. */
export function stripMarksOnCopy(event: ClipboardEvent): void {
  const selection = getSelection();
  const anchor = selection?.anchorNode;
  const element = anchor instanceof Element ? anchor : anchor?.parentElement;
  const clipboard = event.clipboardData;
  if (!selection || selection.isCollapsed || !clipboard) return;
  if (!element?.closest(MESSAGE_SURFACE) || element.closest(EXCLUDED)) return;

  let text: string;
  let html: string;
  if (event.defaultPrevented) {
    text = clipboard.getData("text/plain");
    html = clipboard.getData("text/html");
  } else {
    const fragment = document.createElement("div");
    for (let index = 0; index < selection.rangeCount; index += 1) {
      fragment.append(selection.getRangeAt(index).cloneContents());
    }
    text = selection.toString();
    html = fragment.innerHTML;
  }

  if (text) clipboard.setData("text/plain", text.replace(TEXT_LINE_START_MARKS, "$1"));
  if (html) clipboard.setData("text/html", html.replace(HTML_LINE_START_MARKS, "$1"));
  event.preventDefault();
}
