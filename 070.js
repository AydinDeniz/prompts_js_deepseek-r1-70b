// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io": "^4.5.4",
    "mongodb": "^4.5.0",
    "moment": "^2.29.1"
  }
}

// Player model (player.js)
class Player {
  constructor(id, name, score, skillLevel) {
    this.id = id;
    this.name = name;
    this.score = score;
    this.skillLevel = skillLevel;
    this.ready = false;
  }
}

// Game room model (room.js)
class GameRoom {
  constructor(id, maxPlayers, gameType) {
    this.id = id;
    this.maxPlayers = maxPlayers;
    this.gameType = gameType;
    this.players = [];
    this.gameState = 'waiting';
    this.createdAt = new Date();
  }
}

// MongoDB setup (db.js)
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/multiplayer', { useNewUrlParser: true, useUnifiedTopology: true });

const playerSchema = new mongoose.Schema({
  name: String,
  score: Number,
  skillLevel: Number,
  matches: Number
});

const roomSchema = new mongoose.Schema({
  maxPlayers: Number,
  gameType: String,
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  gameState: String,
  createdAt: Date
});

const Player = mongoose.model('Player', playerSchema);
const Room = mongoose.model('Room', roomSchema);

async function createRoom(maxPlayers, gameType) {
  const room = new Room({
    maxPlayers,
    gameType,
    players: [],
    gameState: 'waiting',
    createdAt: new Date()
  });
  return room.save();
}

async function joinRoom(roomId, playerId) {
  const room = await Room.findById(roomId).exec();
  room.players.push(playerId);
  return room.save();
}

// WebSocket server (server.js)
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New player connected');

  socket.on('createRoom', async (options) => {
    try {
      const room = await createRoom(options.maxPlayers, options.gameType);
      io.emit('roomCreated', room);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  });

  socket.on('joinRoom', async (roomId, playerId) => {
    try {
      const room = await joinRoom(roomId, playerId);
      io.to(roomId).emit('playerJoined', room);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  socket.on('ready', (roomId, playerId) => {
    io.to(roomId).emit('playerReady', playerId);
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Matchmaking logic (matchmaking.js)
function calculateSkillDifference(player1, player2) {
  return Math.abs(player1.skillLevel - player2.skillLevel);
}

async function findMatch(player) {
  try {
    const players = await Player.find({
      skillLevel: {
        $gte: player.skillLevel - 100,
        $lte: player.skillLevel + 100
      },
      _id: { $ne: player._id },
      ready: true
    }).exec();

    if (players.length >= 1) {
      const opponent = players[0];
      await createRoom(2, '1v1');
      return { opponent, roomId };
    }
    return null;
  } catch (error) {
    console.error('Error finding match:', error);
    return null;
  }
}

// React component (App.js)
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function MultiplayerGame() {
  const [username, setUsername] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const socket = io();

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await fetch('/api/rooms').then(res => res.json());
        setRooms(data);
      } catch (error) {
        console.error('Error loading rooms:', error);
      }
    };
    loadRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const room = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxPlayers: 2,
          gameType: '1v1'
        })
      }).then(res => res.json());
      setCurrentRoom(room);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      const player = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: username })
      }).then(res => res.json());
      setPlayerId(player._id);
      socket.emit('joinRoom', roomId, player._id);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  return (
    <div>
      <h1>Online Multiplayer Game</h1>
      <div className="lobby">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />
        <button onClick={handleCreateRoom}>Create Room</button>
        <div className="rooms-list">
          <h2>Available Rooms</h2>
          <ul>
            {rooms.map(room => (
              <li key={room.id}>
                <p>Room ID: {room.id}</p>
                <p>Max Players: {room.maxPlayers}</p>
                <p>Game Type: {room.gameType}</p>
                <p>Players: {room.players.length}/{room.maxPlayers}</p>
                <button onClick={() => handleJoinRoom(room.id)}>
                  Join Room
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MultiplayerGame;