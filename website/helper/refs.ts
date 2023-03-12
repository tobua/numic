import { useRef } from 'react'

// Taken from https://github.com/yuchi/react-use-refs which is missing repository and TS source.
const MAX_ITERATIONS_COUNT = 50

function iterator() {
  return this
}

type Tuple<T = any> = [T] | T[]
type IsTuple<T> = T extends any[] ? (any[] extends T ? never : T) : never

export function useRefs<T extends Tuple>(initialValue: T extends IsTuple<T> ? null : never) {
  let count = 0

  return {
    next() {
      if (++count > MAX_ITERATIONS_COUNT) {
        throw new Error(
          'useMultipleRefs: reached more than 50 refs. This hook can be used exclusively with the array destructuring syntax.'
        )
      }

      return {
        done: false,
        value: useRef(initialValue),
      }
    },
    [Symbol.iterator]: iterator,
  }
}
