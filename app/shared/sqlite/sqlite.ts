import SQLite from 'react-native-sqlite-storage'

export const db = SQLite.openDatabase(
  {
    name: 'chat.db',
    location: 'default',
  },
  () => {
    console.log('Database opened successfully')
  },
  (error: any) => {
    console.log('Error opening database', error)
  },
)
