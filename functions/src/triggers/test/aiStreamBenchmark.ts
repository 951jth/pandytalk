import * as logger from 'firebase-functions/logger'
import {onRequest, Request} from 'firebase-functions/v2/https'
import {OpenAI} from 'openai'
import {getPandibotMessages} from '../../services/aiService'
import {isRecord} from '../../utils/aiUtils'

const DEFAULT_PROMPT =
  '@팬디 Local-First 아키텍처가 채팅 앱에서 왜 유리한지, SQLite를 사용할 때의 장점과 단점, Firestore만 사용하는 방식과의 차이를 면접 답변처럼 정리해줘.'

type BenchmarkOrder = 'streamFirst' | 'normalFirst' | 'alternate'

const MODEL = 'gpt-4o-mini'
const MAX_RUNS = 5

const now = () => Date.now()

const toElapsed = (startedAt: number) => now() - startedAt

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const formatPercent = (value: number) => Number(value.toFixed(2))

const average = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

const hasMojibake = (value: string) => value.includes('\uFFFD')

const getRequestValue = (source: unknown, key: string) =>
  isRecord(source) ? source[key] : undefined

const getPrompt = (req: Request) => {
  const promptBase64 =
    getRequestValue(req.body, 'promptBase64') ||
    getRequestValue(req.query, 'promptBase64')

  if (typeof promptBase64 === 'string' && promptBase64) {
    return Buffer.from(promptBase64, 'base64').toString('utf8')
  }

  const prompt =
    getRequestValue(req.body, 'prompt') || getRequestValue(req.query, 'prompt')

  return typeof prompt === 'string' ? prompt : DEFAULT_PROMPT
}

const runPureStreamBenchmark = async (openai: OpenAI, prompt: string) => {
  const startedAt = now()
  const messages = getPandibotMessages(prompt)
  const stream = await openai.chat.completions.create({
    model: MODEL,
    messages,
    stream: true,
  })

  let firstChunkMs: number | null = null
  let chunks = 0
  let text = ''

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ''
    if (!content) continue

    if (firstChunkMs === null) {
      firstChunkMs = toElapsed(startedAt)
    }

    chunks += 1
    text += content
  }

  return {
    firstChunkMs,
    doneMs: toElapsed(startedAt),
    chunks,
    chars: text.length,
    preview: text.slice(0, 120),
  }
}

const runPureNormalBenchmark = async (openai: OpenAI, prompt: string) => {
  const startedAt = now()
  const messages = getPandibotMessages(prompt)
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages,
  })
  const text = response.choices[0]?.message.content || ''

  return {
    doneMs: toElapsed(startedAt),
    chars: text.length,
    preview: text.slice(0, 120),
  }
}

const getRunOrder = (order: BenchmarkOrder, index: number) => {
  if (order === 'alternate') {
    return index % 2 === 0 ? 'streamFirst' : 'normalFirst'
  }

  return order
}

export const testAiStreamBenchmark = onRequest(
  {
    region: 'asia-northeast3',
    secrets: ['OPENAI_API_SECRET'],
    cors: true,
  },
  async (req, res) => {
    const prompt = getPrompt(req)
    const order = (req.body?.order ||
      req.query?.order ||
      'alternate') as BenchmarkOrder
    const runs = Math.min(
      MAX_RUNS,
      Math.max(1, toNumber(req.body?.runs || req.query?.runs, 3)),
    )
    const openai = new OpenAI({apiKey: process.env.OPENAI_API_SECRET})

    logger.info(
      `🧪 [testAiStreamBenchmark] Started: fair stream vs normal benchmark | runs=${runs} | order=${order}`,
    )

    try {
      if (typeof prompt !== 'string' || hasMojibake(prompt)) {
        res.status(400).json({
          error:
            '프롬프트 인코딩이 깨졌습니다. PowerShell에서는 UTF-8 byte body 또는 promptBase64 방식으로 호출하세요.',
          receivedPrompt: prompt,
        })
        return
      }

      const samples = []

      for (let index = 0; index < runs; index += 1) {
        const runOrder = getRunOrder(order, index)

        if (runOrder === 'streamFirst') {
          const stream = await runPureStreamBenchmark(openai, prompt)
          const normal = await runPureNormalBenchmark(openai, prompt)
          samples.push({run: index + 1, order: runOrder, stream, normal})
        } else {
          const normal = await runPureNormalBenchmark(openai, prompt)
          const stream = await runPureStreamBenchmark(openai, prompt)
          samples.push({run: index + 1, order: runOrder, stream, normal})
        }
      }

      const streamResponseTimes = samples.map(
        sample => sample.stream.firstChunkMs || sample.stream.doneMs,
      )
      const streamDoneTimes = samples.map(sample => sample.stream.doneMs)
      const normalResponseTimes = samples.map(sample => sample.normal.doneMs)
      const streamChars = samples.map(sample => sample.stream.chars)
      const normalChars = samples.map(sample => sample.normal.chars)
      const streamChunks = samples.map(sample => sample.stream.chunks)
      const responseGains = samples.map(
        (sample, index) => normalResponseTimes[index] - streamResponseTimes[index],
      )
      const normalAvgMs = average(normalResponseTimes)
      const streamFirstChunkAvgMs = average(streamResponseTimes)
      const streamDoneAvgMs = average(streamDoneTimes)
      const streamAvgChars = average(streamChars)
      const normalAvgChars = average(normalChars)
      const streamAvgChunks = average(streamChunks)
      const responseGainAvgMs = average(responseGains)
      const responseGainPercent =
        normalAvgMs > 0 ? (responseGainAvgMs / normalAvgMs) * 100 : 0

      const result = {
        prompt,
        model: MODEL,
        runs,
        order,
        note: 'tool-call/preflight를 제외하고 같은 프롬프트를 stream:false와 stream:true로 직접 호출한 공정 비교입니다.',
        summary: {
          normalAvgMs: Number(normalAvgMs.toFixed(2)),
          streamFirstChunkAvgMs: Number(streamFirstChunkAvgMs.toFixed(2)),
          streamDoneAvgMs: Number(streamDoneAvgMs.toFixed(2)),
          responseGainAvgMs: Number(responseGainAvgMs.toFixed(2)),
          responseGainPercent: formatPercent(responseGainPercent),
          streamAvgChars: Number(streamAvgChars.toFixed(2)),
          normalAvgChars: Number(normalAvgChars.toFixed(2)),
          streamAvgChunks: Number(streamAvgChunks.toFixed(2)),
        },
        samples,
      }

      logger.info(
        [
          '✅ [testAiStreamBenchmark] Completed',
          `스트림 첫 응답 평균=${result.summary.streamFirstChunkAvgMs}ms`,
          `일반 응답 평균=${result.summary.normalAvgMs}ms`,
          `응답 속도=${result.summary.responseGainAvgMs}ms 빠름 (${result.summary.responseGainPercent}%)`,
          `스트림 평균 문자 수=${result.summary.streamAvgChars}`,
          `일반 평균 문자 수=${result.summary.normalAvgChars}`,
          `반복=${runs}회`,
        ].join(' | '),
      )
      res.status(200).json(result)
    } catch (error) {
      logger.error('❌ [testAiStreamBenchmark] Failed', error)
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
)
