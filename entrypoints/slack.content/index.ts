import "./style.css";

const HEBREW_PATTERN = /[\u0590-\u05ff]/;
const LATIN_PATTERN = /[a-zA-Z]+/gi;
const NON_WORD_PUNCTUATION_PATTERN = /[$&+=?@#|<>^*%!]/gi;
const DIRECTION_ATTRIBUTE = "data-slack-hebrew-rtl";
const MESSAGE_ITEM_SELECTOR = ".c-virtual_list__item";
const COMPOSER_EDITOR_SELECTOR = ".ql-editor";
const CLASSIFIED_ELEMENT_SELECTOR = ".c-message_attachment";
const HEBREW_ONLY_SELECTORS = [
  ".c-focus_manage_list__item",
  ".c-input_text.c-advanced_search_modal__select",
  "#c-search_autocomplete__suggestion_list, .c-search_autocomplete__suggestion_list",
  ".p-quip_embed_channel_canvas article.document-content .section",
  ".p-saved_for_later_page__list_wrapper .c-virtual_list__item",
];
const SCOPED_SURFACE_SELECTORS = [
  MESSAGE_ITEM_SELECTOR,
  COMPOSER_EDITOR_SELECTOR,
  CLASSIFIED_ELEMENT_SELECTOR,
  ...HEBREW_ONLY_SELECTORS,
];

export default defineContentScript({
  matches: ["*://*.slack.com/*"],
  runAt: "document_idle",
  main(ctx) {
    let scanQueued = false;
    let fullScanQueued = false;
    const queuedScanRoots = new Set<Element>();

    function scheduleScan(records: MutationRecord[]): void {
      for (const record of records) {
        const root = getScopedScanRoot(record.target);
        if (root) {
          queuedScanRoots.add(root);
        } else {
          fullScanQueued = true;
        }
      }

      if (scanQueued) return;

      scanQueued = true;
      ctx.requestAnimationFrame(() => {
        scanQueued = false;

        if (fullScanQueued) {
          fullScanQueued = false;
          queuedScanRoots.clear();
          scanSlackDom();
          return;
        }

        const roots = Array.from(queuedScanRoots);
        queuedScanRoots.clear();
        roots.forEach(scanSlackDom);
      });
    }

    scanSlackDom();

    const observer = new MutationObserver((records) => scheduleScan(records));
    observer.observe(document.body ?? document.documentElement, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  },
});

function scanSlackDom(root: ParentNode = document): void {
  scanMessageItems(root);
  scanComposerEditors(root);
  scanClassifiedElements(CLASSIFIED_ELEMENT_SELECTOR, root);
  HEBREW_ONLY_SELECTORS.forEach((selector) => {
    scanHebrewOnlyElements(selector, root);
  });
}

function scanMessageItems(root: ParentNode): void {
  queryElements(root, MESSAGE_ITEM_SELECTOR).forEach((item) => {
    const blocks = Array.from(
      item.querySelectorAll<HTMLElement>(".p-rich_text_block"),
    );
    if (blocks.length === 0) return;

    const text = blocks.map(getElementText).join(" ");
    setDirectionAttribute(item, classifyDirection(text));
  });
}

function scanComposerEditors(root: ParentNode): void {
  queryElements(root, COMPOSER_EDITOR_SELECTOR).forEach((editor) => {
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

function scanClassifiedElements(selector: string, root: ParentNode): void {
  queryElements(root, selector).forEach((element) => {
    setDirectionAttribute(element, classifyDirection(getElementText(element)));
  });
}

function scanHebrewOnlyElements(selector: string, root: ParentNode): void {
  queryElements(root, selector).forEach((element) => {
    setDirectionAttribute(
      element,
      hasHebrew(getElementText(element)) ? "hebrew" : undefined,
    );
  });
}

function getScopedScanRoot(target: Node): Element | undefined {
  const element = getMutationTargetElement(target);
  if (!element) return undefined;

  let closestRoot: Element | undefined;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const selector of SCOPED_SURFACE_SELECTORS) {
    const root = closestElement(element, selector);
    if (!root) continue;

    const distance = getElementDistance(element, root);
    if (distance < closestDistance) {
      closestRoot = root;
      closestDistance = distance;
    }
  }

  return closestRoot;
}

function getMutationTargetElement(target: Node): Element | undefined {
  const candidate = target as Element;
  if (typeof candidate.closest === "function") return candidate;

  return target.parentElement ?? undefined;
}

function closestElement(element: Element, selector: string): Element | undefined {
  try {
    return element.closest(selector) ?? undefined;
  } catch {
    return undefined;
  }
}

function getElementDistance(from: Element, to: Element): number {
  let distance = 0;
  let element: Element | null = from;

  while (element) {
    if (element === to) return distance;
    element = element.parentElement;
    distance += 1;
  }

  return Number.POSITIVE_INFINITY;
}

function queryElements(root: ParentNode, selector: string): HTMLElement[] {
  const elements = Array.from(root.querySelectorAll<HTMLElement>(selector));
  if (rootMatchesSelector(root, selector)) {
    elements.unshift(root);
  }

  return elements;
}

function rootMatchesSelector(
  root: ParentNode,
  selector: string,
): root is HTMLElement {
  const candidate = root as Element;
  if (typeof candidate.closest !== "function") return false;

  try {
    return candidate.closest(selector) === candidate;
  } catch {
    return false;
  }
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
