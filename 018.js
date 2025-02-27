// File API for video upload
const fileInput = document.getElementById('fileInput');
const fileNameInput = document.getElementById('fileName');
const categorySelect = document.getElementById('categorySelect');
const uploadButton = document.getElementById('uploadButton');
const uploadProgress = document.getElementById('uploadProgress');
const uploadMessages = document.getElementById('uploadMessages');

// Video preview
const preview = document.getElementById('videoPreview');
const previewContainer = document.getElementById('videoPreviewContainer');

// MongoDB connection
const mongoClient = require('mongodb');
const db = new mongoClient.MongoClient('mongodb://localhost:27017/videoUploadDB');

// AWS S3 configuration
const s3 = new AWS.S3({
    accessKeyId: 'your-s3-access-key',
    secretAccessKey: 'your-s3-secret-key',
    region: 'your-region'
});

// Video metadata schema
interface VideoMetadata {
    _id: string;
    title: string;
    description: string;
    category: string;
    uploadedBy: string;
    uploadDate: Date;
    videoUrl: string;
}

// Initialize database
async function initDatabase() {
    try {
        const result = await db.collection('videos').create();
        const result2 = await db.collection('categories').create();
        console.log('Databases initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Handle file selection
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];

    if (file) {
        previewContainer.innerHTML = '';
        const reader = new FileReader();

        reader.onload = function(event) {
            const videoElement = document.createElement('video');
            videoElement.controls = true;
            videoElement.src = event.target.result;
            videoElement.play();
            preview.appendChild(videoElement);
        };

        reader.readAsDataURL(file);
    }
});

// Handle upload
uploadButton.addEventListener('click', async function() {
    if (!fileInput.value) {
        showError('Please select a video file first');
        return;
    }

    const formData = new FormData();
    const videoFile = fileInput.files[0];

    // Add metadata
    const metadata = {
        title: document.getElementById('titleInput').value,
        description: document.getElementById('descriptionInput').value,
        category: document.getElementById('categorySelect').value,
        uploadedBy: 'user' // Replace with actual user ID
    };

    // Add video file
    formData.append('video', videoFile);

    // Add metadata to FormData
    formData.append('metadata', JSON.stringify(metadata));

    // Upload to S3
    const upload = s3.put({
        Bucket: 'your-aws-s3-bucket',
        Key: `${Date.now()}-${videoFile.name}`,
        ContentType: 'video/mp4',
        Body: formData
    }).on('complete', function(response) {
        if (response.error) {
            showError(response.error);
        } else {
            uploadMessages.textContent = 'Upload completed successfully!';
            uploadMessages.style.color = 'green';

            // Store metadata in MongoDB
            try {
                const result = await db.collection('videos').insertOne({
                    _id: `${Date.now()}`,
                    ...metadata,
                    videoUrl: `https://your-aws-s3-bucket/key/${metadata._id}`
                });
                if (result) {
                    showSuccess('Video uploaded successfully!');
                    window.location.reload();
                } else {
                    showError('Failed to save video metadata');
                }
            } catch (error) {
                showError('Failed to save video metadata');
            }
        }
    });

    uploadMessages.textContent = 'Uploading video...';
    uploadMessages.style.color = 'black';
});

// Handle upload progress
uploadButton.addEventListener('progress', function(e) {
    if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        uploadProgress.style.width = `${progress}%`;
        uploadProgress.textContent = `${Math.round(progress)}%`;
    }
});

// Handle upload error
uploadButton.addEventListener('error', function(e) {
    showError('Upload failed due to network error');
});

// Close preview
previewContainer.addEventListener('click', function() {
    previewContainer.style.display = 'none';
});

// Show error messages
function showError(message) {
    uploadMessages.textContent = message;
    uploadMessages.style.color = 'red';
}

// Show success messages
function showSuccess(message) {
    uploadMessages.textContent = message;
    uploadMessages.style.color = 'green';
    setTimeout(() => {
        uploadMessages.style.color = 'black';
        uploadMessages.textContent = '';
    }, 3000);
}

// Initialize
initDatabase();