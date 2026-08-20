// 历史记录按天加载与分组的纯逻辑（chrome API 可注入，便于测试）

/**
 * 收集 [startTime, endTime) 范围内的每一天的本地零点时间戳。
 * 注意 endTime 为排他：endTime 恰为某天零点时不会多产生一天（避免空查询）。
 */
export function collectDayStarts(startTime, endTime) {
  const dayStarts = [];
  const cursor = new Date(startTime);
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getTime() < endTime) {
    dayStarts.push(cursor.getTime());
    cursor.setDate(cursor.getDate() + 1);
  }
  return dayStarts;
}

/**
 * 按天查询时间范围内的访问记录：URL 归入其有访问的每一天（一天一行）。
 * 按天分片并发查询；返回 { items, oldestDayStart }。
 * oldestDayStart = 范围内第一天（最早一天），供"继续向更早翻页"使用。
 *
 * @param {number} startTime 范围起点（毫秒）
 * @param {number} endTime 范围终点（毫秒，排他语义见 collectDayStarts）
 * @param {{ search: (opts: object) => Promise<Array> }} historyApi chrome.history
 * @param {{ concurrency?: number }} options 并发分片大小
 */
export async function loadRangeByDay(
  startTime,
  endTime,
  historyApi,
  { concurrency = 6 } = {},
) {
  const dayStarts = collectDayStarts(startTime, endTime);
  const items = [];
  const oldestDayStart = dayStarts.length > 0 ? dayStarts[0] : 0;

  for (let i = 0; i < dayStarts.length; i += concurrency) {
    const chunk = dayStarts.slice(i, i + concurrency);
    const results = await Promise.all(
      chunk.map((dStart) =>
        historyApi.search({
          text: "",
          maxResults: 5000,
          startTime: dStart,
          endTime: Math.min(dStart + 24 * 60 * 60 * 1000 - 1, endTime),
        }),
      ),
    );

    results.forEach((dayResults, idx) => {
      const dStart = chunk[idx];
      for (const item of dayResults) {
        if (!item.url || item.url.startsWith("chrome://")) continue;
        items.push({
          id: `${item.id}-${dStart}`,
          url: item.url,
          title: item.title || "",
          // 该 URL 归属的日期（查询保证当天有访问）；lastVisitTime 可能落在更晚的天
          dayKey: new Date(dStart).toDateString(),
          lastVisitTime: item.lastVisitTime,
        });
      }
    });
  }

  items.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
  return { items, oldestDayStart };
}

/**
 * 按天分组并按日期倒序排列。
 * 优先使用 item.dayKey（按天加载的归属日期）；无 dayKey 时回退用 lastVisitTime 推导。
 */
export function groupByDay(items) {
  const groups = {};
  for (const item of items) {
    const dateKey = item.dayKey || new Date(item.lastVisitTime).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  }

  const sortedGroups = {};
  Object.keys(groups)
    .sort((a, b) => new Date(b) - new Date(a))
    .forEach((key) => {
      sortedGroups[key] = groups[key];
    });

  return sortedGroups;
}
