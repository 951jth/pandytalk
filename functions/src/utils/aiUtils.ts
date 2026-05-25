import * as logger from 'firebase-functions/logger'
import type {
  AiImageUrlContentPart,
  AiRecentMessage,
  AiRecentUserContent,
  AiTextContentPart,
} from '../types/chat'

type UnknownRecord = Record<string, unknown>

export const isRecord = (value: unknown): value is UnknownRecord =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/**
 * 외부 API 응답 필드를 문자열로 정규화합니다.
 * 문자열이 아닌 값은 AI 프롬프트에 섞이지 않도록 빈 문자열로 처리합니다.
 */
export const toString = (value: unknown) =>
  typeof value === 'string' ? value : ''

/**
 * OpenAI tool call arguments(JSON 문자열)에서 search_web query만 안전하게 꺼냅니다.
 * 파싱 실패나 query 누락 시 빈 검색어로 낮춰 호출부가 예외 없이 이어가게 합니다.
 */
export const parseSearchQuery = (args: string) => {
  try {
    const parsed: unknown = JSON.parse(args)
    if (isRecord(parsed)) return toString(parsed.query)
  } catch (err) {
    logger.warn('🔍 검색어 파싱 실패', err)
  }

  return ''
}

export const toErrorMessage = (error: unknown, fallback = 'Unknown error') => {
  if (error instanceof Error) return error.message
  if (isRecord(error) && typeof error.message === 'string') {
    return error.message
  }
  if (typeof error === 'string') return error

  return fallback
}

export const isAbortLikeError = (error: unknown) => {
  if (!isRecord(error)) return false

  return error.name === 'AbortError' || error.code === 'ERR_CANCELED'
}

const isTextContentPart = (value: unknown): value is AiTextContentPart =>
  isRecord(value) && value.type === 'text' && typeof value.text === 'string'

const isImageUrlContentPart = (
  value: unknown,
): value is AiImageUrlContentPart =>
  isRecord(value) &&
  value.type === 'image_url' &&
  isRecord(value.image_url) &&
  typeof value.image_url.url === 'string'

const toAiRecentUserContent = (
  content: unknown,
): AiRecentUserContent | null => {
  if (typeof content === 'string') return content

  if (!Array.isArray(content)) return null

  const parts = content.filter(
    (part): part is AiTextContentPart | AiImageUrlContentPart =>
      isTextContentPart(part) || isImageUrlContentPart(part),
  )

  return parts.length > 0 ? parts : null
}

export const toAiRecentMessages = (value: unknown): AiRecentMessage[] => {
  if (!Array.isArray(value)) return []

  return value.reduce<AiRecentMessage[]>((messages, item) => {
    if (!isRecord(item)) return messages

    if (item.role === 'assistant' && typeof item.content === 'string') {
      messages.push({role: 'assistant', content: item.content})
      return messages
    }

    if (item.role === 'user') {
      const content = toAiRecentUserContent(item.content)
      if (content) {
        messages.push({role: 'user', content})
      }
      return messages
    }

    return messages
  }, [])
}

export const getTextFromAiContent = (content: AiRecentUserContent | string) => {
  if (typeof content === 'string') return content

  const textPart = content.find(part => part.type === 'text')
  return textPart?.text || ''
}

/**
 * AI 컨텍스트(히스토리)에서 현재 질문(prompt)과 중복되는 메시지를 제거합니다.
 * 닉네임 패턴 [닉네임]: 이 포함된 경우에도 정확히 필터링합니다.
 */
export function filterDuplicatePrompt(
  history: AiRecentMessage[],
  prompt: string,
): AiRecentMessage[] {
  return history.filter(h => {
    // 1. 메시지 본문 텍스트 추출
    const contentText = getTextFromAiContent(h.content)

    // 2. [닉네임]: 패턴 제거 로직 (정규식 사용)
    // ^\[.*?\]:\s? -> 시작 지점부터 [이름]: 와 공백 하나까지 매칭하여 제거
    const pureContent = contentText.replace(/^\[.*?\]:\s?/, '')

    // 3. 순수 내용과 현재 prompt 비교 (공백 제거 및 대소문자 무시)
    return pureContent.trim().toLowerCase() !== prompt.trim().toLowerCase()
  })
}
