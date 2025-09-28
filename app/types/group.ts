export interface Group {
  uid: string
  name: string
  createdAt: FirebaseFirestore.Timestamp
  memo?: string
  ownerId?: string
  ownerName?: string
  photoURL?: string
  //   memberCount: number;
  //   settings?: { allowDM?: boolean };
}
