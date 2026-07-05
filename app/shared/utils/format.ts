
type NonEmptyRecord<T extends Record<string, unknown>> = {
  [K in keyof T as T[K] extends null | undefined ? never : K]: T[K]
}

export function removeEmpty<T extends Record<string, unknown>>(
  obj: T,
): NonEmptyRecord<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, value]) => value !== null && value !== undefined,
    ),
  ) as unknown as NonEmptyRecord<T>
}

export const toStr = (v: unknown) => (v == null ? '' : String(v))
