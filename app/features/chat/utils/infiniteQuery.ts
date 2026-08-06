import type {ReactQueryPageType} from '@app/features/chat/types/react-query'
import type {InfiniteData} from '@tanstack/react-query'

type QueryPages<T> = InfiniteData<ReactQueryPageType<T>>

/** 기존 페이지 구조와 메타데이터를 유지하면서 모든 항목을 순회 갱신합니다. */
export const updateInfiniteQueryItems = <T>(
  data: QueryPages<T> | undefined,
  updater: (item: T) => T,
) => {
  if (!data) return data

  return {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      data: page.data.map(updater),
    })),
  }
}

/** 평탄화된 항목을 페이지 크기에 맞춰 다시 나누고 기존 커서를 유지합니다. */
export const rebuildInfiniteQueryPages = <T>(
  items: T[],
  old: QueryPages<T>,
  pageSize: number,
): QueryPages<T> => {
  const newPages: ReactQueryPageType<T>[] = []

  for (let i = 0; i < items.length; i += pageSize) {
    const slice = items.slice(i, i + pageSize)
    newPages.push({
      data: slice,
      lastVisible:
        old.pages[Math.min(newPages.length, old.pages.length - 1)]
          ?.lastVisible ?? null,
      isLastPage: i + pageSize >= items.length,
    })
  }

  return {...old, pages: newPages.length ? newPages : old.pages}
}
