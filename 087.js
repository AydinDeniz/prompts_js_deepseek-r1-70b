// File upload feature

const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');

// File validation configuration
const VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'application/doc', 'application/docx'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// File upload handler
async function handleFileUpload(event) {
  event.preventDefault();
  const file = fileInput.files[0];

  if (!file) {
    alert('Please select a file to upload.');
    return;
  }

  // Validate file type
  if (!VALID_FILE_TYPES.includes(file.type)) {
    alert(`Invalid file type. Supported types: ${VALID_FILE_TYPES.join(', ')}`);
    return;
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    alert(`File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    return;
  }

  try {
    // Show upload progress
    uploadProgress.style.display = 'block';

    // Read file contents
    const reader = new FileReader();
    reader.onprogress = (event) => {
      const progress = (event.loaded / event.total) * 100;
      uploadProgress.value = progress;
    };

    reader.onload = async (event) => {
      const fileData = event.target.result;
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('File uploaded successfully:', data);
        alert('File uploaded successfully!');
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file. Please try again.');
      }
    };

    reader.readAsBinaryString(file);
  } catch (error) {
    console.error('Error reading file:', error);
    alert('Error reading file. Please try again.');
  }
}

// Initialize file upload
uploadForm.addEventListener('submit', handleFileUpload);

// Reset form after upload
uploadForm.addEventListener('reset', () => {
  uploadProgress.style.display = 'none';
  uploadProgress.value = 0;
});
const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
const port = process.env.PORT || 3000;

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Process uploaded file
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Validate file type and size on server
    if (!VALID_FILE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type.' });
    }

    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File size exceeds limit.' });
    }

    // Store file securely
    const storedPath = await storeFileSecurely(filePath, fileName);

    res.status(200).json({
      message: 'File uploaded successfully.',
      fileName: fileName,
      storedPath: storedPath
    });

  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).json({ error: 'Failed to process file.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});