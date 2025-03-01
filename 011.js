const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

// Database connection
mongoose.connect('mongodb://localhost/eventdb', { useNewUrlParser: true, useUnifiedTopology: true });

// Schema
const registrationSchema = new mongoose.Schema({
    name: String,
    email: String,
    event: String,
    dietary: [String],
    qrCode: String,
    date: { type: Date, default: Date.now }
});

const Registration = mongoose.model('Registration', registrationSchema);

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'
    }
});

// Routes
app.post('/register', async (req, res) => {
    try {
        const { name, email, event, dietary } = req.body;

        // Validate inputs
        if (!name || !email || !event) {
            return res.status(400).json({ error: 'Please fill in all required fields' });
        }

        // Generate QR code
        const qrCode = await QRCode.toDataURL(email);

        // Save registration
        const registration = new Registration({
            name,
            email,
            event,
            dietary,
            qrCode
        });

        const saved = await registration.save();

        // Send confirmation email
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Event Registration Confirmation',
            html: `
                <h2>Event Registration Confirmation</h2>
                <p>Dear ${name},</p>
                <p>Thank you for registering for ${event}.</p>
                <p>Please find your QR code below:</p>
                <img src="${qrCode}" alt="QR Code">
                <p>See you at the event!</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            message: 'Registration successful',
            qrCode
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Event registration server running on port ${port}`);
});