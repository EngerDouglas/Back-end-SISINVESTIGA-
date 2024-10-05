import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  logger.error(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Algo salió mal';
  let errors = err.errors || [];

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación';
    errors = Object.values(err.errors).map(e => e.message);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      errors: errors.length > 0 ? errors : undefined,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
};

export default errorHandler;