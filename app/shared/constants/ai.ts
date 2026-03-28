export const AI_BOT_ID = 'pandytalk_ai_bot'
export const AI_BOT_NAME = '팬디봇'
export const AI_BOT_IMAGE = require('@shared/assets/images/pandybot.png')

// TODO: 배포 후 생성된 Cloud Function URL로 교체 필요
export const AI_STREAM_URL =
  'https://asia-northeast3-csh-rn.cloudfunctions.net/onAiStream'
export const MENTION_CHUNKS = [
  {label: '팬디에게 물어보기 ✨', value: '@팬디', fixed: true},
  {label: '오늘의 날씨 어때? ☀️', value: '@팬디 오늘 날씨 어때?'},
  {label: '오늘의 운세 알려줘 🍀', value: '@팬디 오늘 나의 운세 알려줘'},
  {label: '팬디랑 수다 떨기 🐾', value: '@팬디 안녕? 반가워'},
  {
    label: '프로젝트 구조 설명해줘 🛠️',
    value: '@팬디 이 프로젝트 구조에 대해 설명해줘',
  },
] as const
