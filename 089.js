// WebSocket server setup

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Store active clients
const clients = new Map();

// Handle new connections
wss.on('connection', (ws) => {
  console.log('New client connected');

  // Handle incoming messages
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Received:', data);

    // Broadcast message to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          sender: data.sender,
          message: data.message,
          timestamp: new Date().toISOString()
        }));
      }
    });
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('Error occurred:', error);
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:8080');
// WebSocket client setup

const ws = new WebSocket('ws://localhost:8080');

// Handle incoming messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received message:', data);
  // Update chat interface with new message
};

// Handle connection open
ws.onopen = () => {
  console.log('Connected to the WebSocket server');
  // Send initial message or setup
};

// Handle connection close
ws.onclose = () => {
  console.log('Disconnected from the WebSocket server');
};

// Handle errors
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Send message function
function sendMessage(sender, message) {
  const data = {
    sender,
    message,
    timestamp: new Date().toISOString()
  };
  ws.send(JSON.stringify(data));
}
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Received:', data);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          sender: data.sender,
          message: data.message,
          timestamp: new Date().toISOString()
        }));
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:8080');
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const chatMessages = document.getElementById('chatMessages');
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.textContent = `${data.sender}: ${data.message}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

function sendMessage(sender, message) {
  const data = {
    sender,
    message,
    timestamp: new Date().toISOString()
  };
  ws.send(JSON.stringify(data));
}