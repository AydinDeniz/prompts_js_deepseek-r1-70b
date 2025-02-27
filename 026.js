const express = require('express');
const WebSocket = require('ws');
const MongoClient = require('mongodb').MongoClient;
const app = express();

// MongoDB connection
MongoClient.connect('mongodb://localhost:27017', (err, client) => {
  if (err) return console.log(err);
  console.log('Connected to MongoDB');
  const db = client.db();
  const usersCollection = db.collection('users');
  const gamesCollection = db.collection('games');
});

// Express server
const server = app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    switch(data.type) {
      case 'join':
        handleJoin(data, ws);
        break;
      case 'move':
        handleMove(data, ws);
        break;
      case 'leave':
        handleLeave(data, ws);
        break;
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function handleJoin(data, ws) {
  // Add player to game
}

function handleMove(data, ws) {
  // Update player position
}

function handleLeave(data, ws) {
  // Remove player from game
}

const ws = new WebSocket('ws://localhost:3000');
const app = new PIXI.Application();
document.body.appendChild(app.view);

let player = new PIXI.Sprite(PIXI.Texture.from('player'));
app.stage.addChild(player);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'update':
      updateGame(data);
      break;
  }
};

document.addEventListener('keydown', (e) => {
  ws.send(JSON.stringify({
    type: 'move',
    direction: e.key
  }));
});

function updateGame(data) {
  // Update game state based on server data
}