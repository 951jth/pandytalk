export const isLocalFile = (url: string | null): boolean => {
  if (!url) return false
  else return url.startsWith('file://')
}
