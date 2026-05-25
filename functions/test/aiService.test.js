const assert = require('node:assert/strict')
const test = require('node:test')

const {
  getAiResponse,
  getAiResponseStream,
  toSerperResults,
  toTabilyResults,
} = require('../lib/services/aiService')

// OpenAI SDK의 chat.completions.create만 흉내냅니다.
// responses 배열 순서대로 응답을 꺼내며, calls에는 실제 호출 인자를 기록합니다.
const createOpenAiMock = responses => {
  const calls = []
  return {
    calls,
    client: {
      chat: {
        completions: {
          create: async params => {
            calls.push(params)
            const response = responses.shift()
            if (response instanceof Error) throw response
            return response
          },
        },
      },
    },
  }
}

// searchGoogle 내부의 Serper fetch 호출을 흉내냅니다.
// responses에 Error를 넣으면 검색 실패 fallback 흐름을 검증할 수 있습니다.
const createSerperFetchMock = (responses = []) => {
  const calls = []
  return async (url, options) => {
    calls.push({url, options})
    const response = responses.shift()
    if (response instanceof Error) throw response
    return {
      json: async () => response,
    }
  }
}

// getAiResponse/getAiResponseStream에 공통으로 넘기는 최소 대화 컨텍스트입니다.
const baseMessages = [
  {role: 'system', content: 'system prompt'},
  {role: 'user', content: '오늘 날씨 알려줘'},
]

// 팬디봇이 사용할 수 있는 search_web 도구 정의를 테스트용으로 축약한 값입니다.
const baseTools = [
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'search',
      parameters: {
        type: 'object',
        properties: {query: {type: 'string'}},
        required: ['query'],
      },
    },
  },
]

// 모델이 "실시간 검색이 필요하다"고 판단했을 때 반환하는 tool call 예시입니다.
const searchToolCall = {
  id: 'call_search_1',
  type: 'function',
  function: {
    name: 'search_web',
    arguments: '{"query":"오늘 서울 날씨"}',
  },
}

// 각 테스트가 global.fetch를 갈아끼우므로 다음 테스트에 새지 않게 정리합니다.
test.afterEach(() => {
  delete global.fetch
})

// toSerperResults: Serper API 응답을 searchGoogle이 쓰는 최소 필드 배열로 정규화합니다.
test('toSerperResults returns an empty array for non-record or non-array payloads', () => {
  assert.deepEqual(toSerperResults(null), [])
  assert.deepEqual(toSerperResults('not-a-record'), [])
  assert.deepEqual(toSerperResults([]), [])
  assert.deepEqual(toSerperResults({organic: 'not-an-array'}), [])
  assert.deepEqual(toSerperResults({organic: [null, 'bad-item']}), [])
})

// toSerperResults: 정상 결과는 title/link/snippet만 남기고, 문자열이 아닌 값은 빈 문자열로 낮춥니다.
test('toSerperResults returns searchGoogle-compatible result items', () => {
  const results = toSerperResults({
    organic: [
      {
        title: '검색 결과 제목',
        link: 'https://example.com/result',
        snippet: '검색 결과 요약',
        ignored: 'unused',
      },
      {
        title: 123,
        link: null,
        snippet: undefined,
      },
    ],
  })

  assert.deepEqual(results, [
    {
      title: '검색 결과 제목',
      link: 'https://example.com/result',
      snippet: '검색 결과 요약',
    },
    {
      title: '',
      link: '',
      snippet: '',
    },
  ])
})

// toTabilyResults: Tavily API 응답 형태가 아니면 안전하게 빈 배열을 반환합니다.
test('toTabilyResults returns an empty array for non-record or non-array payloads', () => {
  assert.deepEqual(toTabilyResults(null), [])
  assert.deepEqual(toTabilyResults('not-a-record'), [])
  assert.deepEqual(toTabilyResults([]), [])
  assert.deepEqual(toTabilyResults({results: 'not-an-array'}), [])
  assert.deepEqual(toTabilyResults({results: [null, 'bad-item']}), [])
})

