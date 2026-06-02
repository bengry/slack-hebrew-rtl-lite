import "./style.css";

const HEBREW_PATTERN = /[\u0590-\u05ff]/;
const LATIN_PATTERN = /[a-zA-Z]+/gi;
const NON_WORD_PUNCTUATION_PATTERN = /[$&+=?@#|<>^*%!]/gi;
const DIRECTION_ATTRIBUTE = "data-slack-hebrew-rtl";

export default defineContentScript({
  matches: ["*://*.slack.com/*"],
  runAt: "document_idle",
  main(ctx) {
    let scanQueued = false;

    function scheduleScan(): void {
      if (scanQueued) return;

      scanQueued = true;
      ctx.requestAnimationFrame(() => {
        scanQueued = false;
        scanSlackDom();
      });
    }

    scanSlackDom();

    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.body ?? document.documentElement, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  },
});

function scanSlackDom(): void {
  scanMessageItems();
  scanComposerEditors();
  scanClassifiedElements(".c-message_attachment");
  scanHebrewOnlyElements(".c-focus_manage_list__item");
  scanHebrewOnlyElements(".c-input_text.c-advanced_search_modal__select");
  scanHebrewOnlyElements(
    "#c-search_autocomplete__suggestion_list, .c-search_autocomplete__suggestion_list",
  );
  scanHebrewOnlyElements(
    ".p-quip_embed_channel_canvas article.document-content .section",
  );
  scanHebrewOnlyElements(
    ".p-saved_for_later_page__list_wrapper .c-virtual_list__item",
  );
}

function scanMessageItems(): void {
  document
    .querySelectorAll<HTMLElement>(".c-virtual_list__item")
    .forEach((item) => {
      const blocks = Array.from(
        item.querySelectorAll<HTMLElement>(".p-rich_text_block"),
      );
      if (blocks.length === 0) return;

      const text = blocks.map(getElementText).join(" ");
      setDirectionAttribute(item, classifyDirection(text));
    });
}

function scanComposerEditors(): void {
  document.querySelectorAll<HTMLElement>(".ql-editor").forEach((editor) => {
    const isHebrew = hasHebrew(getElementText(editor));
    setDirectionAttribute(editor, isHebrew ? "hebrew" : undefined);

    const searchContainer = editor.closest(".c-search__input_box__container");
    const searchBody = Array.from(searchContainer?.children ?? []).find(
      (child) => child.classList.contains("c-basic_container__body"),
    );

    if (searchBody) {
      setDirectionAttribute(searchBody, isHebrew ? "hebrew" : undefined);
    }
  });
}

function scanClassifiedElements(selector: string): void {
  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    setDirectionAttribute(element, classifyDirection(getElementText(element)));
  });
}

function scanHebrewOnlyElements(selector: string): void {
  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    setDirectionAttribute(
      element,
      hasHebrew(getElementText(element)) ? "hebrew" : undefined,
    );
  });
}

function setDirectionAttribute(
  element: Element,
  direction: "hebrew" | "mixed" | undefined,
): void {
  if (direction) {
    element.setAttribute(DIRECTION_ATTRIBUTE, direction);
    return;
  }

  element.removeAttribute(DIRECTION_ATTRIBUTE);
}

function classifyDirection(text: string): "hebrew" | "mixed" | undefined {
  if (!hasHebrew(text)) return undefined;

  const englishText = text.replace(/[^a-zA-Z\d\s]+/gi, " ");
  const hebrewText = text.replace(LATIN_PATTERN, " ");

  return countWords(hebrewText) >= countWords(englishText) ? "hebrew" : "mixed";
}

function hasHebrew(text: string): boolean {
  return HEBREW_PATTERN.test(text);
}

function countWords(text: string): number {
  const normalized = text.replace(NON_WORD_PUNCTUATION_PATTERN, " ").trim();
  return normalized.length === 0 ? 0 : normalized.split(/\s+/).length;
}

function getElementText(element: Element): string {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return element.value;
  }

  return element.textContent ?? "";
}
