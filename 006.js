function compressAndDownloadImage(compressionLevel = 0.5) {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions to match image size
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw the image on the canvas
            ctx.drawImage(img, 0, 0);

            // Convert canvas to compressed data URL
            const compressedImg = canvas.toDataURL(img.src, compressionLevel);

            // Create a link to download the compressed image
            const link = document.createElement('a');
            link.download = `compressed-${file.name}`;
            link.href = compressedImg;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}