// 日期工具函数

// 将 Date 对象转为本地日期键 'YYYY-MM-DD'
export function toDateKey(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
