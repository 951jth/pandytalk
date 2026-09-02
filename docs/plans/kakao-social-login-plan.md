# 카카오 소셜 로그인 추가 구상

## 목적

팬디톡에 카카오 소셜 로그인을 추가할 때 필요한 구조 변경 범위와 권장 구현 순서를 정리한다.

현재 앱은 Firebase Auth의 이메일/비밀번호 로그인을 기준으로 구성되어 있으며, `auth.currentUser.uid`를 기준으로 AuthGate, Firestore 프로필, 승인 상태를 연결한다. 따라서 카카오 로그인도 최종적으로는 Firebase Auth 사용자로 로그인되도록 맞추는 것이 기존 구조와 가장 잘 맞는다.

## 권장 인증 흐름

```text
카카오 로그인 버튼 선택
→ 카카오 SDK로 access token 획득
→ 서버 또는 Cloud Function에 access token 전달
→ 서버에서 카카오 사용자 검증
→ Firebase custom token 발급
→ 앱에서 signInWithCustomToken 실행
→ users/{uid} 프로필 조회
→ 프로필이 없으면 추가 정보 입력/가입 신청 화면으로 이동
→ 프로필 생성 후 accountStatus: pending
→ 관리자 승인 후 기존 AuthGate 통과
```

Firebase Auth가 카카오를 기본 provider로 직접 제공하지 않으므로, 서버에서 Firebase custom token을 발급하는 방식이 가장 안정적이다.

## 주요 변경 범위

### 1. 패키지 및 네이티브 설정

- 카카오 로그인 SDK 추가
- Android Kakao native app key 설정
- Android redirect scheme 설정
- iOS URL Scheme 설정
- iOS `LSApplicationQueriesSchemes` 설정
- Expo prebuild 또는 Bare Workflow 기준 네이티브 설정 반영

네이티브 설정이 포함되므로 OTA 업데이트만으로는 배포할 수 없고, EAS Build 또는 네이티브 빌드가 필요하다.

### 2. Firebase Auth 레이어

대상 후보:

- `app/features/auth/data/authRemote.firebase.ts`
- `app/features/auth/service/authService.ts`

추가할 기능:

- `signInWithCustomToken` 래퍼
- `loginWithKakao` 서비스 함수
- 카카오 로그인 성공/실패 analytics 이벤트

예상 구조:

```text
authService.loginWithKakao()
→ kakaoAuthService.login()
→ backendAuthRemote.exchangeKakaoToken()
→ authRemote.signInWithCustomToken()
```

### 3. 카카오 SDK 연동 레이어

새 파일 후보:

- `app/features/auth/data/kakaoRemote.ts`
- `app/features/auth/service/kakaoAuthService.ts`

역할:

- 카카오 SDK 초기화 또는 로그인 호출
- 카카오 access token 획득
- 사용자가 취소한 로그인과 실제 오류 구분

### 4. 서버 또는 Cloud Function

필수 역할:

- 앱에서 받은 카카오 access token 검증
- 카카오 사용자 정보 조회
- 카카오 고유 id 기준 사용자 식별
- Firebase Admin SDK로 custom token 발급

별도 백엔드가 없다면 Firebase Cloud Functions를 사용하는 방향이 자연스럽다.

주의:

- 앱에서 Firebase custom token을 직접 만들 수 없다.
- 카카오 access token을 신뢰하기 전에 서버에서 반드시 검증해야 한다.
- 카카오 id와 Firebase uid 매핑 정책을 정해야 한다.

### 5. 로그인 화면

대상:

- `app/features/auth/screens/LoginScreen.tsx`
- `app/features/auth/hooks/useLoginScreen.ts`

변경:

- `카카오로 시작하기` 버튼 추가
- 카카오 로그인용 로딩 상태 추가
- 기존 이메일 로그인과 카카오 로그인 실패 메시지 분리

### 6. 가입 신청/추가 정보 입력 흐름

현재 가입 흐름:

```text
email/password 입력
→ Firebase Auth 계정 생성
→ users/{uid} 프로필 생성
→ accountStatus: pending
```

카카오 로그인 추가 후 필요한 흐름:

```text
카카오 로그인 성공
→ Firebase Auth 로그인 완료
→ users/{uid} 조회
→ 프로필이 없으면 추가 정보 입력
→ users/{uid} 프로필 생성
→ accountStatus: pending
```

대상 후보:

- `app/features/user/screens/UserJoinScreen.tsx`
- `app/features/user/hooks/useUserJoinScreen.ts`
- `app/features/user/screens/addUser.form.tsx`
- `app/shared/types/navigate.ts`