// toTabilyResults: Tavily results를 title/url/content 문자열 필드로 정규화합니다.
test('toTabilyResults returns Tavily result items normalized to strings', () => {
  const results = toTabilyResults({
    results: [
      {
        title: 'Tavily 결과 제목',
        url: 'https://example.com/tavily',
        content: 'Tavily 결과 내용',
        ignored: 'unused',
      },
      {
        title: 123,
        url: null,
        content: undefined,
      },
    ],
  })

  assert.deepEqual(results, [
    {
      title: 'Tavily 결과 제목',
      url: 'https://example.com/tavily',
      content: 'Tavily 결과 내용',
    },
    {
      title: '',
      url: '',
      content: '',
    },
  ])
})

// getAiResponse: 백업 태스크에서 쓰는 non-streaming 응답 함수입니다.
// tool call이 없으면 첫 OpenAI 응답의 content를 그대로 반환해야 합니다.
test('getAiResponse returns initial content when no tool call is requested', async () => {
  const {client, calls} = createOpenAiMock([
    {choices: [{message: {role: 'assistant', content: '안녕!'}}]},
  ])
  global.fetch = createSerperFetchMock()

  const result = await getAiResponse(client, baseMessages, baseTools, 'serper-key')

  assert.equal(result, '안녕!')
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], {
    model: 'gpt-4o-mini',
    messages: baseMessages,
    tools: baseTools,
    tool_choice: 'auto',
  })
})

// getAiResponse: 모델이 search_web을 요청하면 Serper 검색 결과를 tool 메시지로 붙인 뒤
// OpenAI를 한 번 더 호출해 최종 텍스트를 반환해야 합니다.
test('getAiResponse searches web and returns final content for search_web tool calls', async () => {
  const finalMessage = {role: 'assistant', content: '검색 기반 답변'}
  const {client, calls} = createOpenAiMock([
    {
      choices: [
        {
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [searchToolCall],
          },
        },
      ],
    },
    {choices: [{message: finalMessage}]},
  ])
  const fetchCalls = []
  global.fetch = async (url, options) => {
    fetchCalls.push({url, options})
    return {
      json: async () => ({
        organic: [
          {
            title: '서울 날씨',
            link: 'https://example.com/weather',
            snippet: '맑음',
          },
        ],
      }),
    }
  }

  const result = await getAiResponse(client, baseMessages, baseTools, 'serper-key')

  assert.equal(result, '검색 기반 답변')
  assert.equal(calls.length, 2)
  assert.equal(fetchCalls.length, 1)
  assert.equal(fetchCalls[0].url, 'https://google.serper.dev/search')
  assert.deepEqual(JSON.parse(fetchCalls[0].options.body), {
    q: '오늘 서울 날씨',
    gl: 'kr',
    hl: 'ko',
    autocorrect: true,
  })
  assert.equal(fetchCalls[0].options.headers['X-API-KEY'], 'serper-key')
  assert.deepEqual(calls[1], {
    model: 'gpt-4o-mini',
    messages: [
      ...baseMessages,
      {
        role: 'assistant',
        content: null,
        tool_calls: [searchToolCall],
      },
      {
        role: 'tool',
        tool_call_id: 'call_search_1',
        content: JSON.stringify([
          {
            title: '서울 날씨',
            link: 'https://example.com/weather',
            snippet: '맑음',
          },
        ]),
      },
    ],
  })
})

// getAiResponse: 검색 API가 실패해도 함수가 중단되지 않고 fallback tool content로 최종 답변을 이어갑니다.
test('getAiResponse continues with fallback tool content when search fails', async () => {
  const {client, calls} = createOpenAiMock([
    {
      choices: [
        {
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [searchToolCall],
          },
        },
      ],
    },
    {choices: [{message: {role: 'assistant', content: '대체 검색 답변'}}]},
  ])
  global.fetch = createSerperFetchMock([new Error('network failed')])

  const result = await getAiResponse(client, baseMessages, baseTools, 'serper-key')

  assert.equal(result, '대체 검색 답변')
  assert.equal(calls.length, 2)
  assert.equal(
    calls[1].messages.at(-1).content,
    '검색 결과를 가져오지 못했습니다.',
  )
})

// getAiResponse: OpenAI 응답에 content가 없으면 호출부가 다루기 쉬운 빈 문자열로 낮춥니다.
test('getAiResponse returns an empty string when response content is missing', async () => {
  const {client} = createOpenAiMock([
    {choices: [{message: {role: 'assistant'}}]},
  ])

  const result = await getAiResponse(client, baseMessages, baseTools, 'serper-key')

  assert.equal(result, '')
})

