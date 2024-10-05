class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export class BadRequestError extends AppError {
  constructor(message, errors = []) {
    super(message, 400)
    this.errors = errors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message) {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message){
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message){
    super(message, 409)
  }
}

export class InternalServerError extends AppError {
  constructor(message){
    super(message, 500)
  }
}