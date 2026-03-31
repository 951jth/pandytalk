export const AI_BOT_ID = 'pandytalk_ai_bot'
export const AI_BOT_NAME = '팬디봇'
export const AI_BOT_IMAGE = require('@shared/assets/images/pandybot.png')

// TODO: 배포 후 생성된 Cloud Function URL로 교체 필요
export const AI_STREAM_URL =
  'https://asia-northeast3-csh-rn.cloudfunctions.net/onAiStream'
export const MENTION_CHUNKS = [
  {label: '팬디에게 물어보기 ✨', value: '@팬디', fixed: true},
  {label: '오늘의 날씨 어때? ☀️', value: '@팬디 오늘 날씨 어때?'},
  {
    label: '오늘 점심 뭐 먹지? 🍱',
    value: '@팬디 오늘 점심 메뉴 하나만 추천해줘!',
  },
  {
    label: '웃긴 이야기 들려줘! 😂',
    value:
      '@팬디 나 심심해! 기분이 좋아지는 웃긴 이야기나 넌센스 퀴즈 하나만 내줘',
  },
  {
    label: '나 오늘 너무 힘들었어.. 🥺',
    value: '@팬디 나 오늘 너무 힘들었는데 따뜻한 위로 한마디만 해줘',
  },
  {label: '오늘의 운세 알려줘 🍀', value: '@팬디 오늘 나의 운세 알려줘'},
  {
    label: '영어 한 문장 알려줘 🇺🇸',
    value: '@팬디 오늘 바로 써먹을 수 있는 유용한 영어 표현 하나만 알려줘',
  },
  {label: '팬디랑 수다 떨기 🐾', value: '@팬디 안녕? 반가워'},
  {
    label: '프로젝트 구조 설명해줘 🛠️',
    value: '@팬디 이 프로젝트 구조에 대해 설명해줘',
  },
  {
    label: '오늘 날씨에 맞는 노래 추천해줘 🎶',
    value: '@팬디 지금 날씨에 어울리는 기분 좋아지는 노래 하나만 추천해줘!',
  },
  {
    label: '결정해줘! 짜장 vs 짬뽕? ⚖️',
    value: '@팬디 내가 지금 너무 고민되는데 너가 하나만 골라줘! 짜장 vs 짬뽕?',
  },
] as const
