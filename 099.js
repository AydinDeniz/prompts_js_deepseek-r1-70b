// webrtc.js
const express = require('express');
const WebSocket = require('ws');
const { RTCPeerConnection, RTCSessionDescription } = require('wrtc');
const uuid = require('uuid');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const signalingPort = 8080;
const iceServers = [
  {
    urls: 'stun:stun.l.google.com:19302'
  }
];

// In-memory storage for active sessions
const sessions = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'join':
        handleJoin(ws, data);
        break;
      case 'offer':
        handleOffer(ws, data);
        break;
      case 'answer':
        handleAnswer(ws, data);
        break;
      case 'ice':
        handleICE(ws, data);
        break;
      default:
        console.log('Unknown message type');
    }
  });
});

// Handle HTTP requests
app.use(express.static('public'));
server.listen(signalingPort, () => {
  console.log(`Signaling server running on port ${signalingPort}`);
});

// Session management
function handleJoin(ws, data) {
  try {
    const { roomId } = data;
    if (!roomId) {
      throw new Error('Room ID is required');
    }

    const session = sessions.get(roomId) || createNewSession(roomId);
    sessions.set(roomId, session);

    ws.roomId = roomId;
    ws.send(JSON.stringify({
      type: 'joined',
      sessionId: session.id
    }));
  } catch (error) {
    console.error('Error handling join:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: error.message
    }));
  }
}

// Create new session
function createNewSession(roomId) {
  return {
    id: uuid.v4(),
    peers: new Map(),
    offers: new Map(),
    answers: new Map(),
    iceCandidates: new Map()
  };
}

// Handle offer
function handleOffer(ws, data) {
  try {
    const { offer, roomId } = data;
    if (!offer || !roomId) {
      throw new Error('Invalid offer');
    }

    const session = sessions.get(roomId);
    if (!session) {
      throw new Error('Session not found');
    }

    const peerId = uuid.v4();
    session.peers.set(peerId, {
      id: peerId,
      offer,
      answer: null,
      iceCandidates: []
    });

    ws.peerId = peerId;
    ws.send(JSON.stringify({
      type: 'offer-ack',
      peerId
    }));

    broadcastToPeers(ws, session, data);
  } catch (error) {
    console.error('Error handling offer:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: error.message
    }));
  }
}

// Handle answer
function handleAnswer(ws, data) {
  try {
    const { answer, roomId } = data;
    if (!answer || !roomId) {
      throw new Error('Invalid answer');
    }

    const session = sessions.get(roomId);
    if (!session) {
      throw new Error('Session not found');
    }

    const peer = session.peers.get(ws.peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }

    peer.answer = answer;
    session.peers.set(ws.peerId, peer);

    ws.send(JSON.stringify({
      type: 'answer-ack',
      peerId: ws.peerId
    }));

    broadcastToPeers(ws, session, data);
  } catch (error) {
    console.error('Error handling answer:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: error.message
    }));
  }
}

// Handle ICE candidates
function handleICE(ws, data) {
  try {
    const { candidate, roomId } = data;
    if (!candidate || !roomId) {
      throw new Error('Invalid ICE candidate');
    }

    const session = sessions.get(roomId);
    if (!session) {
      throw new Error('Session not found');
    }

    const peer = session.peers.get(ws.peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }

    peer.iceCandidates.push(candidate);
    session.peers.set(ws.peerId, peer);

    ws.send(JSON.stringify({
      type: 'ice-ack',
      peerId: ws.peerId
    }));

    broadcastToPeers(ws, session, data);
  } catch (error) {
    console.error('Error handling ICE candidate:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: error.message
    }));
  }
}

// Broadcast messages to peers
function broadcastToPeers(ws, session, data) {
  session.peers.forEach((peer, peerId) => {
    if (peerId !== ws.peerId) {
      const peerWs = wss.clients.find(client => client.peerId === peerId);
      if (peerWs) {
        peerWs.send(JSON.stringify(data));
      }
    }
  });
}

// Peer connection setup
function createPeerConnection(ws) {
  const pc = new RTCPeerConnection({
    iceServers
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({
        type: 'ice',
        candidate: event.candidate
      }));
    }
  };

  pc.onaddstream = (event) => {
    document.getElementById('remote-video').srcObject = event.stream;
  };

  return pc;
}

// Start call
function startCall(ws, data) {
  try {
    const pc = createPeerConnection(ws);
    const offer = pc.createOffer();
    pc.setLocalDescription(new RTCSessionDescription({ type: 'offer', sdp: offer }));
    ws.send(JSON.stringify({
      type: 'offer',
      offer
    }));
  } catch (error) {
    console.error('Error starting call:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: error.message
    }));
  }
}

// Answer call
function answerCall(ws, data) {
  try {
    const pc = createPeerConnection(ws);
    pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.offer }));
    const answer = pc.createAnswer();
    pc.setLocalDescription(new RTCSessionDescription({ type: 'answer', sdp: answer }));
    ws.send(JSON.stringify({
      type: 'answer',
      answer
    }));
  } catch (error) {
    console.error('Error answering call:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: error.message
    }));
  }
}

// Handle errors
function handleError(ws, error) {
  console.error('Error:', error);
  ws.send(JSON.stringify({
    type: 'error',
    message: error.message
  }));
}

module.exports = app;