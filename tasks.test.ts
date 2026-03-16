import { describe, it, expect } from "vitest"
import {
  createUser,
  createBook,
  calculateArea,
  getStatusColor,
  capitalizeFirst,
  getFirstElement,
  findById
} from "./tasks"

describe("lab1 tests", () => {
  it("1. createUser creates user with default isActive", () => {
    const user = createUser(1, "Alex", "alex@mail.com")
    expect(user).toEqual({
      id: 1,
      name: "Alex",
      email: "alex@mail.com",
      isActive: true
    })
  })

  it("2. createBook creates book without year", () => {
    const book = createBook({
      title: "Sapiens",
      author: "Yuval Noah Harari",
      genre: "non-fiction"
    })

    expect(book).toEqual({
      title: "Sapiens",
      author: "Yuval Noah Harari",
      genre: "non-fiction"
    })
  })

  it("3. calculateArea calculates circle area", () => {
    expect(calculateArea("circle", 2)).toBeCloseTo(12.566370614359172)
  })

  it("4. getStatusColor returns correct color", () => {
    expect(getStatusColor("active")).toBe("green")
  })

  it("5. capitalizeFirst formats string", () => {
    expect(capitalizeFirst("hello")).toBe("Hello")
  })

  it("6. getFirstElement returns first array element", () => {
    expect(getFirstElement([1, 2, 3])).toBe(1)
  })

  it("7. findById finds object by id", () => {
    const users = [
      { id: 1, name: "Alex" },
      { id: 2, name: "John" }
    ]

    expect(findById(users, 2)).toEqual({ id: 2, name: "John" })
  })
})