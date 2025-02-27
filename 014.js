// WebSocket server setup
const express = require('express');
const WebSocket = require('ws');
const firebase = require('firebase');
const uuid = require('uuid');

const app = express();
const port = process.env.PORT || 3001;

// Initialize Firebase
const firebaseConfig = {
    apiKey: 'your-firebase-api-key',
    authDomain: 'your-firebase-project.firebaseapp.com',
    databaseURL: 'your-firebase-database-url',
    projectId: 'your-firebase-project-id',
    storageBucket: 'your-firebase-storage-bucket.appspot.com',
    messagingSenderId: 'your-messaging-send-id',
    appId: 'your-app-id'
};

firebase.initializeApp(firebaseConfig);

// Database models
const db = firebase.database();

// Text editor model
const EditorModel = db.ref('.editor');

// Users model
const UsersModel = db.ref('.users');

// Version history model
const VersionHistoryModel = db.ref('.versions');

// Create Express server
app.use(express.static('public'));
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server: app });

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New client connected');

    // Generate a unique user ID
    const userId = uuid.v4();

    // Store user information
    UsersModel.child(userId).set({
        id: userId,
        role: 'user' // Define roles like 'admin' or 'user'
    });

    ws.on('message', (message) => {
        console.log('Received:', message.toString());

        // Broadcast the message to all connected clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        UsersModel.child(userId).remove();
    });
});

// Text editor setup
const editor = new MonacoEditor(document.getElementById('editor'), 'javascript');
editor.value = 'Hello, World!';

// Function to handle editor changes
function handleEditorChange() {
    const currentValue = editor.getValue();
    const previousValue = EditorModel.previousValue();

    // Create a new version
    const versionId = uuid.v4();
    const version = {
        id: versionId,
        content: currentValue,
        userId: userId,
        timestamp: Date.now()
    };

    VersionHistoryModel.push(version, (err) => {
        if (err) {
            console.error('Error saving version:', err);
        } else {
            EditorModel.set(version.content);
            console.log('New version saved:', versionId);
        }
    });

    // Update the editor with the latest version
    EditorModel.set(version.content);
}

// Add event listeners for the editor
editor.addEventListener('input', handleEditorChange);

// Initialize the editor with the latest version
EditorModel.on('value', (snapshot) => {
    editor.setValue(snapshot.val());
});

// Handle user authentication
firebase.auth().onAuthStateChange((user, authentication) => {
    if (user) {
        // Add user to users list
        UsersModel.child(user.uid).set({
            id: user.uid,
            email: user.email,
            role: 'admin' // Replace with actual role-based access control
        });

        console.log('User authenticated:', user.uid);
    } else {
        console.log('User logged out');
        UsersModel.child(user.uid).remove();
    }
});