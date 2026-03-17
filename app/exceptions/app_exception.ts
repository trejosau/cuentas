export class AppException extends Error {
  constructor(
    message: string,
    public status: number = 400,
    public code: string = 'APP_ERROR'
  ) {
    super(message)
  }
}
