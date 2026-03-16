// 1

interface User {
  id: number
  name: string
  email?: string
  isActive: boolean
}

function createUser(
  id: number,
  name: string,
  email?: string,
  isActive: boolean = true
): User {
  return {
    id,
    name,
    email,
    isActive
  }
}

const user1 = createUser(1, "Alex", "alex@mail.com")
const user2 = createUser(2, "John")

// 2

interface Book {
  title: string
  author: string
  year?: number
  genre: "fiction" | "non-fiction"
}

function createBook(book: Book): Book {
  return book
}

const book1 = createBook({
  title: "1984",
  author: "George Orwell",
  year: 1949,
  genre: "fiction"
})

const book2 = createBook({
  title: "Sapiens",
  author: "Yuval Noah Harari",
  genre: "non-fiction"
})

// 3

function calculateArea(shape: "circle", radius: number): number
function calculateArea(shape: "square", side: number): number

function calculateArea(shape: "circle" | "square", value: number): number {
  if (shape === "circle") {
    return Math.PI * value * value
  }

  return value * value
}

const circleArea = calculateArea("circle", 5)
const squareArea = calculateArea("square", 4)

// 4

type Status = "active" | "inactive" | "new"

function getStatusColor(status: Status): string {
  switch (status) {
    case "active":
      return "green"
    case "inactive":
      return "gray"
    case "new":
      return "blue"
  }
}

// 5

type StringFormatter = (str: string, uppercase?: boolean) => string

const capitalizeFirst: StringFormatter = (str, uppercase = false) => {
  let result = str.charAt(0).toUpperCase() + str.slice(1)

  if (uppercase) {
    result = result.toUpperCase()
  }

  return result
}

const trimAndFormat: StringFormatter = (str, uppercase = false) => {
  let result = str.trim()

  if (uppercase) {
    result = result.toUpperCase()
  }

  return result
}

// 6

function getFirstElement<T>(arr: T[]): T | undefined {
  return arr[0]
}

const numbers = [1, 2, 3]
const strings = ["a", "b", "c"]

const firstNumber = getFirstElement(numbers)
const firstString = getFirstElement(strings)

// 7

interface HasId {
  id: number
}

function findById<T extends HasId>(items: T[], id: number): T | undefined {
  return items.find(item => item.id === id)
}

const users = [
  { id: 1, name: "Alex" },
  { id: 2, name: "John" }
]

const foundUser = findById(users, 2)