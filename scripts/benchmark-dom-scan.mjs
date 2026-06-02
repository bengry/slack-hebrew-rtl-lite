#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import vm from "node:vm";

const DATA_ATTRIBUTE = "data-slack-hebrew-rtl";
const HEBREW_TEXT = "\u05d4\u05d5\u05d3\u05e2\u05d4 \u05d1\u05e2\u05d1\u05e8\u05d9\u05ea";
const MIXED_TEXT =
  "Mostly English text with \u05e2\u05d1\u05e8\u05d9\u05ea inside the message";
const ENGLISH_TEXT = "Plain English message";
const SCRIPT_PATH = ".output/chrome-mv3/content-scripts/slack.js";

class FakeClassList {
  constructor(classes) {
    this.classes = new Set(classes);
  }

  contains(className) {
    return this.classes.has(className);
  }
}

class FakeElement {
  constructor(tagName, options = {}) {
    this.tagName = tagName.toLowerCase();
    this.id = options.id ?? "";
    this.classList = new FakeClassList(options.classes ?? []);
    this.children = [];
    this.parentElement = null;
    this.attributes = new Map();
    this.ownText = options.text ?? "";
  }

  append(...children) {
    for (const child of children) {
      child.parentElement = this;
      this.children.push(child);
    }
    return this;
  }

  get textContent() {
    return `${this.ownText}${this.children.map((child) => child.textContent).join("")}`;
  }

  set textContent(value) {
    this.ownText = value;
    this.children = [];
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  closest(selector) {
    let element = this;
    while (element) {
      if (matchesSimpleSelector(element, selector)) return element;
      element = element.parentElement;
    }
    return null;
  }

  querySelectorAll(selector) {
    const selectors = selector.split(",").map((part) => part.trim());
    const candidates = descendantsOf(this);
    return candidates.filter((element) =>
      selectors.some((singleSelector) => matchesSelector(element, singleSelector)),
    );
  }
}

class FakeInputElement extends FakeElement {
  constructor(tagName, options = {}) {
    super(tagName, options);
    this.value = options.value ?? "";
  }
}

class FakeDocument {
  constructor(body) {
    this.body = body;
    this.documentElement = body;
    this.listeners = new Map();
  }

  querySelectorAll(selector) {
    return this.body.querySelectorAll(selector);
  }

  addEventListener(name, listener) {
    this.listeners.set(name, listener);
  }

  removeEventListener(name) {
    this.listeners.delete(name);
  }

  dispatchEvent(event) {
    this.listeners.get(event.type)?.(event);
    return true;
  }
}

class FakeMutationObserver {
  static instances = [];

  constructor(callback) {
    this.callback = callback;
    FakeMutationObserver.instances.push(this);
  }

