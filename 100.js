// document-sharing.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const app = express();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'document.log' })
  ]
});

// Configuration
const encryptionAlgorithm = 'aes-256-cbc';
const keyRotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days
const watermarkText = 'CONFIDENTIAL';

// In-memory storage for demonstration
const documents = new Map();

// Middlewares
app.use(express.json());

// Routes
app.post('/upload', uploadDocument);
app.post('/share', shareDocument);
app.get('/view/:docId', viewDocument);
app.get('/download/:docId', downloadDocument);
app.get('/revoke/:docId', revokeAccess);

// Document upload
async function uploadDocument(req, res) {
  try {
    const { file, permissions } = req.body;
    if (!file || !permissions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate document ID
    const docId = uuidv4();
    
    // Encrypt document
    const encryptedFile = await encryptFile(file, docId);
    
    // Generate watermark
    const watermarkedFile = await applyWatermark(encryptedFile, docId);
    
    // Set permissions
    const permissionsObj = {
      owner: req.user.id,
      viewers: permissions.viewers || [],
      editors: permissions.editors || []
    };

    // Store document metadata
    documents.set(docId, {
      fileId: docId,
      filename: file.originalname,
      permissions: permissionsObj,
      encryptionKey: crypto.randomBytes(32).toString('hex'),
      uploadedAt: new Date().toISOString()
    });

    logger.info(`Document uploaded: ${docId}`);

    res.status(201).json({ docId });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}

// Document sharing
async function shareDocument(req, res) {
  try {
    const { docId, users }    = req.body;
    if (!docId || !users) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const document = documents.get(docId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Validate permissions
    if (!document.permissions.owner === req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Add users to permissions
    document.permissions.viewers.push(...users);
    documents.set(docId, document);

    logger.info(`Document shared: ${docId}`);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sharing document:', error);
    res.status(500).json({ error: 'Share failed' });
  }
}

// Document viewing
async function viewDocument(req, res) {
  try {
    const { docId } = req.params;
    if (!docId) {
      return res.status(400).json({ error: 'Missing document ID' });
    }

    const document = documents.get(docId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check permissions
    if (!document.permissions.viewers.includes(req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Decrypt and serve document
    const decryptedFile = await decryptFile(document.fileId);
    const stream = fs.createReadStream(decryptedFile);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    stream.pipe(res);
  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({ error: 'View failed' });
  }
}

// Document download
async function downloadDocument(req, res) {
  try {
    const { docId } = req.params;
    if (!docId) {
      return res.status(400).json({ error: 'Missing document ID' });
    }

    const document = documents.get(docId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check permissions
    if (!document.permissions.viewers.includes(req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Decrypt and serve document
    const decryptedFile = await decryptFile(document.fileId);
    const stream = fs.createReadStream(decryptedFile);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    stream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Download failed' });
  }
}

// Revoke access
async function revokeAccess(req, res) {
  try {
    const { docId } = req.params;
    if (!docId) {
      return res.status(400).json({ error: 'Missing document ID' });
    }

    const document = documents.get(docId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Validate ownership
    if (!document.permissions.owner === req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Revoke all permissions
    document.permissions.viewers = [];
    document.permissions.editors = [];
    documents.set(docId, document);

    logger.info(`Access revoked: ${docId}`);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error revoking access:', error);
    res.status(500).json({ error: 'Revoke failed' });
  }
}

// File encryption/decryption
async function encryptFile(file, docId) {
  try {
    const key = crypto.createCipheriv(encryptionAlgorithm, document.encryptionKey, crypto.randomBytes(16));
    const encrypted = key.update(file.buffer, 'utf8', 'hex') + key.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Error encrypting file:', error);
    throw error;
  }
}

async function decryptFile(docId) {
  try {
    const document = documents.get(docId);
    if (!document) {
      throw new Error('Document not found');
    }

    const key = crypto.createDecipheriv(encryptionAlgorithm, document.encryptionKey, crypto.randomBytes(16));
    const decrypted = key.update(document.fileId, 'hex', 'utf8') + key.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Error decrypting file:', error);
    throw error;
  }
}

// Watermark application
async function applyWatermark(encryptedFile, docId) {
  try {
    // Implement watermarking logic
    return encryptedFile;
  } catch (error) {
    console.error('Error applying watermark:', error);
    throw error;
  }
}

// Key rotation
async function rotateKeys() {
  try {
    const now = new Date().getTime();
    documents.forEach((document) => {
      if (now - document.uploadedAt > keyRotationInterval) {
        const newKey = crypto.randomBytes(32).toString('hex');
        document.encryptionKey = newKey;
        // Update document with new key
      }
    });
  } catch (error) {
    console.error('Error rotating keys:', error);
  }
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Document sharing server running on port ${port}`);
});