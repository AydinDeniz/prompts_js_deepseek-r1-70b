function compressImage(file, compressionLevel, imageOrientation = 'landscape') {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'compressed-image.png';

        reader.onload = function(e) {
            img.src = e.target.result;
            img.onload = function() {
                // Set image dimensions based on compression level
                const originalWidth = img.width;
                const originalHeight = img.height;

                // Calculate new dimensions based on compression level
                const maxDimension = Math.max(originalWidth, originalHeight);
                const compressionRatio = 100 / (100 - compressionLevel);
                const maxAllowed = maxDimension * (compressionLevel / 100);

                let newWidth, newHeight;
                if (imageOrientation === 'portrait') {
                    newWidth = originalHeight;
                    newHeight = originalWidth;
                } else {
                    newWidth = originalWidth;
                    newHeight = originalHeight;
                }

                // Maintain aspect ratio while applying compression
                if (newWidth > maxAllowed) {
                    newWidth = maxAllowed;
                    newHeight = newWidth / originalWidth * originalHeight;
                } else if (newHeight > maxAllowed) {
                    newHeight = maxAllowed;
                    newWidth = newHeight / originalHeight * originalWidth;
                }

                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                // Convert canvas to data URL
                const dataUrl = canvas.toDataURL('image/png', 0.9); // Quality parameter
                downloadLink.href = dataUrl;
                downloadLink.click();
                resolve({ success: true, dataUrl: dataUrl });
            };
        };

        reader.readAsDataURL(file);
    });
}

// Usage example:
// compressImage(fileInput, 50) // Compress by 50% (reduce dimensions by 50%)
// compressImage(fileInput, 90) // Very compressed image
// compressImage(fileInput, 1)  // Almost full size image

// Initialize the file input and download link
const fileInput = document.querySelector('input[type="file"]');
const downloadLink = document.querySelector('a');

fileInput.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        compressImage(file, document.querySelector('input[type="range"]').value,
            document.querySelector('select').value === 'portrait' ? 'portrait' : 'landscape')
            .then(({ success, dataUrl }) => {
                if (success) {
                    downloadLink.href = dataUrl;
                    downloadLink.download = 'compressed-image.png';
                    downloadLink.click();
                } else {
                    alert('Error compressing image');
                }
            });
    }
});