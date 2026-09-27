import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { injectToolbars } from "./composer";
import { renderWithin, TEXT_CONTAINER } from "./render";

/** One body observer, batched per frame, rendering only the containers touched by mutations. */
export function startObserver(ctx: ContentScriptContext): void {
  const pending = new Set<Element>();
  let queued = false;

  const flush = (): void => {
    queued = false;
    const roots = Array.from(pending);
    pending.clear();
    for (const root of roots) {
      if (root.isConnected) renderWithin(root);
    }
    injectToolbars();
  };

  // Attributes are not observed, so the extension's own dir/state writes never re-trigger it.
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const target = record.target instanceof Element ? record.target : record.target.parentElement;
      const container = target?.closest(TEXT_CONTAINER);
      if (container) pending.add(container);
      for (const node of record.addedNodes) {
        if (node instanceof Element) pending.add(node);
      }
    }
    if (queued || pending.size === 0) return;
    queued = true;
    ctx.requestAnimationFrame(flush);
  });

  renderWithin(document.body);
  injectToolbars();
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  ctx.onInvalidated(() => observer.disconnect());
}
