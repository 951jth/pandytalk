export class NotFoundError extends Error {
  name = 'NotFoundError'
  constructor(message = 'Not found') {
    super(message)
  }
}
