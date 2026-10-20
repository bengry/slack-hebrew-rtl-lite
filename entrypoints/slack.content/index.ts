import "./style.css";
import { syncAlignment } from "./align";
import { installComposer } from "./composer";
import { stripMarksOnCopy } from "./copy";
import { startObserver } from "./observer";

export default defineContentScript({
  matches: ["*://*.slack.com/*"],
  runAt: "document_idle",
  main(ctx) {
    syncAlignment(ctx);
    startObserver(ctx);
    installComposer(ctx);
    ctx.addEventListener(window, "copy", stripMarksOnCopy);
  },
});
