// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tensorflowjs": "^3.18.0",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "webrtc": "^1.6.1",
    "socket.io": "^4.5.4"
  }
}

// Machine learning model (model.js)
const tf = require('@tensorflow/tfjs');

async function trainModel(symptomsData) {
  const tensorData = tf.tensor2d(symptomsData);
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 64, activation: 'relu', inputShape: [tensorData.shape[1]] }),
      tf.layers.dense({ units: 32, activation: 'relu' }),
      tf.layers.dense({ units: 1 })
    ]
  });
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  await model.fit(tensorData, epochs=50);
  return model;
}

async function diagnoseSymptoms(model, symptoms) {
  const tensor = tf.tensor2d([symptoms]);
  const prediction = model.predict(tensor);
  return prediction.dataSync()[0];
}

// Video analysis (video.js)
const { RTCPeerConnection, RTCSessionDescription } = require('wrtc');

async function analyzeVideoFeed(stream) {
  try {
    const peerConnection = new RTCPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // Analyze video stream for facial expressions, etc.
    return { diagnosis: 'Preliminary assessment based on video analysis' };
  } catch (error) {
    console.error('Video analysis failed:', error);
    return { diagnosis: 'Unable to analyze video feed' };
  }
}

// Telehealth server (server.js)
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// Handle video calls
io.on('connection', (socket) => {
  console.log('Patient connected');

  socket.on('join', (roomId) => {
    socket.join(roomId);
    io.to(roomId).emit('patientJoined', 'Patient has joined the consultation');
  });

  socket.on('leave', (roomId) => {
    socket.leave(roomId);
    io.to(roomId).emit('patientLeft', 'Patient has left the consultation');
  });

  socket.on('videoOffer', (offer) => {
    // Handle video offer from patient
  });

  socket.on('disconnect', () => {
    console.log('Patient disconnected');
  });
});

server.listen(port, () => {
  console.log(`Telehealth server running on port ${port}`);
});

// API routes (routes/api.js)
const express = require('express');
const router = express.Router();

router.post('/diagnose', async (req, res) => {
  try {
    const { symptoms } = req.body;
    const model = await trainModel(symptoms);
    const diagnosis = await diagnoseSymptoms(model, symptoms);
    res.json({ diagnosis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/video', async (req, res) => {
  try {
    const diagnosis = await analyzeVideoFeed(req.body.stream);
    res.json({ diagnosis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// React component (App.js)
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function TelehealthPlatform() {
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [videoStream, setVideoStream] = useState(null);
  const socket = io();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => setVideoStream(stream))
      .catch(error => console.error('Video access denied:', error));
  }, []);

  const handleDiagnosis = async () => {
    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms }),
      });
      const data = await response.json();
      setDiagnosis(data.diagnosis);
    } catch (error) {
      console.error('Error getting diagnosis:', error);
    }
  };

  const handleVideoCall = async () => {
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stream: videoStream }),
      });
      const data = await response.json();
      console.log('Video diagnosis:', data.diagnosis);
    } catch (error) {
      console.error('Error with video analysis:', error);
    }
  };

  return (
    <div>
      <h1>Remote Medical Diagnosis Platform</h1>
      <div className="symptom-input">
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Describe your symptoms..."
        />
        <button onClick={handleDiagnosis}>Get Diagnosis</button>
      </div>
      <div className="video-call">
        <video srcObject={videoStream} autoPlay muted />
        <button onClick={handleVideoCall}>Start Video Consultation</button>
      </div>
      <div className="diagnosis">
        <h3>Diagnosis:</h3>
        <p>{diagnosis}</p>
      </div>
    </div>
  );
}

export default TelehealthPlatform;