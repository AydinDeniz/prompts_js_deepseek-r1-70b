// session-manager.js
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

class SessionManager {
  constructor(secretKey, options = {}) {
    this.secretKey = secretKey;
    this.tokenExpiration = options.expiration || '1h';
    this.cookieOptions = {
      httpOnly: true,
      secure: options.secure || false,
      maxAge: options.maxAge || 3600000 // 1 hour
    };
  }

  generateToken(user) {
    return jwt.sign({
      userId: user.id,
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + this.getTokenExpiration()
    }, this.secretKey);
  }

  getTokenExpiration() {
    const expiration = this.tokenExpiration;
    const units = expiration.match(/h|d|w|m|s/);
    const value = parseInt(expiration.match(/\d+/));
    
    switch(units[0]) {
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      case 'w':
        return value * 604800;
      case 'm':
        return value * 60;
      case 's':
        return value;
      default:
        return 3600; // Default to 1 hour
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.secretKey);
    } catch (error) {
      return null;
    }
  }

  setTokenResponse(res, token) {
    res.cookie('authToken', token, {
      ...this.cookieOptions,
      httpOnly: true,
      secure: this.cookieOptions.secure
    });
  }

  getTokenFromRequest(req) {
    const token = req.cookies.authToken || req.headers.authorization;
    return token ? token.replace('Bearer ', '') : null;
  }

  setupMiddleware(app) {
    app.use(cookieParser());
    
    app.use(async (req, res, next) => {
      const token = this.getTokenFromRequest(req);
      if (!token) {
        return next();
      }

      const payload = this.verifyToken(token);
      if (!payload) {
        return next();
      }

      req.user = {
        id: payload.userId,
        username: payload.username
      };

      next();
    });
  }

  handleTokenExpiration(res) {
    res.on('finish', () => {
      if (res.statusCode() === 401) {
        res.clearCookie('authToken');
      }
    });
  }

  async refreshSession(req, res) {
    try {
      const token = this.getTokenFromRequest(req);
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const payload = this.verifyToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const newToken = this.generateToken({
        id: payload.userId,
        username: payload.username
      });

      this.setTokenResponse(res, newToken);
      res.status(200).json({ message: 'Session refreshed' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  destroySession(res) {
    res.clearCookie('authToken');
    res.status(200).json({ message: 'Session destroyed' });
  }
}

module.exports = SessionManager;