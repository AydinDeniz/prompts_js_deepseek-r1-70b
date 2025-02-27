// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "johnny-five": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io": "^4.5.4",
    "node-servo": "^1.0.1"
  }
}

// Robot hardware setup (robot.js)
const { Board, Servos, Sensors, Led } = require('johnny-five');
const { Servo } = require('node-servo');

const board = new Board();

board.on('ready', () => {
  const leftMotor = new Servos(10);
  const rightMotor = new Servos(11);
  const sensor = new Sensors.A0();
  const led = new Led(13);

  // Initialize servos
  leftMotor.to(90);
  rightMotor.to(90);

  // Read sensor data
  sensor.on('data', () => {
    // Handle sensor input
  });
});

// Visual programming interface (blocks.js)
const blocks = [
  {
    type: 'forward',
    params: ['10'],
    next: null
  },
  {
    type: 'turn',
    params: ['left', '90'],
    next: null
  }
];

// Execute robot actions
function executeAction(action) {
  switch(action.type) {
    case 'forward':
      leftMotor.forward();
      rightMotor.forward();
      break;
    case 'backward':
      leftMotor.reverse();
      rightMotor.reverse();
      break;
    case 'turn':
      if (action.params[0] === 'left') {
        leftMotor.to0);
        rightMotor.to(180);
      } else {
        leftMotor.to(180);
        rightMotor.to(0);
      }
      break;
    case 'stop':
      leftMotor.stop();
      rightMotor.stop();
      break;
  }
}

// Web interface (server.js)
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('command', (command) => {
    executeAction(command);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// React component (App.js)
import React, { useState } from 'react';
import io from 'socket.io-client';

function RobotControl() {
  const [command, setCommand] = useState('');
  const socket = io();

  const handleCommand = (e) => {
    e.preventDefault();
    socket.emit('command', command);
    setCommand('');
  };

  return (
    <div>
      <h1>Robot Control Interface</h1>
      <form onSubmit={handleCommand}>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command (e.g., 'forward', 'left', 'stop')"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default RobotControl;