  observe() {}
}

class FakeEvent {
  constructor(type) {
    this.type = type;
  }
}

class FakeCustomEvent extends FakeEvent {
  constructor(type, options = {}) {
    super(type);
    this.detail = options.detail;
  }
}

function element(tagName, options, children = []) {
  return new FakeElement(tagName, options).append(...children);
}

function input(tagName, options) {
  return new FakeInputElement(tagName, options);
}

function descendantsOf(root) {
  const descendants = [];
  const stack = [...root.children];
  while (stack.length > 0) {
    const current = stack.shift();
    descendants.push(current);
    stack.unshift(...current.children);
  }
  return descendants;
}

function matchesSelector(element, selector) {
  const tokens = selector.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  if (!matchesSimpleSelector(element, tokens.at(-1))) return false;

  let ancestor = element.parentElement;
  for (let index = tokens.length - 2; index >= 0; index -= 1) {
    while (ancestor && !matchesSimpleSelector(ancestor, tokens[index])) {
      ancestor = ancestor.parentElement;
    }
    if (!ancestor) return false;
    ancestor = ancestor.parentElement;
  }

  return true;
}

function matchesSimpleSelector(element, selector) {
  const idMatch = selector.match(/#([A-Za-z0-9_-]+)/);
  if (idMatch && element.id !== idMatch[1]) return false;

  const classes = [...selector.matchAll(/\.([A-Za-z0-9_-]+)/g)].map(
    (match) => match[1],
  );
  if (classes.some((className) => !element.classList.contains(className))) {
    return false;
  }

  const tagMatch = selector.match(/^[A-Za-z][A-Za-z0-9_-]*/);
  return !tagMatch || element.tagName === tagMatch[0].toLowerCase();
}

function makeMessage(text) {
  const block = element("div", { classes: ["p-rich_text_block"], text });
  const item = element("div", { classes: ["c-virtual_list__item"] }, [block]);
  return { item, block };
}

function makeFixture(messageCount = 900) {
  const body = element("body", {});
  const refs = {};
  const mutableBlocks = [];

  for (let index = 0; index < messageCount; index += 1) {
    const text =
      index % 3 === 0 ? HEBREW_TEXT : index % 3 === 1 ? MIXED_TEXT : ENGLISH_TEXT;
    const message = makeMessage(text);
    mutableBlocks.push(message.block);
    body.append(message.item);

    if (index === 0) refs.hebrewMessage = message.item;
    if (index === 1) refs.mixedMessage = message.item;
    if (index === 2) refs.englishMessage = message.item;
  }

  const searchBody = element("div", { classes: ["c-basic_container__body"] });
  const editor = element("div", { classes: ["ql-editor"], text: HEBREW_TEXT });
  const searchContainer = element(
    "div",
    { classes: ["c-search__input_box__container"] },
    [searchBody.append(editor)],
  );
  body.append(searchContainer);
  refs.editor = editor;
  refs.searchBody = searchBody;

  refs.attachment = element("div", {
    classes: ["c-message_attachment"],
    text: HEBREW_TEXT,
  });
  refs.focusItem = element("div", {
    classes: ["c-focus_manage_list__item"],
    text: HEBREW_TEXT,
  });
  refs.select = input("select", {
    classes: ["c-input_text", "c-advanced_search_modal__select"],
    value: HEBREW_TEXT,
  });
  refs.searchList = element("div", {
    id: "c-search_autocomplete__suggestion_list",
    classes: ["c-search_autocomplete__suggestion_list"],
    text: HEBREW_TEXT,
  });

  const canvasSection = element("div", {
    classes: ["section"],
    text: HEBREW_TEXT,
  });
  body.append(
    element("div", { classes: ["p-quip_embed_channel_canvas"] }, [
      element("article", { classes: ["document-content"] }, [canvasSection]),
    ]),
  );
  refs.canvasSection = canvasSection;

  const savedMessage = makeMessage(HEBREW_TEXT);
  body.append(
    element("div", { classes: ["p-saved_for_later_page__list_wrapper"] }, [
      savedMessage.item,
    ]),
  );
  refs.savedMessage = savedMessage.item;

  body.append(
    refs.attachment,
    refs.focusItem,
    refs.select,
    refs.searchList,
  );

  return { document: new FakeDocument(body), mutableBlocks, refs };
}

function buildExtension() {
  const result = spawnSync("pnpm", ["build"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error("pnpm build failed");
  }
}

function loadContentScript(document) {
  FakeMutationObserver.instances = [];
  const script = readFileSync(SCRIPT_PATH, "utf8");
  const context = {
    AbortController,
    CustomEvent: FakeCustomEvent,
    Event: FakeEvent,
    HTMLInputElement: FakeInputElement,
    HTMLSelectElement: FakeInputElement,
    HTMLTextAreaElement: FakeInputElement,
    MutationObserver: FakeMutationObserver,
    URL,
    browser: undefined,
    chrome: { runtime: { id: "benchmark" } },
    console,
    document,
    globalThis: undefined,
    location: { href: "https://example.slack.com/client" },
    requestAnimationFrame: (callback) => callback(performance.now()),
    cancelAnimationFrame: () => {},
    requestIdleCallback: (callback) => callback(),
    cancelIdleCallback: () => {},
    setInterval,
    clearInterval,
    window: {
      dispatchEvent: () => true,
      postMessage: () => {},
    },
  };
  context.globalThis = context;

  vm.runInNewContext(script, context, { filename: SCRIPT_PATH });

  if (FakeMutationObserver.instances.length === 0) {
    throw new Error("content script did not register a MutationObserver");
  }
}

function triggerScan(target) {
  const records = [{ type: "characterData", target }];
  for (const observer of FakeMutationObserver.instances) {
    observer.callback(records, observer);
  }
}

function expectAttribute(failures, name, element, expected) {
  const actual = element.getAttribute(DATA_ATTRIBUTE);
  if (actual !== expected) {
    failures.push(`${name}: expected ${expected}, got ${actual}`);
  }
}

function assertCorrectness(refs) {
  const failures = [];

  expectAttribute(failures, "hebrew message", refs.hebrewMessage, "hebrew");
  expectAttribute(failures, "mixed message", refs.mixedMessage, "mixed");
  expectAttribute(failures, "english message", refs.englishMessage, null);
  expectAttribute(failures, "composer editor", refs.editor, "hebrew");
  expectAttribute(failures, "composer search body", refs.searchBody, "hebrew");
  expectAttribute(failures, "attachment", refs.attachment, "hebrew");
  expectAttribute(failures, "focus item", refs.focusItem, "hebrew");
  expectAttribute(failures, "select", refs.select, "hebrew");
  expectAttribute(failures, "search list", refs.searchList, "hebrew");
  expectAttribute(failures, "canvas section", refs.canvasSection, "hebrew");
  expectAttribute(failures, "saved message", refs.savedMessage, "hebrew");

  if (failures.length > 0) {
    throw new Error(`correctness failures:\n${failures.join("\n")}`);
  }
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function runBenchmark() {
  const { document, mutableBlocks, refs } = makeFixture();
  loadContentScript(document);
  assertCorrectness(refs);

  refs.englishMessage.children[0].textContent = HEBREW_TEXT;
  triggerScan(refs.englishMessage.children[0]);
  const mutationFailures = [];
  expectAttribute(
    mutationFailures,
    "updated english message",
    refs.englishMessage,
    "hebrew",
  );
  if (mutationFailures.length > 0) {
    throw new Error(`mutation correctness failures:\n${mutationFailures.join("\n")}`);
  }

  const batchDurations = [];
  const batches = 24;
  const scansPerBatch = 20;
  let mutationIndex = 0;

  for (let batch = 0; batch < batches; batch += 1) {
    const startedAt = performance.now();
    for (let scan = 0; scan < scansPerBatch; scan += 1) {
      const block = mutableBlocks[mutationIndex % mutableBlocks.length];
      block.textContent = mutationIndex % 2 === 0 ? HEBREW_TEXT : ENGLISH_TEXT;
      triggerScan(block);
      mutationIndex += 1;
    }
    batchDurations.push((performance.now() - startedAt) / scansPerBatch);
  }

  return {
    scanRuntimeMs: median(batchDurations),
    subScores: {
      batch_count: batches,
      scans_per_batch: scansPerBatch,
      synthetic_message_count: mutableBlocks.length,
      correctness_failures: 0,
    },
  };
}

try {
  buildExtension();
  const result = runBenchmark();
  const output = {
    primary: result.scanRuntimeMs,
    scan_runtime_ms: result.scanRuntimeMs,
    sub_scores: result.subScores,
  };
  console.log(JSON.stringify(output));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  console.log(
    JSON.stringify({
      primary: 1e99,
      scan_runtime_ms: 1e99,
      sub_scores: { correctness_failures: 1 },
      error: message,
    }),
  );
  process.exit(1);
}
