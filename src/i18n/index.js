import en from "./en.js";
import zhCN from "./zh-CN.js";
import fr from "./fr.js";

const messages = {
  en,
  "zh-CN": zhCN,
  fr,
};

function getBrowserLocale() {
  if (typeof chrome !== "undefined" && chrome.i18n) {
    return chrome.i18n.getUILanguage();
  }
  return navigator.language || navigator.userLanguage || "en";
}

function getDefaultLocale() {
  const browserLocale = getBrowserLocale();
  if (browserLocale && browserLocale.startsWith("zh")) {
    return "zh-CN";
  }
  if (browserLocale && browserLocale.startsWith("fr")) {
    return "fr";
  }
  return "en";
}

const currentLocale = getDefaultLocale();

function t(key, ...args) {
  const msg = messages[currentLocale]?.[key] || messages["en"][key];
  if (typeof msg === "function") {
    return msg(...args);
  }
  return msg || key;
}

function isZh() {
  return currentLocale === "zh-CN";
}

export { t, currentLocale, isZh };