// getAiResponseStream: SSE 엔드포인트에서 쓰는 streaming 응답 함수입니다.
// tool call이 없으면 원본 messages로 다시 streaming 요청을 만들어 반환합니다.
test('getAiResponseStream requests a stream with original messages when no tool call is requested', async () => {
  const stream = {
    async *[Symbol.asyncIterator]() {
      yield {choices: [{delta: {content: '안녕'}}]}
    },
  }
  const {client, calls} = createOpenAiMock([
    {choices: [{message: {role: 'assistant', content: '초안'}}]},
    stream,
  ])
  global.fetch = createSerperFetchMock()

  const result = await getAiResponseStream(
    client,
    baseMessages,
    baseTools,
    'serper-key',
  )

  assert.equal(result, stream)
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[0], {
    model: 'gpt-4o-mini',
    messages: baseMessages,
    tools: baseTools,
    tool_choice: 'auto',
  })
  assert.deepEqual(calls[1], {
    model: 'gpt-4o-mini',
    messages: baseMessages,
    stream: true,
  })
})

// getAiResponseStream: search_web tool call이 있으면 검색 결과를 messages에 보강한 뒤
// 최종 streaming 요청을 생성해 호출부가 for-await로 읽을 수 있게 반환합니다.
test('getAiResponseStream searches web and requests final stream with tool results', async () => {
  const stream = {
    async *[Symbol.asyncIterator]() {
      yield {choices: [{delta: {content: '검색'}}]}
      yield {choices: [{delta: {content: '답변'}}]}
    },
  }
  const responseMessage = {
    role: 'assistant',
    content: null,
    tool_calls: [searchToolCall],
  }
  const {client, calls} = createOpenAiMock([
    {choices: [{message: responseMessage}]},
    stream,
  ])
  const fetchCalls = []
  global.fetch = async (url, options) => {
    fetchCalls.push({url, options})
    return {
      json: async () => ({
        organic: [
          {
            title: '서울 날씨',
            link: 'https://example.com/weather',
            snippet: '맑음',
          },
        ],
      }),
    }
  }

  const result = await getAiResponseStream(
    client,
    baseMessages,
    baseTools,
    'serper-key',
  )

  assert.equal(result, stream)
  assert.equal(calls.length, 2)
  assert.equal(fetchCalls.length, 1)
  assert.deepEqual(calls[1], {
    model: 'gpt-4o-mini',
    messages: [
      ...baseMessages,
      responseMessage,
      {
        role: 'tool',
        tool_call_id: 'call_search_1',
        content: JSON.stringify([
          {
            title: '서울 날씨',
            link: 'https://example.com/weather',
            snippet: '맑음',
          },
        ]),
      },
    ],
    stream: true,
  })
})

// getAiResponseStream: 모델이 여러 search_web tool call을 반환해도 순서와 tool_call_id를 보존해야 합니다.
test('getAiResponseStream handles multiple search_web tool calls in order', async () => {
  const firstToolCall = {
    id: 'call_search_1',
    type: 'function',
    function: {name: 'search_web', arguments: '{"query":"첫 번째"}'},
  }
  const secondToolCall = {
    id: 'call_search_2',
    type: 'function',
    function: {name: 'search_web', arguments: '{"query":"두 번째"}'},
  }
  const stream = {
    async *[Symbol.asyncIterator]() {
      yield {choices: [{delta: {content: '완료'}}]}
    },
  }
  const {client, calls} = createOpenAiMock([
    {
      choices: [
        {
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [firstToolCall, secondToolCall],
          },
        },
      ],
    },
    stream,
  ])
  global.fetch = createSerperFetchMock([
    {
      organic: [{title: '첫 번째 결과', link: 'https://one.example', snippet: '1'}],
    },
    {
      organic: [{title: '두 번째 결과', link: 'https://two.example', snippet: '2'}],
    },
  ])

  await getAiResponseStream(client, baseMessages, baseTools, 'serper-key')

  const toolMessages = calls[1].messages.filter(message => message.role === 'tool')
  assert.deepEqual(
    toolMessages.map(message => message.tool_call_id),
    ['call_search_1', 'call_search_2'],
  )
  assert.deepEqual(
    toolMessages.map(message => JSON.parse(message.content)[0].title),
    ['첫 번째 결과', '두 번째 결과'],
  )
})
