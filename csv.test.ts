import { describe, it, expect, vi } from "vitest"
import { csvToJSON, formatCSVFileToJSONFile } from "./csv"
import * as fs from "node:fs/promises"

describe("csvToJSON", () => {
  it("converts csv to json", () => {
    const data = [
      "p1;p2;p3;p4",
      "1;A;b;c",
      "2;B;v;d"
    ]

    const result = csvToJSON(data, ";")

    expect(result).toEqual([
      { p1: 1, p2: "A", p3: "b", p4: "c" },
      { p1: 2, p2: "B", p3: "v", p4: "d" }
    ])
  })

  it("throws error on column mismatch", () => {
    const data = [
      "p1;p2",
      "1;2;3"
    ]

    expect(() => csvToJSON(data, ";")).toThrow()
  })
})

describe("formatCSVFileToJSONFile", () => {

  vi.mock("node:fs/promises")

  it("calls writeFile with correct data", async () => {

    const readMock = vi.spyOn(fs, "readFile").mockResolvedValue(
      "p1;p2\n1;A"
    )

    const writeMock = vi.spyOn(fs, "writeFile").mockResolvedValue()

    await formatCSVFileToJSONFile("input.csv", "output.json", ";")

    expect(readMock).toHaveBeenCalled()

    expect(writeMock).toHaveBeenCalled()

  })

})
