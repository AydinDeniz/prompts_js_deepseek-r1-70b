const WebSocket = require('ws');
const http = require('http');
const port = 8080;

// Create HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
        <html>
            <head>
                <title>Chat Room</title>
            </head>
            <body>
                <h1>Chat Room</h1>
                <div id="messages"></div>
                <div id="input">
                    <input type="text" id="messageInput" placeholder="Enter your message...">
                    <button onclick="sendMessage()">Send</button>
                </div>
                <script>
                    const ws = new WebSocket('ws://localhost:${port}');

                    ws.onmessage = (event) => {
                        const messagesDiv = document.getElementById('messages');
                        const message = JSON.parse(event.data);
                        messagesDiv.innerHTML += `
                            <div>
                                <span style="font-weight: bold;">${message.sender}:</span>
                                <span>${message.text}</span>
                                <span style="font-style: italic;">${message.timestamp}</span>
                            </div>
                        `;
                    };

                    ws.onclose = () => {
                        console.log('Client disconnected');
                    };
                </script>
            </body>
        </html>
    `);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('New client connected');

    // Store user
    const users = {};
    users[ws._socket.remoteAddress] = {
        socket: ws,
        username: prompt('Enter your username')
    };

    ws.on('close', () => {
        console.log('Client disconnected');
        delete users[ws._socket.remoteAddress];
    });

    ws.on('message', (message) => {
        // Broadcast the message to all clients
        const messageData = {
            id: Date.now(),
            text: message.toString().trim(),
            timestamp: new Date().toLocaleTimeString(),
            sender: users[ws._socket.remoteAddress].username
        };

        // Send message to all clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(messageData));
            }
        });

        // Clear input
        document.getElementById('messageInput').value = '';
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});