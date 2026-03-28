import * as logger from 'firebase-functions/logger'
import {OpenAI} from 'openai'

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
        logger.info(`🔍 검색 결과: ${searchContent}`)
        nextMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: searchContent,
        })
      }
    }

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
