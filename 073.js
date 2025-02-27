// Internet connection status and form caching

// Check if online
function isOnline() {
  return navigator.onLine;
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.padding = '10px 20px';
  notification.style.backgroundColor = type === 'error' ? '#ff4444' : '#44ff44';
  notification.style.color = 'white';
  notification.style.borderRadius = '5px';
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Cache form inputs
function cacheFormData(formId) {
  const form = document.getElementById(formId);
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  localStorage.setItem('cachedForm', JSON.stringify(data));
  showNotification('Form data cached locally.', 'info');
}

// Sync cached data
async function syncCachedData() {
  const cachedData = localStorage.getItem('cachedForm');
  if (cachedData) {
    try {
      const response = await fetch('/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: cachedData,
      });

      if (response.ok) {
        localStorage.removeItem('cachedForm');
        showNotification('Cached data has been synced with the server.', 'info');
      } else {
        showNotification('Failed to sync data. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      showNotification('Failed to sync data. Please check your connection.', 'error');
    }
  }
}

// Event listeners
window.addEventListener('online', () => {
  showNotification('You are now online.', 'info');
  syncCachedData();
});

window.addEventListener('offline', () => {
  showNotification('You are now offline. Form data will be cached locally.', 'warning');
});

// Form submission handler
document.getElementById('myForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  if (!isOnline()) {
    cacheFormData('myForm');
    showNotification('Form data cached. We will sync when you come back online.', 'info');
    return;
  }

  // Submit form normally
  e.target.submit();
});

// Check initial connection status
if (!isOnline()) {
  showNotification('You are currently offline. Form data will be cached locally.', 'warning');
}
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.post('/submit', (req, res) => {
  console.log('Received form data:', req.body);
  res.status(200).json({ message: 'Data received successfully.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});