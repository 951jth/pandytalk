import {useRef} from 'react'

function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  wait = 200,
) {
  const timer = useRef<number | null>(null)
  return (...args: TArgs) => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      fn(...args)
      timer.current = null
    }, wait)
  }
}

export {useDebouncedCallback}
