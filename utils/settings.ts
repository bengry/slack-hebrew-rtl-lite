import { storage } from "wxt/utils/storage";

/** Right-to-left text keeps its direction but lines up on the left edge, like the rest of Slack's text. */
export const alignLeft = storage.defineItem<boolean>("local:alignLeft", { fallback: false });
