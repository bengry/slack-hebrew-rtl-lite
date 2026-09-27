const IS_MAC = /Mac/i.test(navigator.platform);
const CTRL_KEY = IS_MAC ? "⌃" : "Ctrl";

let current: HTMLElement | undefined;

// Mirrors Slack's toolbar tooltips; its own tooltips are React-rendered and can't be triggered on our buttons.
export function attachTooltip(button: HTMLElement, label: string, key: string): void {
  const show = () => showTooltip(button, label, [CTRL_KEY, key]);
  button.addEventListener("pointerenter", show);
  button.addEventListener("focus", show);
  for (const type of ["pointerleave", "blur", "mousedown"]) {
    button.addEventListener(type, hideTooltip);
  }
}

function showTooltip(anchor: HTMLElement, label: string, keys: string[]): void {
  hideTooltip();
  const tip = document.createElement("div");
  tip.className = "c-tooltip__tip c-tooltip__tip--top c-tooltip__tip--small rtl-lite-tooltip";
  tip.setAttribute("role", "tooltip");

  const text = document.createElement("span");
  text.textContent = label;
  const keyRow = document.createElement("span");
  keyRow.className = "rtl-lite-tooltip__keys";
  for (const key of keys) {
    const chip = document.createElement("kbd");
    chip.textContent = key;
    keyRow.append(chip);
  }
  tip.append(text, keyRow);
  // Inline: Slack's c-tooltip__tip CSS loads after ours and would override positioning.
  Object.assign(tip.style, { position: "fixed", zIndex: "10000", pointerEvents: "none" });
  document.body.append(tip);

  const anchorRect = anchor.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  tip.style.left = `${Math.max(4, anchorRect.left + anchorRect.width / 2 - tipRect.width / 2)}px`;
  tip.style.top = `${anchorRect.top - tipRect.height - 8}px`;
  current = tip;
}

function hideTooltip(): void {
  current?.remove();
  current = undefined;
}
