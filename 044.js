// Import required libraries
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/security', { useNewUrlParser: true, useUnifiedTopology: true });

// Threat model
const threatSchema = new mongoose.Schema({
  sourceIP: String,
  destinationIP: String,
  timestamp: Date,
  type: String,
  severity: String
});

const Threat = mongoose.model('Threat', threatSchema);

// Machine learning model
const model = tf.sequential({
  layers: [
    tf.layers.dense({ units: 10, activation: 'relu', inputShape: [5] }),
    tf.layers.dense({ units: 10, activation: 'relu' }),
    tf.layers.dense({ units: 3, activation: 'softmax' })
  ]
});

// Compile model
model.compile({
  optimizer: tf.train.adam(),
  loss: 'categoricalCrossentropy',
  metrics: ['accuracy']
});

// Training data
const trainingData = [
  // Example data points
  {
    input: [1, 2, 3, 4, 5],
    output: [0, 1, 0]
  }
];

// Convert to tensors
const inputs = tf.tensor2d(trainingData.map(d => d.input));
const outputs = tf.tensor2d(trainingData.map(d => d.output));

// Train model
async function trainModel() {
  try {
    await model.fit(inputs, outputs, {
      epochs: 100,
      batchSize: 32,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: Loss = ${logs.loss.toFixed(4)}`);
        }
      }
    });
  } catch (error) {
    console.error('Error training model:', error);
  }
}

// Analyze logs for threats
async function analyzeLogs(logs) {
  try {
    const predictions = model.predict(logs);
    const threats = await predictions.dataSync();
    
    threats.forEach((threat, index) => {
      if (threat > 0.5) {
        const threatDoc = new Threat({
          sourceIP: logs[index].sourceIP,
          destinationIP: logs[index].destinationIP,
          timestamp: new Date(),
          type: 'Potential Threat',
          severity: 'High'
        });
        threatDoc.save();
        sendAlert(threatDoc);
      }
    });
  } catch (error) {
    console.error('Error analyzing logs:', error);
  }
}

// Send alerts
function sendAlert(threat) {
  io.emit('alert', threat);
}

// Serve dashboard
app.use(express.static('public'));

// Handle log submissions
app.post('/api/logs', async (req, res) => {
  try {
    const logs = req.body;
    await analyzeLogs(logs);
    res.json({ message: 'Logs analyzed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing logs' });
  }
});

// Start server
server.listen(3000, () => {
  console.log('Security dashboard is running on port 3000');
});

// Initialize model training
trainModel();

// Real-time threat visualization
const threatChart = new Chart(document.getElementById('threatChart'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Threat Level',
        data: [],
        borderColor: 'red',
        tension: 0.1
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false
  }
});

// Receive alerts
const socket = io();
socket.on('alert', (threat) => {
  threatChart.data.labels.push(new Date().toLocaleTimeString());
  threatChart.data.datasets[0].data.push(threat.severity === 'High' ? 1 : 0.5);
  threatChart.update();
  
  // Show alert notification
  const alertDiv = document.createElement('div');
  alertDiv.textContent = `Potential Threat Detected: ${threat.sourceIP} -> ${threat.destinationIP}`;
  alertDiv.style.color = 'red';
  document.getElementById('alerts').appendChild(alertDiv);
});
// Example training data
const trainingData = [
  {
    input: [1, 2, 3, 4, 5],
    output: [0, 1, 0]
  }
];

// Convert to tensors
const inputs = tf.tensor2d(trainingData.map(d => d.input));
const outputs = tf.tensor2d(trainingData.map(d => d.output));

// Train model
async function trainModel() {
  try {
    await model.fit(inputs, outputs, {
      epochs: 100,
      batchSize: 32,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: Loss = ${logs.loss.toFixed(4)}`);
        }
      }
    });
  } catch (error) {
    console.error('Error training model:', error);
  }
}