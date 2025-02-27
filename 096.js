// file-upload.js
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const clamscan = require('clamscan');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const winston = require('winston');

const app = express();
const upload = multer();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'upload.log' })
  ]
});

// Virus scanner setup
const scanner = new clamscan.Scanner({
  host: 'localhost',
  port: 3310,
  socket: true
});

// Rate limiter
const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 60, // per minute
  blockDuration: 900 // 15 minutes
});

// Temporary storage
const tempStorage = new Map();

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

// Middlewares
app.use(express.json());
app.use(rateLimiter.getMiddleware());

// Routes
app.post('/upload', upload.single('file'), handleFileUpload);
app.post('/chunk', handleChunkUpload);
app.get('/status/:uploadId', checkUploadStatus);
app.get('/download/:uploadId', handleDownload);

// Handle file upload
async function handleFileUpload(req, res) {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'File size exceeds limit' });
    }

    // Generate upload ID
    const uploadId = uuidv4();
    tempStorage.set(uploadId, {
      file: file.buffer,
      chunks: [],
      scanning: false,
      downloadReady: false
    });

    logger.info(`File upload started: ${uploadId}`);

    res.status(201).json({ uploadId });
  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
}

// Handle chunked upload
async function handleChunkUpload(req, res) {
  try {
    const { uploadId, chunkIndex, chunkData } = req.body;
    if (!uploadId || chunkIndex === undefined || !chunkData) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const upload = tempStorage.get(uploadId);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    if (chunkData.length > MAX_CHUNK_SIZE) {
      return res.status(413).json({ error: 'Chunk size exceeds limit' });
    }

    upload.chunks[chunkIndex] = chunkData;
    upload.file = Buffer.concat([upload.file, chunkData]);

    logger.info(`Chunk uploaded: ${uploadId} - Chunk ${chunkIndex}`);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling chunk upload:', error);
    res.status(500).json({ error: 'Chunk upload failed' });
  }
}

// Check upload status
async function checkUploadStatus(req, res) {
  try {
    const { uploadId } = req.params;
    const upload = tempStorage.get(uploadId);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.status(200).json({
      status: upload.scanning ? 'scanning' : 'ready',
      progress: upload.chunks.length / upload.chunks.total
    });
  } catch (error) {
    console.error('Error checking upload status:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
}

// Handle file download
async function handleDownload(req, res) {
  try {
    const { uploadId } = req.params;
    const upload = tempStorage.get(uploadId);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    if (!upload.downloadReady) {
      return res.status(400).json({ error: 'Download not ready' });
    }

    const file = upload.file;
    const fileName = `file-${uploadId}.${file.originalname.split('.').pop()}`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', file.mimetype);
    res.send(file);
  } catch (error) {
    console.error('Error handling file download:', error);
    res.status(500).json({ error: 'Download failed' });
  }
}

// Virus scanning
async function scanFile(file) {
  try {
    const scanResult = await scanner.scan(file);
    if (scanResult.isInfected) {
      throw new Error('Malware detected in file');
    }
    return true;
  } catch (error) {
    console.error('Error scanning file:', error);
    throw error;
  }
}

// Metadata stripping
async function stripMetadata(file) {
  try {
    // Implement metadata stripping logic here
    return file;
  } catch (error) {
    console.error('Error stripping metadata:', error);
    throw error;
  }
}

// Finalize upload
async function finalizeUpload(uploadId) {
  try {
    const upload = tempStorage.get(uploadId);
    if (!upload) {
      throw new Error('Upload not found');
    }

    if (upload.scanning) {
      throw new Error('Scan in progress');
    }

    // Store file permanently
    const fileId = uuidv4();
    const filePath = path.join(__dirname, 'uploads', fileId);
    fs.writeFileSync(filePath, upload.file);

    upload.downloadReady = true;
    tempStorage.set(uploadId, upload);

    return { fileId, filePath };
  } catch (error) {
    console.error('Error finalizing upload:', error);
    throw error;
  }
}

module.exports = app;