import { describe, it, expect } from "vitest";
import { isPinyinLike, pinyinMatches, strictPinyinRange } from "../pinyin.js";

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

describe("strictPinyinRange", () => {
  it("完整拼音命中返回字符范围", () => {
    expect(strictPinyinRange("加载", "jiazai")).toEqual({ start: 0, end: 1 });
    expect(strictPinyinRange("上海天气", "shanghai")).toEqual({ start: 0, end: 1 });
  });

  it("声母匹配（含 zh/ch/sh 两字母声母）", () => {
    expect(strictPinyinRange("上海", "sh")).toEqual({ start: 0, end: 0 });
    expect(strictPinyinRange("北京", "bj")).toEqual({ start: 0, end: 1 });
    expect(strictPinyinRange("众软件", "zrj")).toEqual({ start: 0, end: 2 });
  });

  it("带空格拼音匹配（忽略空格）", () => {
    expect(strictPinyinRange("北京", "bei jing")).toEqual({ start: 0, end: 1 });
  });

  it("任意位置命中", () => {
    expect(strictPinyinRange("北京欢迎你", "jing")).toEqual({ start: 1, end: 1 });
  });

  it("回归：jiazai 在长标题中只命中『加载』，不误伤其他汉字", () => {
    expect(strictPinyinRange("金钱加载", "jiazai")).toEqual({ start: 2, end: 3 });
    expect(strictPinyinRange("金钱", "jiazai")).toBeNull();
    expect(strictPinyinRange("自", "jiazai")).toBeNull();
    expect(strictPinyinRange("众软件", "jiazai")).toBeNull();
  });

  it("不命中返回 null", () => {
    expect(strictPinyinRange("上海", "xyzabc")).toBeNull();
    expect(strictPinyinRange("GitHub", "sousuo")).toBeNull();
  });

  it("非拼音形态查询返回 null", () => {
    expect(strictPinyinRange("上海", "web2")).toBeNull();
    expect(strictPinyinRange("", "sousuo")).toBeNull();
  });
});
