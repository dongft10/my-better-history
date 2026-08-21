import { pinyin } from "pinyin-pro";

// 判断查询是否为"拼音形态"：仅含英文字母与空格（视为可能的拼音输入）
export function isPinyinLike(query) {
  const q = (query || "").trim();
  // trim 后非空字符串若全部由字母/空格组成，必然含至少一个字母，无需单独再判断
  return /^[a-zA-Z\s]+$/.test(q);
}

// 单个汉字可消费的拼音段：完整拼音、双字母声母（zh/ch/sh）、单字母声母（简拼）
function syllableSegments(syl) {
  const segs = [syl];
  if (syl.length > 1) {
    if (syl.startsWith("zh") || syl.startsWith("ch") || syl.startsWith("sh")) {
      segs.push(syl.slice(0, 2));
    }
    segs.push(syl[0]);
  }
  return segs;
}

/**
 * 严格拼音匹配：查询必须被「连续汉字」的完整拼音或声母完整消费。
 * 返回命中的字符范围 {start, end}（含两端），无命中返回 null。
 *
 * 例：
 *   "jiazai" → 加载            → { start: 0, end: 1 }
 *   "jiazai" 在 "金钱加载" 中    → { start: 2, end: 3 }（只命中"加载"，不误伤"金钱"）
 *   "bj"    → 北京             → { start: 0, end: 1 }（声母匹配）
 */
export function strictPinyinRange(text, query) {
  const q = (query || "").trim().toLowerCase().replace(/\s+/g, "");
  if (!text || !q || !isPinyinLike(q)) return null;

  // 一次调用取整段文本的逐字拼音（索引与文本字符一一对应）
  const syls = pinyin(text, { type: "array", toneType: "none" });

  for (let i = 0; i < syls.length; i++) {
    let qi = 0;
    let j = i;
    while (qi < q.length && j < syls.length) {
      const segs = syllableSegments(syls[j]);
      let consumed = false;
      for (const seg of segs) {
        if (q.startsWith(seg, qi)) {
          qi += seg.length;
          consumed = true;
          break;
        }
      }
      if (!consumed) break;
      j++;
    }
    if (qi === q.length && j > i) {
      return { start: i, end: j - 1 };
    }
  }
  return null;
}

// 布尔版匹配（供过滤使用）
export function pinyinMatches(query, text) {
  return strictPinyinRange(text, query) !== null;
}
