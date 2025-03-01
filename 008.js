const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Store active users
const activeUsers = new Set();

// Broadcast messages to all connected clients
function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'join':
                activeUsers.add(data.username);
                broadcast({
                    type: 'userJoined',
                    username: data.username,
                    message: `${data.username} has joined the chat!`
                });
                break;
            case 'message':
                broadcast({
                    type: 'message',
                    username: data.username,
                    message: data.message
                });
                break;
            case 'leave':
                activeUsers.delete(data.username);
                broadcast({
                    type: 'userLeft',
                    username: data.username,
                    message: `${data.username} has left the chat!`
                });
                break;
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:8080');