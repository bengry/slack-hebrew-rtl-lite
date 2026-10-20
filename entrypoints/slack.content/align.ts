import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { alignLeft } from "../../utils/settings";

// The stylesheet keys left alignment off this attribute on <html>.
const ALIGN_LEFT_ATTRIBUTE = "data-rtl-lite-align-left";

/** Mirrors the align-left setting onto <html> and keeps it in sync, so open tabs follow a change without a reload. */
export function syncAlignment(ctx: ContentScriptContext): void {
  ctx.onInvalidated(alignLeft.watch(applyAlignment));
  void alignLeft.getValue().then(applyAlignment);
}

function applyAlignment(left: boolean): void {
  document.documentElement.toggleAttribute(ALIGN_LEFT_ATTRIBUTE, left);
}
