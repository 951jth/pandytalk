const MESSAGE_TABLE = 'messages' as const
const MESSAGE_COLUMNS = [
  'id',
  'roomId',
  'text',
  'senderId',
  'createdAt',
  'type',
  'imageUrl',
  'seq',
] as const

const MESSAGE_PLACEHOLDERS = MESSAGE_COLUMNS.map(() => '?').join(', ')
const MESSAGE_COLUMN_SQL = MESSAGE_COLUMNS.join(', ')

export const messageRemote = {
  saveMessagesToSQLite: () => {},
}
