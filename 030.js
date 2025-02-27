// Import required libraries
import { create } from 'ipfs-http-client';
import { ethers } from 'ethers';

// Connect to IPFS
const ipfs = create('https://ipfs.infura.io:5001/api/v0');

// Connect to blockchain provider
const provider = new ethers.providers.Web3Provider(window.ethereum);

// File upload function
async function uploadFile(file) {
  try {
    const added = await ipfs.add(file);
    const ipfsHash = added.path;
    return ipfsHash;
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

// Share file function
async function shareFile(ipfsHash, recipientAddress) {
  try {
    // Smart contract interaction
    const contract = new ethers.Contract(
      '0x...ContractAddress',
      ['function shareFile(string memory _fileHash, address _recipient) public'],
      provider.getSigner()
    );
    const tx = await contract.shareFile(ipfsHash, recipientAddress);
    await tx.wait();
    console.log('File shared successfully');
  } catch (error) {
    console.error('Error sharing file:', error);
  }
}

// Access control function
async function checkAccess(ipfsHash) {
  try {
    const contract = new ethers.Contract(
      '0x...ContractAddress',
      ['function checkAccess(string memory _fileHash) public view returns (bool)'],
      provider.getSigner()
    );
    const hasAccess = await contract.checkAccess(ipfsHash);
    return hasAccess;
  } catch (error) {
    console.error('Error checking access:', error);
  }
}
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/storage', { useNewUrlParser: true, useUnifiedTopology: true });

// User model
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  files: Array
});

const User = mongoose.model('User', userSchema);

// File model
const fileSchema = new mongoose.Schema({
  filename: String,
  ipfsHash: String,
  owner: String,
  sharedWith: Array
});

const File = mongoose.model('File', fileSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Authentication routes
app.post('/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Add password verification logic
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// File management routes
app.post('/upload', async (req, res) => {
  try {
    const file = req.files.file;
    const ipfsHash = await uploadFileToIPFS(file.data);
    const fileDoc = new File({
      filename: file.name,
      ipfsHash: ipfsHash,
      owner: req.user._id,
      sharedWith: []
    });
    await fileDoc.save();
    res.json(fileDoc);
  } catch (err) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

app.get('/files', async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve files' });
  }
});

app.post('/share', async (req, res) => {
  try {
    const file = await File.findById(req.body.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });
    // Add sharing logic using blockchain
    res.json({ message: 'File shared successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Sharing failed' });
  }
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
async function uploadFileToIPFS(fileBuffer) {
  try {
    const added = await ipfs.add(fileBuffer);
    return added.path;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
  }
}