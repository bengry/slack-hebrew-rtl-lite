import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { type Alignment, alignment } from "../../utils/settings";

// The stylesheet keys alignment off this attribute on <html>.
const ALIGN_ATTRIBUTE = "data-rtl-lite-align";

/** Mirrors the alignment setting onto <html> and keeps it in sync, so open tabs follow a change without a reload. */
export function syncAlignment(ctx: ContentScriptContext): void {
  ctx.onInvalidated(alignment.watch(applyAlignment));
  void alignment.getValue().then(applyAlignment);
}

function applyAlignment(value: Alignment): void {
  document.documentElement.setAttribute(ALIGN_ATTRIBUTE, value);
}
