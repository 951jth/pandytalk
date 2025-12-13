import {useRef} from 'react'

function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  wait = 200,
) {
  const timer = useRef<number | null>(null)
  return (...args: Parameters<T>) => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      fn(...args)
      timer.current = null
    }, wait)
  }
}

export {useDebouncedCallback}
