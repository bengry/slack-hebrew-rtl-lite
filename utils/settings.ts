import { storage } from "wxt/utils/storage";

/** "auto" aligns each line to its own direction's side; "left" lines everything up on the left, keeping its direction. */
export type Alignment = "auto" | "left";

export const alignment = storage.defineItem<Alignment>("local:alignment", { fallback: "auto" });
