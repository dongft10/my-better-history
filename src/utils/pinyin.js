import { match } from "pinyin-pro";

// 判断查询是否为"拼音形态"：仅含英文字母与空格（视为可能的拼音输入）
export function isPinyinLike(query) {
  const q = (query || "").trim();
  return /[a-zA-Z]/.test(q) && /^[a-zA-Z\s]+$/.test(q);
}

// 文本的拼音是否与查询匹配（任意位置，支持全拼、拼音首字母、带空格，如 "sh"→"上海"）
export function pinyinMatches(query, text) {
  if (!text || !query) return false;
  const res = match(text, query.trim().toLowerCase(), { precision: "any" });
  return Array.isArray(res) && res.length > 0;
}
