import "./style.css";
import { browser } from "wxt/browser";
import { ALIGNMENTS, alignment } from "../../utils/settings";

// WXT types getMessage() per known message name; its last overload accepts any of them.
type MessageName = Parameters<typeof browser.i18n.getMessage>[0];

// __MSG_ placeholders only work in the manifest and CSS, so the page fills in its strings here.
// lang and dir come from the translation itself: getUILanguage() and @@bidi_dir follow the browser's UI language,
// which disagrees with the shown text when that language has no translation and falls back to English.
document.documentElement.lang = browser.i18n.getMessage("languageCode");
document.documentElement.dir = browser.i18n.getMessage("textDirection");
for (const element of document.querySelectorAll<HTMLElement>("[data-message]")) {
  element.textContent = browser.i18n.getMessage(element.dataset.message as MessageName);
}

const radios = document.querySelectorAll<HTMLInputElement>('input[name="alignment"]');
void alignment.getValue().then((value) => {
  for (const radio of radios) radio.checked = radio.value === value;
});
for (const radio of radios) {
  const value = ALIGNMENTS.find((option) => option === radio.value);
  if (value) radio.addEventListener("change", () => void alignment.setValue(value));
}
