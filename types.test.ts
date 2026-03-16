import { describe, it, expectTypeOf } from "vitest"
import { DeepReadonly, PickedByType, EventHandlers } from "./types"

describe("lab6", () => {
  it("1. DeepReadonly делает все поля readonly рекурсивно", () => {
    type Source = {
      id: number
      user: {
        name: string
        settings: {
          active: boolean
        }
      }
    }

    type Result = DeepReadonly<Source>

    expectTypeOf<Result>().toEqualTypeOf<{
      readonly id: number
      readonly user: {
        readonly name: string
        readonly settings: {
          readonly active: boolean
        }
      }
    }>()
  })

  it("2. DeepReadonly не меняет тип функции", () => {
    type Source = {
      handler: (value: number) => string
    }

    type Result = DeepReadonly<Source>

    expectTypeOf<Result>().toEqualTypeOf<{
      readonly handler: (value: number) => string
    }>()
  })

  it("3. PickedByType выбирает string поля", () => {
    type Source = {
      id: number
      name: string
      surname: string
      active: boolean
    }

    type Result = PickedByType<Source, string>

    expectTypeOf<Result>().toEqualTypeOf<{
      name: string
      surname: string
    }>()
  })

  it("4. PickedByType выбирает number поля", () => {
    type Source = {
      id: number
      age: number
      name: string
      active: boolean
    }

    type Result = PickedByType<Source, number>

    expectTypeOf<Result>().toEqualTypeOf<{
      id: number
      age: number
    }>()
  })

  it("5. EventHandlers создает обработчики событий", () => {
    type Events = {
      click: MouseEvent
      change: Event
    }

    type Result = EventHandlers<Events>

    expectTypeOf<Result>().toEqualTypeOf<{
      onClick: (event: MouseEvent) => void
      onChange: (event: Event) => void
    }>()
  })

  it("6. EventHandlers работает с пользовательскими типами", () => {
    type Events = {
      submit: { id: number }
      login: { user: string }
    }

    type Result = EventHandlers<Events>

    expectTypeOf<Result>().toEqualTypeOf<{
      onSubmit: (event: { id: number }) => void
      onLogin: (event: { user: string }) => void
    }>()
  })
})