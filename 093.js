// password-manager.js
const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const browserExtension = require('./extension');

class PasswordManager {
  constructor() {
    this.masterKey = null;
    this.salt = crypto.randomBytes(16);
    this.kdf = {
      type: 'pbkdf2',
      iterations: 100000,
      keylen: 32,
      digest: 'sha256'
    };
  }

  async init() {
    try {
      await this.connectToDatabase();
      await this.initializeBrowserExtension();
      await this.setupServer();
    } catch (error) {
      console.error('Error initializing password manager:', error);
    }
  }

  async connectToDatabase() {
    await mongoose.connect('mongodb://localhost/passwords', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  async initializeBrowserExtension() {
    browserExtension.on('request', (request, sender, sendResponse) => {
      if (request.action === 'fillCredentials') {
        this.fillCredentials(request, sender, sendResponse);
      }
    });
  }

  async setupServer() {
    const app = express();
    app.use(express.json());

    app.post('/sync', this.handleSync.bind(this));
    app.post('/share', this.handleShare.bind(this));
    app.post('/monitor', this.handleMonitor.bind(this));

    app.listen(3000, () => {
      console.log('Password manager server running on port 3000');
    });
  }

  async handleSync(data) {
    try {
      const encryptedData = data.encryptedData;
      const decryptedData = await this.decrypt(encryptedData, this.masterKey);
      await this.storeCredentials(decryptedData);
      return { success: true };
    } catch (error) {
      console.error('Error syncing data:', error);
      return { error: 'Sync failed' };
    }
  }

  async handleShare(recipient) {
    try {
      const shareKey = await this.generateShareKey();
      const encryptedCredentials = await this.encryptCredentials(shareKey);
      await this.sendShareNotification(recipient, shareKey);
      return { success: true };
    } catch (error) {
      console.error('Error sharing credentials:', error);
      return { error: 'Share failed' };
    }
  }

  async handleMonitor() {
    try {
      const breachData = await this.checkBreaches();
      return { breaches: breachData };
    } catch (error) {
      console.error('Error monitoring breaches:', error);
      return { error: 'Monitoring failed' };
    }
  }

  async decrypt(encryptedData, key) {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const encrypted = Buffer.from(encryptedData.encrypted, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted.toString('binary'), 'binary', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  async encrypt(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'binary');
    encrypted += cipher.final('binary');
    return {
      iv: iv.toString('hex'),
      encrypted: encrypted.toString('hex')
    };
  }

  async generateMasterKey(password) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, this.salt, this.kdf.iterations, this.kdf.keylen, this.kdf.digest, (err, key) => {
        if (err) reject(err);
        else resolve(key);
      });
    });
  }

  async deriveKey(password) {
    this.masterKey = await this.generateMasterKey(password);
  }

  async storeCredentials(credentials) {
    try {
      const encryptedCredentials = await this.encrypt(credentials, this.masterKey);
      await mongoose.model('Credentials').create(encryptedCredentials);
    } catch (error) {
      console.error('Error storing credentials:', error);
    }
  }

  async fillCredentials(request, sender, sendResponse) {
    try {
      const credentials = await this.getCredentials(request.url);
      sendResponse({ credentials });
    } catch (error) {
      console.error('Error filling credentials:', error);
      sendResponse({ error: 'Failed to retrieve credentials' });
    }
  }

  async getCredentials(url) {
    try {
      const result = await mongoose.model('Credentials').find({ url });
      return result.map(credential => ({
        username: credential.username,
        password: credential.password
      }));
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return [];
    }
  }

  async generateShareKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendShareNotification(recipient, shareKey) {
    try {
      const notification = {
        type: 'share',
        key: shareKey,
        sender: this.masterKey.toString('hex')
      };
      await mongoose.model('Notifications').create(notification);
    } catch (error) {
      console.error('Error sending share notification:', error);
    }
  }

  async checkBreaches() {
    try {
      const breaches = await fetch('https://haveibeenpwned.com/api/v3/breachedaccount/' + this.masterKey.toString('hex'));
      return await breaches.json();
    } catch (error) {
      console.error('Error checking breaches:', error);
      return [];
    }
  }
}

module.exports = PasswordManager;