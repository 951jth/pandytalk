export interface Group {
  id: string
  uid: string
  name: string
  createdAt: FirebaseFirestore.Timestamp
  memo?: string
  ownerId?: string
  ownerName?: string
  photoURL?: string
  members?: GroupMembers[]
  memberCount?: number
  //   memberCount: number;
  //   settings?: { allowDM?: boolean };
}

export interface GroupMembers {
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  isActive: boolean
  joinedAt: FirebaseFirestore.Timestamp
  leftAt?: number | null
}
