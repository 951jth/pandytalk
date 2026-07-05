import type {User} from '@app/shared/types/auth'
import type {ChatRoom} from '@app/shared/types/chat'

export type ChatItemWithMemberInfo = ChatRoom & {findMember: User}
