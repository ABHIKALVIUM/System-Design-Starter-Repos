// Authentication Middleware
// Validates Bearer token from Authorization header
// Sets req.user if token is valid

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'no_auth',
        message: 'Authorization header missing or invalid'
      }
    });
  }

  const token = authHeader.slice(7); // Remove 'Bearer '

  // Check token in mock cache
  const session = global.mockCache.sessions.get(token);

  if (!session) {
    return res.status(401).json({
      error: {
        code: 'invalid_token',
        message: 'Token not found or expired'
      }
    });
  }

  // Attach user to request
  req.user = session;
  next();
}

module.exports = { authenticate };
