const errorHandler = (err, req, res, next) => {
  console.error('[ERROR HANDLER]', err.message || err);
  
  // Log the stack trace in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR STACK]', err.stack);
  }
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID',
      message: 'The provided ID is invalid'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate Entry',
      message: 'An entry with this data already exists'
    });
  }
  
  // Handle timeout errors
  if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
    return res.status(408).json({
      success: false,
      error: 'Request Timeout',
      message: 'The request took too long to complete. Please try again.'
    });
  }
  
  // Handle network errors
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Unable to connect to external service. Please try again later.'
    });
  }
  
  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.error || 'Server Error',
    message: err.message || 'Something went wrong on the server'
  });
};

module.exports = errorHandler;