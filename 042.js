// Import required libraries
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/agriculture', { useNewUrlParser: true, useUnifiedTopology: true });

// Sensor data model
const sensorDataSchema = new mongoose.Schema({
  soilMoisture: Number,
  temperature: Number,
  cropHealth: Number,
  timestamp: Date
});

const SensorData = mongoose.model('SensorData', sensorDataSchema);

// Real-time data visualization
app.use(express.static('public'));

// Handle sensor data
io.on('connection', (socket) => {
  console.log('Sensor connected');
  
  socket.on('sensorData', (data) => {
    const sensorData = new SensorData(data);
    sensorData.save((err) => {
      if (err) {
        console.error('Error saving sensor data:', err);
      } else {
        io.emit('update', data);
      }
    });
  });
});

// Predictive analytics
function predictWateringSchedule(data) {
  // Implement machine learning model to predict optimal watering times
}

function predictHarvestSchedule(data) {
  // Implement machine learning model to predict optimal harvest times
}

// Serve real-time data
app.get('/api/data', async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(100);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data' });
  }
});

// Start server
server.listen(3000, () => {
  console.log('Agriculture monitoring system is running on port 3000');
});
// Real-time data visualization
const chart = new Chart(document.getElementById('dataChart'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Soil Moisture',
        data: [],
        borderColor: 'blue',
        tension: 0.1
      },
      {
        label: 'Temperature',
        data: [],
        borderColor: 'red',
        tension: 0.1
      },
      {
        label: 'Crop Health',
        data: [],
        borderColor: 'green',
        tension: 0.1
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false
  }
});

// Update chart with real-time data
const socket = io();
socket.on('update', (data) => {
  chart.data.labels.push(new Date().toLocaleTimeString());
  chart.data.datasets[0].data.push(data.soilMoisture);
  chart.data.datasets[1].data.push(data.temperature);
  chart.data.datasets[2].data.push(data.cropHealth);
  chart.update();
});
// Read sensor data
function readSensors() {
  // Replace with actual sensor reading logic
  return {
    soilMoisture: Math.random() * 100,
    temperature: Math.random() * 40 + 10,
    cropHealth: Math.random() * 100
  };
}

// Send sensor data to server
setInterval(() => {
  const data = readSensors();
  fetch('http://localhost:3000/sensor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}, 10000);