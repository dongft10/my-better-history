import { describe, it, expect } from "vitest";
import { toDateKey } from "../date.js";

describe("toDateKey", () => {
  it("将 Date 转为 YYYY-MM-DD 并补零", () => {
    expect(toDateKey(new Date(2026, 7, 18))).toBe("2026-08-18");
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toDateKey(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});
