export type Transform<T> = (data: T[]) => T[]

export type Where<T> = <K extends keyof T>(
  key: K,
  value: T[K]
) => Transform<T>

export type Sort<T> = <K extends keyof T>(
  key: K
) => Transform<T>

export type Group<T, K> = {
  key: K
  items: T[]
}

export type GroupBy<T> = <K extends keyof T>(
  key: K
) => (data: T[]) => Group<T, T[K]>[]

export type GroupTransform<T, K> = (
  groups: Group<T, K>[]
) => Group<T, K>[]

export type Having<T> = <K>(
  predicate: (group: Group<T, K>) => boolean
) => GroupTransform<T, K>

export const where = <T, K extends keyof T>(
  key: K,
  value: T[K]
): Transform<T> => {
  return (data) => data.filter((item) => item[key] === value)
}

export const sort = <T, K extends keyof T>(
  key: K
): Transform<T> => {
  return (data) =>
    [...data].sort((a, b) => {
      const av = a[key]
      const bv = b[key]

      if (av < bv) return -1
      if (av > bv) return 1
      return 0
    })
}

export const groupBy = <T, K extends keyof T>(
  key: K
) => {
  return (data: T[]): Group<T, T[K]>[] => {
    const map = new Map<T[K], Group<T, T[K]>>()

    for (const item of data) {
      const groupKey = item[key]

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          items: []
        })
      }

      map.get(groupKey)!.items.push(item)
    }

    return Array.from(map.values())
  }
}

export const having = <T, K>(
  predicate: (group: Group<T, K>) => boolean
): GroupTransform<T, K> => {
  return (groups) => groups.filter(predicate)
}

export function query<T>(...steps: Array<(data: any) => any>) {
  return (data: T[]) => steps.reduce((acc, step) => step(acc), data)
}