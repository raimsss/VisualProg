import { readFile, writeFile } from "node:fs/promises"

export function csvToJSON(input: string[], delimiter: string): object[] {
  if (input.length < 2) {
    throw new Error("Invalid CSV")
  }

  const headers = input[0].split(delimiter)
  const result: object[] = []

  for (let i = 1; i < input.length; i++) {
    const values = input[i].split(delimiter)

    if (values.length !== headers.length) {
      throw new Error("Column mismatch")
    }

    const obj: any = {}

    headers.forEach((h, index) => {
      const val = values[index]
      obj[h] = isNaN(Number(val)) ? val : Number(val)
    })

    result.push(obj)
  }

  return result
}

export async function formatCSVFileToJSONFile(
  input: string,
  output: string,
  delimiter: string
): Promise<void> {
  const file = await readFile(input, "utf-8")

  const lines = file.trim().split("\n")

  const json = csvToJSON(lines, delimiter)

  await writeFile(output, JSON.stringify(json, null, 2))
}