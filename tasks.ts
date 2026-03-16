export interface User {
  id: number
  name: string
  email?: string
  isActive: boolean
}

export function createUser(
  id: number,
  name: string,
  email?: string,
  isActive: boolean = true
): User {
  return { id, name, email, isActive }
}

export interface Book {
  title: string
  author: string
  year?: number
  genre: "fiction" | "non-fiction"
}

export function createBook(book: Book): Book {
  return book
}

export function calculateArea(shape: "circle", radius: number): number
export function calculateArea(shape: "square", side: number): number

export function calculateArea(
  shape: "circle" | "square",
  value: number
): number {
  if (shape === "circle") return Math.PI * value * value
  return value * value
}

export type Status = "active" | "inactive" | "new"

export function getStatusColor(status: Status): string {
  switch (status) {
    case "active":
      return "green"
    case "inactive":
      return "gray"
    case "new":
      return "blue"
  }
}

export type StringFormatter = (str: string, uppercase?: boolean) => string

export const capitalizeFirst: StringFormatter = (str, uppercase = false) => {
  let result = str.charAt(0).toUpperCase() + str.slice(1)
  if (uppercase) result = result.toUpperCase()
  return result
}

export const trimAndFormat: StringFormatter = (str, uppercase = false) => {
  let result = str.trim()
  if (uppercase) result = result.toUpperCase()
  return result
}

export function getFirstElement<T>(arr: T[]): T | undefined {
  return arr[0]
}

export interface HasId {
  id: number
}

export function findById<T extends HasId>(
  items: T[],
  id: number
): T | undefined {
  return items.find(item => item.id === id)
}