const errorMiddleware = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${new Date().toISOString()}] Error:`, {
    status,
    message,
    path: req.path,
    method: req.method,
    userId: req.user?.userId
  });

  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorMiddleware;
