// auth-server.js
const express = require('express');
const jwt = require('jsonwebtoken');
const jwk = require('jose/jwk');
const jws = require('jose/jws');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const winston = require('winston');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Winston for logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'auth.log' })
  ]
});

// Configure rate limiter
const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 60, // per minute
  blockDuration: 900 // 15 minutes
});

// Generate signing keys
const keyStore = jwk.createKeyStore();

async function generateSigningKeys() {
  const key = await keyStore.generate('EC', 'P-256', {
    use: 'sig',
    alg: 'ES256'
  });
  return key;
}

// Token configuration
const tokenConfig = {
  issuer: 'auth-server',
  audience: 'microservices',
  expiresIn: '1h',
  algorithm: 'ES256'
};

// User storage
const users = new Map();

// In-memory token storage
const tokens = new Map();

// Start server
async function startServer() {
  try {
    // Generate initial signing keys
    const signingKey = await generateSigningKeys();
    app.get('/.well-known/jwks.json', (req, res) => {
      res.json(signingKey.toJWKSet());
    });

    // Middleware
    app.use(express.json());
    app.use(rateLimiter.getMiddleware());

    // Routes
    app.post('/token', handleToken);
    app.post('/introspect', introspectToken);
    app.post('/revoke', revokeToken);

    // Start server
    app.listen(port, () => {
      console.log(`Authentication server running on port ${port}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Handle token endpoint
async function handleToken(req, res) {
  try {
    const { grant_type, code, redirect_uri, client_id, client_secret, username, password } = req.body;

    // Validate client credentials
    const client = await validateClient(client_id, client_secret);
    if (!client) {
      return res.status(401).json({ error: 'invalid_client' });
    }

    let token;
    switch (grant_type) {
      case 'authorization_code':
        token = await handleAuthorizationCode(code, redirect_uri);
        break;
      case 'client_credentials':
        token = await handleClientCredentials();
        break;
      case 'password':
        token = await handlePasswordFlow(username, password);
        break;
      default:
        return res.status(400).json({ error: 'unsupported_grant_type' });
    }

    // Generate refresh token
    const refreshToken = await generateRefreshToken();

    // Store tokens
    const tokenId = crypto.randomBytes(16).toString('hex');
    tokens.set(tokenId, {
      token,
      refreshToken,
      expiresAt: Date.now() + tokenConfig.expiresIn * 1000
    });

    // Return token response
    res.status(200).json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: tokenConfig.expiresIn,
      refresh_token: refreshToken
    });

    // Audit log
    logger.info({
      event: 'token_issued',
      grant_type,
      client_id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({
      event: 'token_error',
      grant_type,
      client_id,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'server_error' });
  }
}

// Validate client credentials
async function validateClient(clientId, clientSecret) {
  try {
    const client = await Clients.findOne({ clientId });
    if (!client) {
      return null;
    }
    const match = await bcrypt.compare(clientSecret, client.clientSecret);
    return match ? client : null;
  } catch (error) {
    return null;
  }
}

// Handle authorization code grant
async function handleAuthorizationCode(code, redirectUri) {
  try {
    const authCode = await AuthorizationCodes.findOne({ code });
    if (!authCode) {
      throw new Error('invalid_grant');
    }

    if (authCode.redirectUri !== redirectUri) {
      throw new Error('invalid_grant');
    }

    const user = await Users.findOne({ _id: authCode.userId });
    if (!user) {
      throw new Error('invalid_grant');
    }

    const token = await generateAccessToken(user);
    return token;
  } catch (error) {
    throw error;
  }
}

// Handle client credentials grant
async function handleClientCredentials() {
  try {
    const token = await generateAccessToken();
    return token;
  } catch (error) {
    throw error;
  }
}

// Handle password grant
async function handlePasswordFlow(username, password) {
  try {
    const user = await Users.findOne({ username });
    if (!user) {
      throw new Error('invalid_grant');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error('invalid_grant');
    }

    const token = await generateAccessToken(user);
    return token;
  } catch (error) {
    throw error;
  }
}

// Generate access token
async function generateAccessToken(user = null) {
  try {
    const payload = {
      iss: tokenConfig.issuer,
      aud: tokenConfig.audience,
      exp: Math.floor(Date.now() / 1000) + tokenConfig.expiresIn,
      iat: Math.floor(Date.now() / 1000),
      sub: user ? user._id : null,
      scope: user ? user.roles.join(' ') : 'client'
    };

    const privateKey = await keyStore.get('current');
    const token = await new jws.SignJWS(payload)
      .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
      .sign(privateKey);

    return token;
  } catch (error) {
    throw error;
  }
}

// Generate refresh token
async function generateRefreshToken() {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    return token;
  } catch (error) {
    throw error;
  }
}

// Introspect token
async function introspectToken(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'invalid_request' });
    }

    try {
      const payload = await verifyToken(token);
      res.status(200).json({
        active: true,
        scope: payload.scope,
        exp: payload.exp,
        iat: payload.iat,
        sub: payload.sub
      });
    } catch (error) {
      res.status(200).json({ active: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'server_error' });
  }
}

// Revoke token
async function revokeToken(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'invalid_request' });
    }

    const tokenId = token;
    tokens.delete(tokenId);
    res.status(200).json({ message: 'token revoked' });
  } catch (error) {
    res.status(500).json({ error: 'server_error' });
  }
}

// Verify token
async function verifyToken(token) {
  try {
    const privateKey = await keyStore.get('current');
    const payload = await jws.decode(token, privateKey);
    return payload;
  } catch (error) {
    throw error;
  }
}

// Start server
startServer();