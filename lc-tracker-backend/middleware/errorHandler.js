module.exports = function errorHandler(err, req, res, next) {
  console.error('[LC Tracker API]', err);
  const status = err.status || 500;
  res.status(status).json({ success: false, error: err.message || 'Internal server error' });
};
