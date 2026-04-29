/**
 * AI 컨텍스트(히스토리)에서 현재 질문(prompt)과 중복되는 메시지를 제거합니다.
 * 닉네임 패턴 [닉네임]: 이 포함된 경우에도 정확히 필터링합니다.
 */
export function filterDuplicatePrompt(
  history: any[],
  prompt: string,
): any[] {
  return history.filter(h => {
    // 1. 메시지 본문 텍스트 추출
    let contentText = ''
    if (typeof h.content === 'string') {
      contentText = h.content
    } else if (Array.isArray(h.content)) {
      const textPart = h.content.find((p: any) => p.type === 'text')
      contentText = textPart?.text || ''
    }

    // 2. [닉네임]: 패턴 제거 로직 (정규식 사용)
    // ^\[.*?\]:\s? -> 시작 지점부터 [이름]: 와 공백 하나까지 매칭하여 제거
    const pureContent = contentText.replace(/^\[.*?\]:\s?/, '')

    // 3. 순수 내용과 현재 prompt 비교 (공백 제거 및 대소문자 무시)
    return pureContent.trim().toLowerCase() !== prompt.trim().toLowerCase()
  })
}
