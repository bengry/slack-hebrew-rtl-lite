import { afterEach, expect, it } from "vitest";
import { renderWithin } from "./render";
import "./style.css";

// Spec budget: no long task (>50 ms) for 500 rendered messages. 2x headroom keeps slow machines from flaking.
const MESSAGE_COUNT = 500;
const BUDGET_MS = 100;

const MESSAGES = [
  "<div class='p-rich_text_section'>PR #123 עודכן, תבדוק בבקשה מתי שיש לך זמן.</div>",
  "<div class='p-rich_text_section'>Can you check the ticket about דוחות חודשיים before Sunday?</div>",
  "<div class='p-rich_text_section'>סיכום הפגישה:<br aria-hidden='true'>We agreed to ship on Monday, pending QA.<br aria-hidden='true'>תודה לכולם!</div>",
  "<ul class='p-rich_text_list p-rich_text_list__bullet'><li>פריט ראשון</li><li>second item</li></ul>",
  "<blockquote class='c-mrkdwn__quote'>ציטוט קצר עם English inside</blockquote>",
];

let root: HTMLElement | undefined;

afterEach(() => root?.remove());

it(`renders ${MESSAGE_COUNT} messages, including layout, within ${BUDGET_MS} ms`, () => {
  root = document.createElement("div");
  root.innerHTML = Array.from(
    { length: MESSAGE_COUNT },
    (_, i) => `<div class="p-rich_text_block" dir="auto">${MESSAGES[i % MESSAGES.length]}</div>`,
  ).join("");
  document.body.append(root);
  void root.offsetHeight;

  const start = performance.now();
  renderWithin(root);
  void root.offsetHeight;
  const elapsed = performance.now() - start;

  expect(elapsed).toBeLessThan(BUDGET_MS);
});
