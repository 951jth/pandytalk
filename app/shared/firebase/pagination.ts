// shared/firebase/pagination.ts (추천 위치 예시)
export type PageResult<T, TDoc = unknown> = {
  items: T[]
  nextPageParam: TDoc | null
  hasNext: boolean
}

/**
 * Firestore QueryDocumentSnapshot[] -> PageResult<T>
 * - query는 limit(pageSize + 1)로 호출하는 것을 권장
 * - docs.length > pageSize 이면 hasNext=true
 * - items는 pageSize까지만 매핑
 * - nextPageParam은 "실제로 반환한 마지막 doc" (다음 startAfter에 사용)
 */
export function toPageResult<T, TDoc>(
  docs: TDoc[],
  pageSize: number,
  mapFn: (doc: TDoc) => T,
): PageResult<T, TDoc> {
  const hasNext = docs.length > pageSize
  const pageDocs = hasNext ? docs.slice(0, pageSize) : docs

  const items = pageDocs.map(mapFn)
  const nextPageParam = pageDocs.length ? pageDocs[pageDocs.length - 1] : null

  return {items, nextPageParam, hasNext}
}

export function toInfiniteQueryData<T, TDoc>(pages: PageResult<T, TDoc>[]) {
  const data = pages.flatMap(page => page.items)
  const lastPage = pages[pages.length - 1]
  const nextPageParam = lastPage.hasNext ? lastPage.nextPageParam : undefined
  return {data, lastPage, nextPageParam}
}
