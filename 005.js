const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User } = require('../models/User');

// Middleware for JWT authentication
function authMiddleware(req, res, next) {
    const token = req.headers['x-access-token'];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    jwt.verify(token, process.env.SECRET_KEY, function(err, decoded) {
        if (err) {
            return res.status(401).json({ error: 'Token is invalid' });
        }
        const user = decoded.user;

        // Store the token in the database or secure storage
        // For this example, we'll store it in memory
        const storedToken = {
            id: user.id,
            token: token,
            expiration: decoded.exp * 1000 // Convert to milliseconds
        };

        // Attach the user to the request
        req.user = user;
        req.storedToken = storedToken;

        next();
    });
}

// Routes for authentication
router.get('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'Username not found' });
        }

        // Verify password
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Create and return JWT token
        const token = jwt.sign({
            user: {
                id: user.id,
                username: user.username
            }
        }, process.env.SECRET_KEY, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Protect routes with JWT middleware
router.use('/protected', authMiddleware);

// Example protected route
router.get('/protected', (req, res) => {
    res.json({ message: 'Protected route' });
});

module.exports = router;