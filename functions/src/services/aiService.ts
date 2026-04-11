import * as logger from 'firebase-functions/logger'
import {OpenAI} from 'openai'
import {AI_BASE_PROMPT} from '../constants/ai'

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
  history: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [],
  imageUrl?: string,
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] => {
  logger.info(
    `🤖 [getPandibotMessages] Prompt: ${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''} | History: ${history.length}건 | Image: ${imageUrl ? '있음' : '없음'}`,
  )
  // 1. 히스토리 정제: 이전 메시지의 이미지들은 제거하고 텍스트만 남김 (토큰 절약 및 단건 분석)
  const sanitizedHistory = history.map(msg => {
    if (Array.isArray(msg.content)) {
      const textPart = msg.content.find(p => p.type === 'text') as any
      return {
        ...msg,
        content: textPart?.text || '',
      }
    }
    return msg
  })

  // 2. 현재 질문 구성
  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {type: 'text', text: prompt},
  ]

  if (imageUrl) {
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
 * OpenAI API를 통해 도구 호출을 포함한 AI 응답 스트림을 반환합니다.
 */
export const getAiResponseStream = async (
  openai: OpenAI,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  searchApiKey: string, // 이제 Google(Serper) 키를 전달받음
) => {
  // 1단계: 검색 도구 사용 여부 확인
  const initialResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools,
    tool_choice: 'auto',
  })

  const responseMessage = initialResponse.choices[0].message

  if (responseMessage.tool_calls) {
    const nextMessages = [...messages, responseMessage]

    for (const toolCall of responseMessage.tool_calls) {
      if (
        toolCall.type === 'function' &&
        toolCall.function.name === 'search_web'
      ) {
        const queryParam = JSON.parse(toolCall.function.arguments).query
        // 구글(Serper) 검색 엔진 사용
        const searchContent = await searchGoogle(queryParam, searchApiKey)
        logger.info(`🔍 [onAiStream] 검색 결과: ${searchContent}`)
        nextMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: searchContent,
        })
      }
    }
    logger.info(`🔍 도구 호출 결과: ${JSON.stringify(nextMessages)}`)
    // 도구 호출 결과가 포함된 상태로 최종 스트림 생성
    return await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: nextMessages,
      stream: true,
    })
  }

  // 도구 호출이 없는 경우 스트림 반환
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
        const queryParam = JSON.parse(toolCall.function.arguments).query
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

    const data = (await response.json()) as any
    const results = (data.organic || []).map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }))

    logger.info(`🔍 검색 완료! 결과 수: ${results.length}개`)
    if (results.length > 0) {
      logger.info(`🔍 첫 번째 결과 요약: ${results[0].title.slice(0, 30)}...`)
    } else {
      logger.warn(`⚠️ 검색 결과가 비어있습니다.`)
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
    const searchData = (await searchRes.json()) as any
    const results = (searchData.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }))

    logger.info(`🔍 검색 완료! 결과 수: ${results.length}개`)
    if (results.length > 0) {
      logger.info(`🔍 첫 번째 결과 요약: ${results[0].title.slice(0, 30)}...`)
    } else {
      logger.warn(`⚠️ 검색 결과가 비어있습니다.`)
    }

    return JSON.stringify(results)
  } catch (err) {
    logger.error('🔍 검색 실패', err)
    return '검색에 실패했습니다.'
  }
}
