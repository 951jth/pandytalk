import * as logger from 'firebase-functions/logger'
import {OpenAI} from 'openai'
import {AI_BASE_PROMPT, AI_IMAGE_LIMIT} from '../constants/ai'
import type {AiRecentMessage} from '../types/chat'
import {isRecord, parseSearchQuery, toString} from '../utils/aiUtils'

type SearchGoogleResult = {
  title: string
  link: string
  snippet: string
}

type SearchTabilyResult = {
  title: string
  url: string
  content: string
}


/**
 * 팬디봇이 사용할 수 있는 AI 도구(Function Calling) 목록을 반환합니다.
 */
export const getPandibotTools =
  (): OpenAI.Chat.Completions.ChatCompletionTool[] => [
    {
      type: 'function',
      function: {
        name: 'search_web',
        description: '실시간 검색이 필요할 때 사용해',
        parameters: {
          type: 'object',
          properties: {
            query: {type: 'string'},
          },
          required: ['query'],
        },
      },
    },
  ]

/**
 * 팬디봇의 시스템 프롬프트가 포함된 메시지 리스트를 반환합니다.
 */
export const getPandibotMessages = (
  prompt: string,
  history: AiRecentMessage[] = [],
  imageUrl?: string,
  imageUrls?: string[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] => {
  logger.info(
    `🤖 [getPandibotMessages] Prompt: ${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''} | History: ${history.length}건 | Image: ${imageUrl ? '있음' : '없음'} | MultiImages: ${imageUrls?.length || 0}`,
  )
  // 1. 히스토리 정제: 이전 메시지의 이미지들은 제거하고 텍스트만 남김 (토큰 절약 및 단건 분석)
  const sanitizedHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    history.map(msg => {
      if (Array.isArray(msg.content)) {
        const textPart = msg.content.find(part => part.type === 'text')
        return {
          role: msg.role,
          content: textPart?.text || '',
        }
      }

      if (msg.role === 'assistant') {
        return {
          role: 'assistant',
          content: msg.content,
        }
      }

      return {
        role: 'user',
        content: msg.content,
      }
    })

  // 2. 현재 질문 구성
  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {type: 'text', text: prompt},
  ]

  // 멀티 이미지 처리 (우선순위, 상수로 제한)
  if (imageUrls && imageUrls.length > 0) {
    imageUrls.slice(0, AI_IMAGE_LIMIT).forEach(url => {
      userContent.push({
        type: 'image_url',
        image_url: {url},
      })
    })
  } else if (imageUrl) {
    // 단일 이미지 처리 (하위 호환)
    userContent.push({
      type: 'image_url',
      image_url: {url: imageUrl},
    })
  }

  const finalMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: AI_BASE_PROMPT,
    },
    ...sanitizedHistory,
    {
      role: 'user',
      content: userContent,
    },
  ]

  return finalMessages
}

/**
 * OpenAI API를 통해 AI 응답 스트림을 생성합니다.
 *
 * 이 함수는 바로 스트리밍 응답을 만들지 않고, 먼저 non-streaming 요청을 한 번 보내
 * 모델이 검색 도구(search_web)를 호출해야 하는지 판단하게 합니다.
 * 검색이 필요하면 Serper 검색 결과를 tool 메시지로 대화 기록에 추가한 뒤,
 * 그 보강된 메시지 목록으로 최종 streaming 요청을 다시 보냅니다.
 * 검색이 필요하지 않으면 원본 메시지 목록으로 바로 streaming 요청을 보냅니다.
 *
 * @param openai OpenAI SDK 클라이언트 인스턴스
 * @param messages system/user/history가 포함된 Chat Completions 메시지 목록
 * @param tools 모델이 사용할 수 있는 function calling 도구 목록
 * @param searchApiKey search_web 도구 실행에 사용할 Serper API 키
 * @returns OpenAI Chat Completions 스트림. 호출부에서 for-await로 chunk를 읽어 SSE로 전달합니다.
 */
export const getAiResponseStream = async (
  openai: OpenAI,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  searchApiKey: string, // 이제 Google(Serper) 키를 전달받음
) => {
  // 1단계: 스트리밍 없이 모델을 한 번 호출해 도구 호출 여부만 먼저 확인합니다.
  // tool_choice: 'auto'이므로 모델은 현재 메시지만으로 답할 수 있으면 일반 답변을,
  // 최신 정보가 필요하다고 판단하면 tools에 정의된 search_web 호출을 반환합니다.
  const initialResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools,
    tool_choice: 'auto',
  })

  const responseMessage = initialResponse.choices[0].message

  // 모델이 function calling을 요청한 경우입니다.
  // OpenAI 규격상 assistant의 tool_calls 메시지를 먼저 대화 기록에 넣고,
  // 각 tool_call_id에 대응되는 role: 'tool' 메시지를 이어서 추가해야 합니다.
  if (responseMessage.tool_calls) {
    const nextMessages = [...messages, responseMessage]

    for (const toolCall of responseMessage.tool_calls) {
      // 현재 서비스에서 실제로 실행 가능한 도구는 search_web 하나입니다.
      // 다른 이름의 도구 호출이 들어오면 실행하지 않고 무시합니다.
      if (
        toolCall.type === 'function' &&
        toolCall.function.name === 'search_web'
      ) {
        // 모델이 JSON 문자열로 넘긴 function arguments에서 검색어를 꺼냅니다.
        // getPandibotTools에서 query를 required로 선언했기 때문에 정상 호출이면 query가 존재합니다.
        const queryParam = parseSearchQuery(toolCall.function.arguments)
        // 구글(Serper) 검색 엔진 사용
        const searchContent = await searchGoogle(queryParam, searchApiKey)
        logger.info(`🔍 [onAiStream] 검색 결과: ${searchContent}`)
        // 검색 결과를 같은 tool_call_id에 연결해 모델에게 되돌려줍니다.
        // 이렇게 해야 다음 OpenAI 호출에서 모델이 "검색 결과를 본 뒤" 최종 답변을 생성할 수 있습니다.
        nextMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: searchContent,
        })
      }
    }
    logger.info(`🔍 도구 호출 결과: ${JSON.stringify(nextMessages)}`)
    // 2단계: 도구 실행 결과가 포함된 대화 기록으로 최종 답변 스트림을 생성합니다.
    // 이 호출의 반환값이 실제 사용자에게 SSE로 전달되는 chunk stream입니다.
    return await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: nextMessages,
      stream: true,
    })
  }

  // 도구 호출이 없으면 초기 응답 내용은 사용하지 않습니다.
  // 대신 같은 messages로 streaming 요청을 다시 보내 호출부가 동일한 방식으로 chunk를 처리하게 합니다.
  return await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream: true,
  })
}

