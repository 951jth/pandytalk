export type ReactQueryPageType<T> = {
  data: T[]
  lastVisible: unknown | null // 다음 커서(ms). ServerTime 금지
  isLastPage: boolean
}
