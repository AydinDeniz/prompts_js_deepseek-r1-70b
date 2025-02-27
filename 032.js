// Initialize speech recognition
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;

// Handle voice commands
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  processCommand(transcript);
};

// Process voice commands
function processCommand(command) {
  switch(command.toLowerCase()) {
    case 'turn on lights':
      toggleDevice('lights', true);
      break;
    case 'turn off lights':
      toggleDevice('lights', false);
      break;
    case 'what is the temperature':
      getSensorData('temperature');
      break;
    // Add more commands as needed
  }
}

// Start listening
document.getElementById('listen').addEventListener('click', () => {
  recognition.start();
});

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Mock IoT devices
const devices = {
  lights: false,
  thermostat: 20
};

// Handle device control
function toggleDevice(deviceId, state) {
  devices[deviceId] = state;
  io.emit('deviceUpdate', { [deviceId]: state });
}

function getSensorData(sensorId) {
  // Return mock sensor data
  return devices[sensorId];
}

// Websocket communication
io.on('connection', (socket) => {
  console.log('User connected');
  
  socket.on('toggleDevice', (data) => {
    toggleDevice(data.deviceId, data.state);
  });
  
  socket.on('getSensorData', (sensorId) => {
    socket.emit('sensorData', getSensorData(sensorId));
  });
});

app.use(express.static('public'));
server.listen(3000, () => {
  console.log('Server is running on port 3000');
});