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
    label: '영어 한 문장 알려줘',
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
    label: '최신 뉴스 요약해줘 📰',
    value: '@팬디 지금 가장 핫한 뉴스 3가지만 요약해서 알려줘',
  },
  {
    label: '건강한 습관 추천해줘 🥗',
    value: '@팬디 오늘 내가 실천할 수 있는 건강한 습관 하나만 추천해줘',
  },
  {
    label: '동기부여 명언 한마디 💡',
    value: '@팬디 나 지금 의욕이 좀 떨어지는데 힘이 되는 명언 하나만 해줘',
  },
  {
    label: '간단한 저녁 레시피 🍳',
    value: '@팬디 냉장고 파먹기 하기 좋은 간단한 저녁 메뉴 레시피 알려줘',
  },
] as const
