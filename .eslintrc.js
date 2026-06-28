module.exports = {
  root: true,
  extends: [
    '@react-native',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    jest: true, // Jest 테스트 환경 변수(test, expect 등) 허용
  },
  rules: {
    // 1. 미사용 변수 관련 설정
    'no-unused-vars': 'off', // 기본 룰 끄고 TS 전용 룰 사용
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_', // 매개변수 앞에 _가 붙으면 사용 안 해도 허용
        varsIgnorePattern: '^_', // 변수 앞에 _가 붙으면 사용 안 해도 허용
        caughtErrorsIgnorePattern: '^_', // catch(e)의 e 대신 _e 사용 시 허용
      },
    ],

    // 2. 스타일 및 코드 형식 설정
    semi: 'off', // 세미콜론 자유롭게 사용 가능
    '@typescript-eslint/semi': 'off', // TS 환경에서도 세미콜론 자유롭게 사용 가능
    'no-console': 'off', // 디버깅을 위한 console.log 허용
    curly: 'off', // 한 줄 if 문에서 중괄호 생략 가능 (사용자 선호 스타일 보존)

    // 3. 리액트 및 타입스크립트 유연성 설정
    '@typescript-eslint/no-explicit-any': 'warn', // any 사용 시 에러 대신 경고만 표시
    'react-hooks/exhaustive-deps': 'warn', // useEffect 의존성 배열 누락 시 에러 대신 경고만
    'no-empty': 'warn', // 비어있는 catch 블록 등 허용하되 경고 표시
    'react/no-unstable-nested-components': ['warn', {allowAsProps: true}],
    '@typescript-eslint/ban-ts-comment': 'off', // @ts-ignore 같은 TS 주석 사용 허용
    'react-native/no-inline-styles': 'off', // 인라인 스타일(<View style={{...}}>) 허용

    // 4. 기타 설정
    '@typescript-eslint/no-var-requires': 'off', // require() 문법 사용 허용 (설정 파일 대응)
  },
}
