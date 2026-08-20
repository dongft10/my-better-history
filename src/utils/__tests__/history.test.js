import { describe, it, expect, vi } from "vitest";
import { collectDayStarts, loadRangeByDay, groupByDay } from "../history.js";
import { toDateKey } from "../date.js";

const DAY = 24 * 60 * 60 * 1000;

// 固定"今天"为 2026-08-20 14:00（本地时间），避免依赖真实时钟
function now() {
  return new Date(2026, 7, 20, 14, 0, 0).getTime();
}

function midnight(y, m, d) {
  return new Date(y, m - 1, d).getTime();
}

// 按天返回数据的 mock historyApi
function makeHistoryApi(dayCounts, { withChromeUrls = false } = {}) {
  const search = vi.fn(async (opts) => {
    const dStart = opts.startTime;
    const count = dayCounts.get(dStart) || 0;
    const items = [];
    for (let i = 0; i < count; i++) {
      items.push({
        id: `url-${dStart}-${i}`,
        url: withChromeUrls && i === 0
          ? "chrome://settings/"
          : `https://site-${i}.example.com/page?d=${dStart}`,
        title: `标题 ${i}`,
        lastVisitTime: dStart + i * 1000,
      });
    }
    return items;
  });
  return { search };
}

describe("collectDayStarts", () => {
  it("今天范围返回 1 天", () => {
    const starts = collectDayStarts(midnight(2026, 8, 20), now());
    expect(starts).toHaveLength(1);
    expect(starts[0]).toBe(midnight(2026, 8, 20));
  });

  it("昨天范围恰为 1 天（endTime 在零点时不产生多余空天）", () => {
    // [昨天00:00, 今天00:00) —— 回归保护：不能多出"今天"的空查询
    const starts = collectDayStarts(midnight(2026, 8, 19), midnight(2026, 8, 20));
    expect(starts).toHaveLength(1);
    expect(starts[0]).toBe(midnight(2026, 8, 19));
  });

  it("本周范围返回 8 天（含今天）", () => {
    const starts = collectDayStarts(midnight(2026, 8, 13), now());
    expect(starts).toHaveLength(8);
    expect(starts[0]).toBe(midnight(2026, 8, 13));
    expect(starts[starts.length - 1]).toBe(midnight(2026, 8, 20));
  });

  it("跨月边界正确（7月末→8月初）", () => {
    const starts = collectDayStarts(midnight(2026, 7, 30), midnight(2026, 8, 1));
    expect(starts).toHaveLength(2);
    expect(toDateKey(new Date(starts[0]))).toBe("2026-07-30");
    expect(toDateKey(new Date(starts[1]))).toBe("2026-07-31");
  });

  it("空范围（起点取整后 >= 终点）返回空数组", () => {
    expect(collectDayStarts(midnight(2026, 8, 20), midnight(2026, 8, 20))).toEqual(
      [],
    );
  });
});

describe("loadRangeByDay", () => {
  it("oldestDayStart 等于范围内第一天（回归保护：翻页游标 bug）", async () => {
    const dayCounts = new Map([
      [midnight(2026, 8, 13), 2],
      [midnight(2026, 8, 20), 3],
    ]);
    const api = makeHistoryApi(dayCounts);

    const { items, oldestDayStart } = await loadRangeByDay(
      midnight(2026, 8, 13),
      now(),
      api,
    );

    expect(oldestDayStart).toBe(midnight(2026, 8, 13)); // 最早一天，不是今天
    expect(items).toHaveLength(5);
    expect(api.search).toHaveBeenCalledTimes(8); // 8 天各一次，无多余空查询
  });

  it("item 的 dayKey 归入其查询日（lastVisitTime 可落在更晚的天）", async () => {
    const customSearch = vi.fn(async () => [
      // 模拟：18日有访问、但 lastVisitTime 落在 20 日（跨日最近访问）
      { id: "x", url: "https://a.example.com", title: "A", lastVisitTime: now() },
    ]);
    const { items } = await loadRangeByDay(
      midnight(2026, 8, 18),
      midnight(2026, 8, 19),
      { search: customSearch },
    );

    expect(items).toHaveLength(1);
    expect(items[0].dayKey).toBe(
      new Date(midnight(2026, 8, 18)).toDateString(),
    );
    expect(items[0].lastVisitTime).toBe(now());
  });

  it("过滤 chrome:// 内部页面", async () => {
    const api = makeHistoryApi(
      new Map([[midnight(2026, 8, 20), 3]]),
      { withChromeUrls: true },
    );
    const { items } = await loadRangeByDay(midnight(2026, 8, 20), now(), api);
    expect(items).toHaveLength(2); // 3 条中 1 条 chrome:// 被过滤
  });

  it("结果按 lastVisitTime 倒序", async () => {
    const api = makeHistoryApi(new Map([[midnight(2026, 8, 20), 3]]));
    const { items } = await loadRangeByDay(midnight(2026, 8, 20), now(), api);
    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1].lastVisitTime).toBeGreaterThanOrEqual(
        items[i].lastVisitTime,
      );
    }
  });

  it("空范围返回空 items 且不调用 search", async () => {
    const api = makeHistoryApi(new Map());
    const { items, oldestDayStart } = await loadRangeByDay(
      midnight(2026, 8, 20),
      midnight(2026, 8, 20),
      api,
    );
    expect(items).toEqual([]);
    expect(oldestDayStart).toBe(0);
    expect(api.search).not.toHaveBeenCalled();
  });
});

describe("groupByDay", () => {
  it("优先按 dayKey 分组，并按日期倒序", () => {
    const d18 = new Date(midnight(2026, 8, 18)).toDateString();
    const d19 = new Date(midnight(2026, 8, 19)).toDateString();
    const d20 = new Date(midnight(2026, 8, 20)).toDateString();
    const items = [
      { id: "a", url: "https://a", lastVisitTime: midnight(2026, 8, 18), dayKey: d18 },
      { id: "b", url: "https://b", lastVisitTime: midnight(2026, 8, 20), dayKey: d20 },
      { id: "c", url: "https://c", lastVisitTime: midnight(2026, 8, 19), dayKey: d19 },
    ];
    const groups = groupByDay(items);
    expect(Object.keys(groups)).toEqual([d20, d19, d18]);
  });

  it("无 dayKey 时回退按 lastVisitTime 推导分组", () => {
    const items = [
      { id: "a", url: "https://a", lastVisitTime: midnight(2026, 8, 18) },
      { id: "b", url: "https://b", lastVisitTime: midnight(2026, 8, 18) + 1000 },
    ];
    const groups = groupByDay(items);
    expect(Object.keys(groups)).toHaveLength(1);
    expect(groups[Object.keys(groups)[0]]).toHaveLength(2);
  });

  it("dayKey 存在时不受 lastVisitTime 跨日影响（跨日归组回归保护）", () => {
    const d18 = new Date(midnight(2026, 8, 18)).toDateString();
    const items = [
      { id: "a", url: "https://a", lastVisitTime: midnight(2026, 8, 20), dayKey: d18 },
    ];
    const groups = groupByDay(items);
    expect(Object.keys(groups)).toEqual([d18]);
  });
});
