// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5",
    "mongodb": "^4.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-dropzone": "^12.0.7",
    "axios": "^0.21.1"
  }
}

// Backend server (server.js)
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost/imagegallery', { useNewUrlParser: true, useUnifiedTopology: true });

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// API endpoints
app.post('/api/upload', upload.array('images'), (req, res) => {
  try {
    const images = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      uploadDate: Date.now()
    }));
    res.status(201).json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/images', async (req, res) => {
  try {
    const images = await Image.find().exec();
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Image model (image.js)
const imageSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  uploadDate: Date
});

const Image = mongoose.model('Image', imageSchema);

// React component (App.js)
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

function ImageGallery() {
  const [images, setImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await axios.post('http://localhost:3000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadedImages(response.data);
    } catch (error) {
      console.error('Error uploading images:', error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    }
  });

  useEffect(() => {
    axios.get('http://localhost:3000/api/images')
      .then(response => {
        setImages(response.data);
      })
      .catch(error => {
        console.error('Error fetching images:', error);
      });
  }, []);

  const handleReorder = (newOrder) => {
    setImages(newOrder);
  };

  return (
    <div className="image-gallery">
      <h1>Image Gallery</h1>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {
          isDragActive ? <p>Drop the images here...</p> : <p>Drag and drop images here, or click to select files</p>
        }
      </div>
      <div className="uploaded-images">
        <h2>Uploaded Images</h2>
        <div className="images-container">
          {uploadedImages.map((image, index) => (
            <div key={index} className="image-item">
              <img src={`uploads/${image.filename}`} alt={image.originalname} />
            </div>
          ))}
        </div>
      </div>
      <div className="gallery-images">
        <h2>Gallery Images</h2>
        <div className="images-container">
          {images.map((image, index) => (
            <div key={index} className="image-item">
              <img src={`uploads/${image.filename}`} alt={image.originalname} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ImageGallery;