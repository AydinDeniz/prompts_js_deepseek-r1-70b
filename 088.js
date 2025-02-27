// profile-update.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// Connect to MongoDB
mongoose.connect('mongodb://localhost/users', { useNewUrlParser: true, useUnifiedTopology: true });

// User model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  bio: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = await User.findById(decoded.userId).exec();
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

// Validation middleware
const validateProfileUpdate = [
  check('name').optional().not().isEmpty().withMessage('Name cannot be empty'),
  check('bio').optional().not().isEmpty().withMessage('Bio cannot be empty'),
  check('email').optional().isEmail().withMessage('Invalid email format')
];

// Route handler
router.post('/update-profile', authenticate, validateProfileUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.bio) updates.bio = req.body.bio;

    if (req.body.email && req.user.email !== req.body.email) {
      const emailExists = await User.findOne({ email: req.body.email }).exec();
      if (emailExists) {
        return res.status(400).json({ error: 'Email already exists.' });
      }
    }

    if (req.body.password) {
      const match = await bcrypt.compare(req.body.currentPassword, req.user.password);
      if (!match) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
      updates.password = await bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).exec();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        bio: updatedUser.bio
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;