/**
 * OpenAI API를 통해 도구 호출을 포함한 일반 AI 응답(Full Text)을 반환합니다.
 * (백그라운드 백업용)
 */
export const getAiResponse = async (
  openai: OpenAI,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  searchApiKey: string,
): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools,
    tool_choice: 'auto',
  })

  const responseMessage = response.choices[0].message

  if (responseMessage.tool_calls) {
    const nextMessages = [...messages, responseMessage]
    for (const toolCall of responseMessage.tool_calls) {
      if (
        toolCall.type === 'function' &&
        toolCall.function.name === 'search_web'
      ) {
        const queryParam = parseSearchQuery(toolCall.function.arguments)
        const searchContent = await searchGoogle(queryParam, searchApiKey)
        nextMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: searchContent,
        })
      }
    }
    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: nextMessages,
    })
    return finalResponse.choices[0].message.content || ''
  }

  return responseMessage.content || ''
}

/**
 * Serper (Google Search) API를 사용하여 실시간 정보를 검색합니다.
 */
export const searchGoogle = async (
  query: string,
  apiKey: string,
): Promise<string> => {
  logger.info(`🔍 구글 검색 시작: ${query}`)
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        gl: 'kr',
        hl: 'ko',
        autocorrect: true,
      }),
    })

    const data: unknown = await response.json()
    const results = toSerperResults(data)

    logger.info(`🔍 검색 완료! 결과 수: ${results.length}개`)
    if (results.length > 0) {
      logger.info(`🔍 첫 번째 결과 요약: ${results[0].title.slice(0, 30)}...`)
    } else {
      logger.warn('⚠️ 검색 결과가 비어있습니다.')
    }

    return JSON.stringify(results)
  } catch (err) {
    logger.error('🔍 구글 검색 실패', err)
    return '검색 결과를 가져오지 못했습니다.'
  }
}

/**
 * Tavily 검색 API를 사용하여 실시간 정보를 검색합니다.
 */
export const searchTabily = async (
  query: string,
  apiKey: string,
): Promise<string> => {
  logger.info(`🔍 Tavily 검색 시작: ${query}`)
  try {
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        max_results: 5,
      }),
    })
    const searchData: unknown = await searchRes.json()
    const results = toTabilyResults(searchData)

    logger.info(`🔍 검색 완료! 결과 수: ${results.length}개`)
    if (results.length > 0) {
      logger.info(`🔍 첫 번째 결과 요약: ${results[0].title.slice(0, 30)}...`)
    } else {
      logger.warn('⚠️ 검색 결과가 비어있습니다.')
    }

    return JSON.stringify(results)
  } catch (err) {
    logger.error('🔍 검색 실패', err)
    return '검색에 실패했습니다.'
  }
}

/**
 * Serper 응답의 organic 검색 결과를 searchGoogle에서 반환할 최소 필드로 정규화합니다.
 * 응답 구조가 예상과 다르면 빈 배열을 반환하고, 각 필드는 문자열만 통과시킵니다.
 */
export const toSerperResults = (payload: unknown): SearchGoogleResult[] => {
  if (!isRecord(payload) || !Array.isArray(payload.organic)) return []

  return payload.organic.flatMap(item => {
    if (!isRecord(item)) return []

    return [
      {
        title: toString(item.title),
        link: toString(item.link),
        snippet: toString(item.snippet),
      },
    ]
  })
}

/**
 * Tavily 응답의 results 검색 결과를 내부에서 쓰는 최소 필드로 정규화합니다.
 * 응답 구조가 예상과 다르면 빈 배열을 반환하고, 각 필드는 문자열만 통과시킵니다.
 */
export const toTabilyResults = (payload: unknown): SearchTabilyResult[] => {
  if (!isRecord(payload) || !Array.isArray(payload.results)) return []

  return payload.results.flatMap(item => {
    if (!isRecord(item)) return []

    return [
      {
        title: toString(item.title),
        url: toString(item.url),
        content: toString(item.content),
      },
    ]
  })
}
