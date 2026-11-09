import { describe, expect, it } from "vitest";
import { formatStats, lines, parseStats, readStats } from "../portfolio";

describe("portfolio stats", () => {
  it("parses value | label lines and skips invalid ones", () => {
    expect(parseStats("3x | more enquiries\nno pipe here\n | missing value\n48h|Launch time")).toEqual([
      { value: "3x", label: "more enquiries" },
      { value: "48h", label: "Launch time" },
    ]);
  });

  it("keeps extra pipes in the label", () => {
    expect(parseStats("10 | a | b")).toEqual([{ value: "10", label: "a | b" }]);
  });

  it("round-trips through formatStats", () => {
    const s = parseStats("1 | one\n2 | two");
    expect(parseStats(formatStats(s))).toEqual(s);
  });

  it("reads untrusted JSON safely", () => {
    expect(readStats(null)).toEqual([]);
    expect(readStats([{ value: "1", label: "x" }, { value: 2 }, "bad"])).toEqual([{ value: "1", label: "x" }]);
  });

  it("splits lines", () => {
    expect(lines(" a \n\n b\n")).toEqual(["a", "b"]);
    expect(lines(null)).toEqual([]);
  });
});
