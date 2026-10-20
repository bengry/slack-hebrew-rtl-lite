import "./style.css";
import { browser } from "wxt/browser";
import { alignLeft } from "../../utils/settings";

// __MSG_ placeholders only work in the manifest and CSS, so the page fills in its strings here.
// lang and dir come from the translation itself: getUILanguage() and @@bidi_dir follow the browser's UI language,
// which disagrees with the shown text when that language has no translation and falls back to English.
document.documentElement.lang = browser.i18n.getMessage("languageCode");
document.documentElement.dir = browser.i18n.getMessage("textDirection");
for (const element of document.querySelectorAll<HTMLElement>("[data-message]")) {
  element.textContent = browser.i18n.getMessage(element.dataset.message ?? "");
}

const checkbox = document.querySelector<HTMLInputElement>("#align-left");
if (checkbox) {
  void alignLeft.getValue().then((value) => {
    checkbox.checked = value;
  });
  checkbox.addEventListener("change", () => void alignLeft.setValue(checkbox.checked));
}
