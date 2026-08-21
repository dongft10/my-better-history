import en from "./en.js";
import zhCN from "./zh-CN.js";

const messages = {
  en,
  "zh-CN": zhCN,
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
