// src/middleware/errorHandler.js
function errorHandler(err, req, res, next) {
    console.error(err.stack); // You can replace this with a logger later
  
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';
  
    res.status(statusCode).json({
      error: true,
      message,
    });
  }
  
  module.exports = errorHandler;
  