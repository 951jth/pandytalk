import {inquiryRemote} from '@app/features/admin/data/inquiryRemote.firebase'
import type {FsSnapshot} from '@app/shared/types/firebase'
import type {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'

export interface Inquiry {
  id: string
  source: string
  type: string
  email: string
  message: string
  status: string
  createdAt?: FirebaseFirestoreTypes.Timestamp | null
}

export type GetInquiriesParams = {
  pageSize?: number
  pageParam?: FsSnapshot
}

export const inquiryService = {
  getInquiries: async ({pageSize, pageParam}: GetInquiriesParams = {}) => {
    const {items, nextPageParam, hasNext} = await inquiryRemote.getInquiries({
      pageSize,
      pageParam,
    })
    return {
      inquiries: items as Inquiry[],
      lastVisible: nextPageParam,
      isLastPage: !hasNext,
    }
  },
  getInquiry: async (id: string) => {
    return (await inquiryRemote.getInquiry(id)) as Inquiry | null
  },
  updateInquiryStatus: async (id: string, status: string) => {
    await inquiryRemote.updateInquiryStatus(id, status)
  },
  deleteInquiry: async (id: string) => {
    if (!id?.trim()) {
      throw new Error('삭제할 문의 정보가 없습니다.')
    }

    const inquiry = await inquiryRemote.getInquiry(id)
    if (!inquiry) {
      throw new Error('이미 삭제되었거나 존재하지 않는 문의입니다.')
    }

    try {
      await inquiryRemote.deleteInquiry(id)
    } catch (error: unknown) {
      throw new Error(getInquiryDeleteErrorMessage(error))
    }
  },
}

function getInquiryDeleteErrorMessage(error: unknown): string {
  const code = getErrorCode(error)

  if (isPermissionDeniedError(code, error)) {
    return '문의를 삭제할 권한이 없습니다.'
  }

  if (
    code === 'firestore/unavailable' ||
    code === 'unavailable' ||
    code === 'firestore/deadline-exceeded' ||
    code === 'deadline-exceeded'
  ) {
    return '네트워크 연결을 확인한 후 다시 시도해주세요.'
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return '문의 삭제 중 오류가 발생했습니다. 다시 시도해주세요.'
}

function isPermissionDeniedError(
  code: string | undefined,
  error: unknown,
): boolean {
  if (
    code === 'firestore/permission-denied' ||
    code === 'permission-denied'
  ) {
    return true
  }

  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as {message?: string}).message === 'string'
      ? (error as {message: string}).message
      : error instanceof Error
        ? error.message
        : ''

  return message.includes('permission-denied') || message.includes('insufficient permissions')
}

function getErrorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as {code?: string}).code === 'string'
  ) {
    return (error as {code: string}).code
  }

  return undefined
}
