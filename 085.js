// JSON parser function

function parseJsonRequestBody(request) {
  return new Promise((resolve, reject) => {
    try {
      // Check if request body is empty
      if (!request.body) {
        reject(new Error('Request body is empty.'));
        return;
      }

      // Parse JSON
      const requestBody = JSON.parse(request.body);

      // Validate and normalize nested structures
      const normalizedData = normalizeNestedObjects(requestBody);

      resolve(normalizedData);
    } catch (error) {
      reject(new Error(`Failed to parse JSON: ${error.message}`));
    }
  });
}

// Normalize nested objects
function normalizeNestedObjects(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => normalizeNestedObjects(item));
  }

  // Handle objects
  const normalized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      normalized[key] = normalizeNestedObjects(obj[key]);
    }
  }
  return normalized;
}

// Example usage:
async function handleRequest(request) {
  try {
    const data = await parseJsonRequestBody(request);
    console.log('Parsed data:', data);
    // Process the data
  } catch (error) {
    console.error('Error parsing request:', error);
    // Send error response
  }
}

// Express middleware example:
const express = require('express');
const app = express();

app.use(express.json());
app.post('/api/endpoint', async (req, res) => {
  try {
    const data = await parseJsonRequestBody(req);
    // Process data
    res.status(200).json({ message: 'Data received successfully', data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});