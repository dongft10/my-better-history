import { describe, it, expect } from "vitest";
import { isPinyinLike, pinyinMatches } from "../pinyin.js";

describe("isPinyinLike", () => {
  it("纯英文字母/空格视为拼音形态", () => {
    expect(isPinyinLike("shanghai")).toBe(true);
    expect(isPinyinLike("SHANG")).toBe(true);
    expect(isPinyinLike("bei jing")).toBe(true);
  });

  it("含数字、符号或中文不是拼音形态", () => {
    expect(isPinyinLike("web2")).toBe(false);
    expect(isPinyinLike("中文")).toBe(false);
    expect(isPinyinLike("a-b")).toBe(false);
    expect(isPinyinLike("")).toBe(false);
  });
});

describe("pinyinMatches", () => {
  it("全拼匹配中文标题", () => {
    expect(pinyinMatches("shanghai", "上海")).toBe(true);
    expect(pinyinMatches("beijing", "北京欢迎你")).toBe(true);
  });

  it("拼音首字母匹配", () => {
    expect(pinyinMatches("sh", "上海")).toBe(true);
    expect(pinyinMatches("bj", "北京")).toBe(true);
  });

  it("带空格的拼音匹配", () => {
    expect(pinyinMatches("bei jing", "北京")).toBe(true);
  });

  it("任意位置匹配", () => {
    expect(pinyinMatches("jing", "北京")).toBe(true);
  });

  it("不匹配返回 false", () => {
    expect(pinyinMatches("xyzabc", "上海")).toBe(false);
    expect(pinyinMatches("shanghai", "广州")).toBe(false);
    expect(pinyinMatches("shanghai", "GitHub")).toBe(false);
  });
});
