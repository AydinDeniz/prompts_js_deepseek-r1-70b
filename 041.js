// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tensorflowjs": "^3.18.0",
    "natural": "^0.6.3",
    "vader-sentiment": "^4.0.1",
    "socket.io": "^4.5.4"
  }
}

// Sentiment analysis (sentiment.js)
const vader = require('vader-sentiment');

function analyzeSentiment(text) {
  const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(text);
  return sentiment.compound;
}

// Machine learning model (model.js)
const tf = require('@tensorflow/tfjs');

async function trainModel(data) {
  const tensorData = tf.tensor2d(data);
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

async function generateResponse(model, input) {
  const tensor = tf.tensor2d([input]);
  const prediction = model.predict(tensor);
  return prediction.dataSync()[0];
}

// NLP processing (nlp.js)
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const PorterStemmer = natural.PorterStemmer;

function processInput(input) {
  const tokens = tokenizer.tokenize(input);
  const stems = tokens.map(token => PorterStemmer.stem(token));
  return stems.join(' ');
}

// Mental health logic (assistant.js)
async function handleRequest(input) {
  try {
    const processedInput = processInput(input);
    const sentimentScore = analyzeSentiment(input);
    
    if (sentimentScore < -0.5) {
      return "I'm sorry to hear you're feeling this way. It might be helpful to talk to a professional.";
    }
    
    const response = await generateResponse(model, processedInput);
    return response;
  } catch (error) {
    console.error('Error handling request:', error);
    return 'I apologize, but I encountered an error. Please try again.';
  }
}

// API routes (routes/api.js)
const express = require('express');
const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { input } = req.body;
    const response = await handleRequest(input);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// React component (App.js)
import React, { useState } from 'react';
import io from 'socket.io-client';

function MentalHealthAssistant() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const socket = io();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: message }),
      });
      const data = await response.json();
      setConversation([...conversation, { user: message, assistant: data.response }]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <h1>AI-Powered Mental Health Assistant</h1>
      <div className="chat-container">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.user ? 'user' : 'assistant'}`}>
            <p>{msg.user || msg.assistant}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How are you feeling today?"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default MentalHealthAssistant;