// file-transfer.js
const fs = require('fs');
const path = require('path');
const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const multer = require('multer');

class FileTransfer {
  constructor() {
    this.wss = null;
    this.activeTransfers = new Map();
    this.chunkSize = 1024 * 1024; // 1MB chunks
  }

  init(server) {
    this.wss = new WebSocket.Server({ server });
    this.setupRoutes();
    this.handleConnections();
  }

  setupRoutes() {
    const router = express.Router();
    const upload = multer({ dest: 'uploads/' });

    router.post('/upload', upload.single('file'), (req, res) => {
      res.json({ filename: req.file.filename });
    });

    router.get('/download/:filename', (req, res) => {
      const filename = req.params.filename;
      res.download(path.join(__dirname, 'uploads', filename));
    });

    return router;
  }

  handleConnections() {
    this.wss.on('connection', (ws) => {
      console.log('New client connected');

      ws.on('close', () => {
        console.log('Client disconnected');
      });

      ws.on('message', (message) => {
        const data = JSON.parse(message);
        switch (data.type) {
          case 'start-transfer':
            this.handleStartTransfer(ws, data);
            break;
          case 'file-chunk':
            this.handleFileChunk(ws, data);
            break;
          case 'resume-transfer':
            this.handleResumeTransfer(ws, data);
            break;
          default:
            console.log('Unknown message type');
        }
      });
    });
  }

  handleStartTransfer(ws, data) {
    try {
      const { filename, fileSize, fileHash } = data;
      if (!filename || !fileSize || !fileHash) {
        throw new Error('Invalid transfer request');
      }

      const transferId = crypto.randomBytes(16).toString('hex');
      const filePath = path.join(__dirname, 'uploads', filename);
      const progress = {
        receivedBytes: 0,
        chunks: {},
        fileHash: fileHash,
        filePath: filePath,
        fileSize: fileSize
      };

      this.activeTransfers.set(transferId, progress);
      ws.send(JSON.stringify({
        type: 'transfer-id',
        transferId: transferId
      }));
    } catch (error) {
      console.error('Error handling start transfer:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  }

  handleFileChunk(ws, data) {
    try {
      const { transferId, chunkIndex, chunkData, chunkHash } = data;
      const progress = this.activeTransfers.get(transferId);
      if (!progress) {
        throw new Error('Transfer not found');
      }

      const chunkBuffer = Buffer.from(chunkData, 'base64');
      const chunkPath = path.join(__dirname, 'uploads', `.${transferId}.${chunkIndex}`);
      fs.writeFileSync(chunkPath, chunkBuffer);

      progress.receivedBytes += chunkBuffer.length;
      progress.chunks[chunkIndex] = true;

      // Verify chunk integrity
      const computedHash = crypto.createHash('sha256').update(chunkBuffer).digest('hex');
      if (computedHash !== chunkHash) {
        throw new Error('Chunk integrity verification failed');
      }

      // Notify client of successful chunk receipt
      ws.send(JSON.stringify({
        type: 'chunk-ack',
        transferId: transferId,
        chunkIndex: chunkIndex
      }));

      // Check if transfer is complete
      if (progress.receivedBytes >= progress.fileSize) {
        this.finalizeTransfer(progress);
      }
    } catch (error) {
      console.error('Error handling file chunk:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  }

  handleResumeTransfer(ws, data) {
    try {
      const { transferId } = data;
      const progress = this.activeTransfers.get(transferId);
      if (!progress) {
        throw new Error('Transfer not found');
      }

      // Send existing chunks to client
      const response = {
        type: 'resume-response',
        transferId: transferId,
        chunks: Object.keys(progress.chunks)
      };
      ws.send(JSON.stringify(response));
    } catch (error) {
      console.error('Error handling resume transfer:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  }

  finalizeTransfer(progress) {
    try {
      const chunks = Object.keys(progress.chunks).map(chunkIndex => {
        const chunkPath = path.join(__dirname, 'uploads', `.${progress.transferId}.${chunkIndex}`);
        return fs.readFileSync(chunkPath);
      });

      const fileBuffer = Buffer.concat(chunks);
      fs.writeFileSync(progress.filePath, fileBuffer);

      // Verify final file integrity
      const computedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      if (computedHash !== progress.fileHash) {
        throw new Error('Final file integrity verification failed');
      }

      // Clean up chunks
      Object.keys(progress.chunks).forEach(chunkIndex => {
        const chunkPath = path.join(__dirname, 'uploads', `.${progress.transferId}.${chunkIndex}`);
        fs.unlinkSync(chunkPath);
      });

      this.activeTransfers.delete(progress.transferId);
    } catch (error) {
      console.error('Error finalizing transfer:', error);
      throw error;
    }
  }
}

module.exports = FileTransfer;