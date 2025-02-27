// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "next": "^12.3.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tensorflowjs": "^3.18.0",
    "pg": "^8.7.3",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5"
  }
}

// Server-side setup (server.js)
const express = require('express');
const next = require('next');
const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

const { Pool } = require('pg');
const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'health_advisor',
  password: 'your_password',
  port: 5432,
});

app.prepare().then(() => {
  const server = express();
  server.use('/api', require('./routes/api'));
  server.get('*', (req, res) => handle(req, res));
  server.listen(port, () => console.log(`Server running on port ${port}`));
});

// TensorFlow.js health model (model.js)
const tf = require('@tensorflow/tfjs');

async function trainModel(userData) {
  const tensorData = tf.tensor2d(userData);
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

async function generateRecommendations(model, userData) {
  const tensor = tf.tensor2d([userData]);
  const prediction = model.predict(tensor);
  return prediction.dataSync()[0];
}

// Database operations (db.js)
async function storeUserHistory(userId, recommendations) {
  const result = await pool.query(
    'INSERT INTO user_history (user_id, recommendations) VALUES ($1, $2) RETURNING *',
    [userId, JSON.stringify(recommendations)]
  );
  return result.rows[0];
}

async function getUserHistory(userId) {
  const result = await pool.query(
    'SELECT * FROM user_history WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

// API routes (routes/api.js)
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

router.use(bodyParser.json());

router.post('/analyze', async (req, res) => {
  try {
    const { userData } = req.body;
    const model = await trainModel(userData);
    const recommendations = await generateRecommendations(model, userData);
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/history', async (req, res) => {
  try {
    const { userId, recommendations } = req.body;
    const history = await storeUserHistory(userId, recommendations);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const history = await getUserHistory(userId);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Next.js page component (pages/index.js)
import { useState, useEffect } from 'react';
import Head from 'next/head';

function HealthAdvisor() {
  const [healthData, setHealthData] = useState({});
  const [recommendations, setRecommendations] = useState({});

  const handleAnalyze = async () => {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userData: healthData }),
      });
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <Head>
        <title>Personalized Health Advisor</title>
      </Head>
      <h1>Health Advisor</h1>
      <div className="input-form">
        <input
          type="number"
          placeholder="Enter your weight"
          onChange={(e) => setHealthData({ ...healthData, weight: parseFloat(e.target.value) })}
        />
        <input
          type="number"
          placeholder="Enter your height"
          onChange={(e) => setHealthData({ ...healthData, height: parseFloat(e.target.value) })}
        />
        <button onClick={handleAnalyze}>Analyze</button>
      </div>
      {recommendations && (
        <div className="recommendations">
          <h2>Personalized Recommendations</h2>
          <p>Diet Plan: {recommendations.diet}</p>
          <p>Exercise Plan: {recommendations.exercise}</p>
        </div>
      )}
    </div>
  );
}

export default HealthAdvisor;