// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "tensorflowjs": "^3.18.0",
    "couchdb": "^3.2.0",
    "natural": "^0.6.3",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5"
  }
}

// Server setup (server.js)
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// Connect to CouchDB
const { CouchDB } = require('couchdb');
const couch = new CouchDB('http://localhost:5984');
const db = couch.db('chatbot');

// TensorFlow.js model (model.js)
const tf = require('@tensorflow/tfjs');

async function trainModel(conversations) {
  const tensorData = tf.tensor2d(conversations);
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

// Chatbot logic (chatbot.js)
async function handleRequest(input, userId) {
  try {
    // Process input
    const processedInput = processInput(input);
    
    // Get conversation history
    const history = await db.find({
      selector: { userId },
      use_index: ['userId']
    });
    
    // Train model with conversation data
    const model = await trainModel(history.map(doc => [doc.input, doc.response]));
    
    // Generate response
    const response = await generateResponse(model, processedInput);
    
    // Store conversation
    await db.insert({
      userId,
      input: processedInput,
      response,
      timestamp: new Date().toISOString()
    });
    
    return response;
  } catch (error) {
    console.error('Error handling request:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
}

// API routes (routes/api.js)
const express = require('express');
const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { input, userId } = req.body;
    const response = await handleRequest(input, userId);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Client-side React component (App.js)
import React, { useState } from 'react';
import axios from 'axios';

function ChatInterface() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [userId] = useState(Math.random().toString(36).substr(2, 9));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/chat', {
        input: message,
        userId
      });
      setConversation([...conversation, { user: message, bot: response.data.response }]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <h1>Self-Learning Chatbot</h1>
      <div className="chat-container">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.user ? 'user' : 'bot'}`}>
            <p>{msg.user || msg.bot}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatInterface;