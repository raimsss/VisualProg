import { describe, it, expect } from "vitest"
import { where, sort, groupBy, having, query } from "./query"

type User = {
  id: number
  name: string
  surname: string
  age: number
  city: string
}

const users: User[] = [
  { id: 1, name: "John", surname: "Doe", age: 34, city: "NY" },
  { id: 2, name: "John", surname: "Doe", age: 33, city: "NY" },
  { id: 3, name: "John", surname: "Doe", age: 35, city: "LA" },
  { id: 4, name: "Mike", surname: "Doe", age: 35, city: "LA" }
]

describe("lab4", () => {
  it("1. where filters array", () => {
    const result = where<User, "name">("name", "John")(users)

    expect(result).toEqual([
      { id: 1, name: "John", surname: "Doe", age: 34, city: "NY" },
      { id: 2, name: "John", surname: "Doe", age: 33, city: "NY" },
      { id: 3, name: "John", surname: "Doe", age: 35, city: "LA" }
    ])
  })

  it("2. sort sorts array by field", () => {
    const result = sort<User, "age">("age")(users)

    expect(result.map((user) => user.age)).toEqual([33, 34, 35, 35])
  })

  it("3. groupBy groups array by field", () => {
    const result = groupBy<User, "city">("city")(users)

    expect(result).toEqual([
      {
        key: "NY",
        items: [
          { id: 1, name: "John", surname: "Doe", age: 34, city: "NY" },
          { id: 2, name: "John", surname: "Doe", age: 33, city: "NY" }
        ]
      },
      {
        key: "LA",
        items: [
          { id: 3, name: "John", surname: "Doe", age: 35, city: "LA" },
          { id: 4, name: "Mike", surname: "Doe", age: 35, city: "LA" }
        ]
      }
    ])
  })

  it("4. having filters groups", () => {
    const groups = groupBy<User, "city">("city")(users)
    const result = having<User, string>((group) => group.items.length > 1)(groups)

    expect(result).toEqual(groups)
  })

  it("5. query works with where and sort", () => {
    const search = query<User>(
      where("name", "John"),
      where("surname", "Doe"),
      sort("age")
    )

    const result = search(users)

    expect(result).toEqual([
      { id: 2, name: "John", surname: "Doe", age: 33, city: "NY" },
      { id: 1, name: "John", surname: "Doe", age: 34, city: "NY" },
      { id: 3, name: "John", surname: "Doe", age: 35, city: "LA" }
    ])
  })

  it("6. query works with groupBy and having", () => {
    const pipeline = query<User>(
      where("surname", "Doe"),
      groupBy("city"),
      having<User, string>((group) =>
        group.items.some((user) => user.age > 34)
      )
    )

    const result = pipeline(users)

    expect(result).toEqual([
      {
        key: "LA",
        items: [
          { id: 3, name: "John", surname: "Doe", age: 35, city: "LA" },
          { id: 4, name: "Mike", surname: "Doe", age: 35, city: "LA" }
        ]
      }
    ])
  })
})