선택지:

1. 기존 `UserJoinScreen`에 소셜 가입 모드 추가
2. `SocialJoinScreen` 같은 별도 추가 정보 입력 화면 생성

권장안은 2번이다. 이메일/비밀번호 가입과 카카오 가입은 필요한 입력값과 계정 생성 시점이 다르기 때문에 화면/훅을 분리하는 편이 안전하다.

### 7. User 타입 변경

대상:

- `app/shared/types/auth.ts`

현재 `email`이 필수값이다. 카카오 계정은 이메일 제공 동의가 없거나 이메일이 없을 수 있으므로, provider 기반 구조로 확장하는 것이 좋다.

예상 필드:

```ts
provider: 'email' | 'kakao'
email?: string | null
kakaoId?: string | null
phoneNumber?: string | null
```

`emailVerified`도 이메일 로그인 전용 의미가 강하므로, 소셜 로그인에서는 optional 또는 provider별 처리로 바꾸는 것을 검토한다.

### 8. 관리자/프로필 화면

대상 후보:

- `app/features/user/components/UserManageItem.tsx`
- `app/features/user/screens/setProfiles.form.tsx`
- `app/features/user/screens/updateUser.form.tsx`
- `app/features/user/hooks/useProfileScreen.ts`

변경:

- 이메일이 없을 수 있는 사용자 표시 대응
- provider 표시 여부 결정
- 휴대폰 번호를 받을 경우 표시 우선순위 결정

예상 표시 우선순위:

```text
휴대폰 번호 > 이메일 > 카카오 계정
```

## 데이터 모델 초안

```ts
export interface User {
  uid: string
  displayName: string
  provider: 'email' | 'kakao'
  email?: string | null
  kakaoId?: string | null
  phoneNumber?: string | null
  authority: 'ADMIN' | 'MANAGER' | 'USER' | 'TEST'
  status: 'online' | 'offline'
  accountStatus: 'pending' | 'confirm' | 'reject' | 'stop'
  isConfirmed?: boolean
  photoURL?: string | null
  note: string
  intro: string
  createdAt: FirebaseFirestore.Timestamp | Timestamp | FieldValue | null
  updatedAt?: FirebaseFirestore.Timestamp | Timestamp | FieldValue | null
}
```

## 단계별 구현안

### 1단계: 구조 준비

- `User` 타입에 provider 관련 optional 필드 추가
- 프로필/관리자 화면에서 email 필수 전제 제거
- Firestore 프로필 생성 로직을 provider별로 분기할 수 있게 정리

### 2단계: 서버 토큰 교환 API

- 카카오 access token 검증
- 카카오 사용자 조회
- Firebase custom token 발급
- 카카오 id와 Firebase uid 매핑 정책 확정

### 3단계: 앱 카카오 로그인 연동

- 카카오 SDK 설치 및 네이티브 설정
- 카카오 로그인 버튼 추가
- `signInWithCustomToken` 연동
- 로그인 성공 후 기존 AuthGate 흐름 확인

### 4단계: 소셜 가입 신청 화면

- 카카오 로그인 후 프로필이 없는 사용자를 추가 정보 입력 화면으로 이동
- 닉네임, 신청 메모, 소개, 약관 동의 입력
- `accountStatus: pending` 프로필 생성

### 5단계: 검증

- 신규 카카오 사용자 가입 신청
- 승인 대기 상태 접근 제한
- 승인 후 앱 진입
- 로그아웃/재로그인
- 기존 이메일 사용자 로그인
- 카카오 이메일 미제공 계정
- 카카오 로그인 취소

## 결정이 필요한 사항

- 기존 이메일/비밀번호 로그인 유지 여부
- 카카오 가입 시 휴대폰 번호를 필수로 받을지 여부
- 카카오 이메일을 저장할지 여부
- 카카오 id와 Firebase uid 매핑 컬렉션을 별도로 둘지 여부
- 기존 `UserJoinScreen` 재사용 여부
- 서버를 Cloud Functions로 둘지 별도 API 서버로 둘지 여부

## 현재 기준 추천

- 기존 이메일/비밀번호 로그인은 유지한다.
- 카카오 로그인은 별도 버튼으로 추가한다.
- 카카오 최초 로그인 사용자는 별도 추가 정보 입력 화면으로 보낸다.
- Firestore `User`에는 `provider`, `kakaoId`, `email?`, `phoneNumber?`를 추가한다.
- Firebase custom token 발급은 Cloud Functions에서 처리한다.

