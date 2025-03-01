// Frontend code
const videoInput = document.getElementById('video-input');
const uploadButton = document.getElementById('upload-button');
const progressBar = document.getElementById('progress-bar');
const preview = document.getElementById('preview');

// Initialize AWS S3
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    region: 'your-region',
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key'
});

// MongoDB connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/videos', { useNewUrlParser: true, useUnifiedTopology: true });

// Video schema
const videoSchema = new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    uploadedBy: String,
    videoId: String,
    uploadedAt: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', videoSchema);

// Handle file selection
videoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        preview.src = URL.createObjectURL(file);
        uploadButton.disabled = false;
    }
});

// Upload video
uploadButton.addEventListener('click', async function() {
    const file = videoInput.files[0];
    const formData = new FormData(document.getElementById('upload-form'));
    
    try {
        // Generate unique video ID
        const videoId = Math.random().toString(36).substr(2, 9);
        
        // Upload to S3
        const uploadParams = {
            Bucket: 'your-bucket-name',
            Key: `videos/${videoId}`,
            Body: file,
            ContentType: file.type
        };

        const upload = await s3.upload(uploadParams).promise();
        const videoUrl = upload.Location;

        // Save metadata to MongoDB
        const video = new Video({
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            uploadedBy: 'current-user-id',
            videoId
        });

        await video.save();

        alert('Video uploaded successfully!');
        window.location.reload();
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload video');
    }
});

// Update progress bar
s3.upload(uploadParams, function(err, data) {
    if (err) throw err;
    progressBar.style.width = (data.loaded * 100) / data.total + '%';
});

// Initialize progress
let interval;
s3.upload(uploadParams, function(err, data) {
    if (err) throw err;
    if (data.httpUploadProgress) {
        interval = setInterval(() => {
            progressBar.style.width = 
                (data.httpUploadProgress.loaded * 100) / 
                data.httpUploadProgress.total + '%';
        }, 1000);
    }
}).on('httpUploadProgress', function(progress) {
    if (progress.loaded === progress.total) {
        clearInterval(interval);
        progressBar.style.width = '100%';
    }
});