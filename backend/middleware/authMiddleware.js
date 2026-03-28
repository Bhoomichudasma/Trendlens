const jwt = require('jsonwebtoken');

// Verify JWT Token middleware
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('[Auth Middleware] Token verification error:', err.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      // Attach userId to request
      req.userId = decoded.userId;
      next();
    });
  } catch (err) {
    console.error('[Auth Middleware] Error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Optional token middleware (doesn't fail if no token, but sets userId if valid)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (!err) {
          req.userId = decoded.userId;
        }
      });
    }

    next();
  } catch (err) {
    next(); // Continue without userId
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
};
