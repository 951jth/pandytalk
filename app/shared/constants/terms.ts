import type {CheckedRecordType} from '@app/features/auth/components/TermAgreementList'

export const terms = [
  {
    id: 'tos',
    title: '서비스 이용약관 동의',
    required: true,
    enabled: true,
    content: `본 서비스의 이용조건과 회원의 권리·의무를 규정합니다.\n
주요 내용:\n①계정 생성·관리, 비밀번호 보호 의무
②타인의 권리를 침해하는 게시·행위 금지(불법·허위·스팸·악성코드 등)
③서비스 변경·중단 및 공지 
④이용제한(약관/법령 위반, 부정 이용 시)
⑤손해배상과 책임 제한(불가항력·제3자 장애 등)
⑥분쟁 해결 절차 및 준거법. 약관에 동의하지 않으면 서비스 이용(게스트 신청 포함)이 제한될 수 있습니다.`,
  },
  {
    id: 'privacy',
    title: '개인정보 수집·이용 동의',
    required: true,
    enabled: true,
    content: `수집·이용 목적: 회원 식별 및 게스트 신청 검토/승인, 고객 문의 응대, 부정 이용 방지, 서비스 제공 기록 유지.
    
수집 항목: 이메일, 비밀번호(해시 처리), 닉네임, 프로필 이미지(선택), 소개/신청 메모, 서비스 이용기록(접속 일시, IP, 기기정보 등).

보유 기간: 회원 탈퇴 시 즉시 파기하며, 관계 법령에 따른 보관이 필요한 경우(계약·결제·민원 처리 기록 등)는 법정 기간 보관 후 파기합니다.\n동의 거부 시 게스트 신청 및 서비스 이용이 제한될 수 있습니다.`,
  },
  //   {
  //     id: 'age14',
  //     title: '만 14세 이상입니다',
  //     required: true,
  //     enabled: true,
  //     content:
  //       '본인은 만 14세 이상임을 확인합니다. 만 14세 미만은 법정대리인 동의 없이는 회원 가입 및 게스트 신청이 제한됩니다. 허위 제출이 확인될 경우 서비스 이용이 제한될 수 있습니다.',
  //   },
  // {
  //   id: 'thirdParty',
  //   title: '개인정보 제3자 제공 동의',
  //   required: false,
  //   enabled: true,
  //   content: `제공받는 자: 서비스 운영에 필요한 관리자/입주사/운영 파트너(승인·출입 관리 등 수행 주체).

  // 제공 목적: 가입 신청 확인 및 승인 처리, 출입/신원 확인, 현장 응대.

  // 제공 항목: 이메일, 닉네임, 프로필 이미지(선택), 신청 메모/소개, 신청 상태(승인/거절), 이용기록 일부(필요 최소한).

  // 보유 기간: 목적 달성 시 즉시 파기하거나, 수신자의 내부 정책 및 법령에 따라 필요한 기간 보관 후 파기합니다.

  // 동의하지 않아도 기본 서비스 이용은 가능하나, 승인이 필요한 공간/서비스의 이용이 제한될 수 있습니다.`,
  // },
]

export const defaultTermsRecord = terms.reduce(
  (acc, obj) => ({
    ...acc,
    [obj.id]: null,
  }),
  {},
)

export const checkRequiredTerm = (checkedRecord: CheckedRecordType) => {
  const findNonChecked = terms
    ?.filter(e => e?.required)
    .some(term => {
      if (checkedRecord?.[term?.id] == null) {
        return true
      }
      return false
    })
  return findNonChecked
}
