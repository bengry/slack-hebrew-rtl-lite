import { storage } from "wxt/utils/storage";

export const ALIGNMENTS = ["auto", "left"] as const;

/** "auto" aligns each line to its own direction's side; "left" lines everything up on the left, keeping its direction. */
export type Alignment = (typeof ALIGNMENTS)[number];

export const alignment = storage.defineItem<Alignment>("sync:alignment", { fallback: "auto" });
