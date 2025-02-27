// Server setup
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');

// Environment variables
const config = {
    port: process.env.PORT || 3000,
    secret: process.env.SECRET_KEY,
    mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/event-registration'
};

// Initialize the server
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define the registration model
const Registration = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    event: {
        type: String,
        required: true
    },
    dietary: {
        type: String,
        default: 'None'
    },
    qrCode: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// API routes
app.get('/api/registration', async (req, res) => {
    try {
        const registrationData = req.body;

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(registrationData.email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check required fields
        if (!registrationData.name || !registrationData.email || !registrationData.event) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if email already exists
        const existingUser = await Registration.findOne({ email: registrationData.email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create and save the registration
        const registration = new Registration(registrationData);
        const savedRegistration = await registration.save();

        console.log('Registration saved:', savedRegistration);

        // Generate QR code
        generateQRCode(savedRegistration._id, (qrCode) => {
            // Send confirmation email
            sendConfirmationEmail(registrationData.email, qrCode, (success) => {
                if (success) {
                    res.json({ success: true, message: 'Registration completed successfully!' });
                } else {
                    res.json({ success: false, error: 'Failed to send confirmation email' });
                }
            });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again later.' });
    }
});

// Generate QR code using a third-party library
const qrcode = require('qrcode');
function generateQRCode(id, callback) {
    qrcode(0, 'M', id, function(err, qr) {
        if (err) {
            console.error('QR code generation failed:', err);
            callback(null);
            return;
        }
        callback(qr.toString());
    });
}

// Send confirmation email using an email service provider
const sendgrid = require('sendgrid');
function sendConfirmationEmail(email, qrCode, callback) {
    const sgMail = new sendgrid.Mail();
    sgMail.setFrom('event@examples.com', 'Event Team');
    sgMail.addRecipient(email, 'Registration QR Code');
    sgMail.setSubject('Event Registration Confirmation');
    sgMail.attach('text/plain', `Your unique QR code for the event is: ${qrCode}`);
    sgMail.send((err, success) => {
        if (success) {
            console.log('Confirmation email sent successfully');
            callback(true);
        } else {
            console.error('Failed to send confirmation email:', err);
            callback(false);
        }
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});