// Initialize Firebase
const firebaseConfig = {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID'
};

const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();
const storage = app.storage();

// Initialize Zoom Client
const ZoomMtg = require('zoom-meeting-apis');
const client = new ZoomMtg.ZoomClient({
    apiKey: 'YOUR_API_KEY',
    apiSecret: 'YOUR_API_SECRET',
    apiEndpoint: 'https://api.zoom.us/v2'
});

// Function to create a meeting
async function createMeeting(topic, startTime, duration) {
    try {
        const response = await client.meetings.create({
            topic: topic,
            type: 2,
            start_time: startTime,
            duration: duration,
            password: 'password',
            agenda: 'Online Class',
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: false,
                mute_upon_joining: true,
                watermark: true,
                use_pmi: false
            }
        });
        return response;
    } catch (error) {
        console.error('Error creating meeting:', error);
        return null;
    }
}

// Function to join a meeting
async function joinMeeting(meetingId, userName) {
    try {
        const response = await client.meetings.join({
            meetingId: meetingId,
            userName: userName,
            password: 'password',
            rememberMe: true
        });
        return response;
    } catch (error) {
        console.error('Error joining meeting:', error);
        return null;
    }
}

// Function to send chat message
async function sendChatMessage(message) {
    try {
        const chatRef = db.collection('chats').doc();
        await chatRef.set({
            message: message,
            sender: 'User',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error sending chat message:', error);
    }
}

// Function to share file
async function shareFile(file) {
    try {
        const fileRef = storage.ref().child(file.name);
        const uploadTask = fileRef.put(file);
        uploadTask.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
        }, (error) => {
            console.error('Error sharing file:', error);
        }, () => {
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                console.log('File available at:', downloadURL);
            });
        });
    } catch (error) {
        console.error('Error sharing file:', error);
    }
}

// Real-time chat updates
db.collection('chats').onSnapshot((querySnapshot) => {
    const chatLog = document.getElementById('chatLog');
    chatLog.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const chatEntry = document.createElement('div');
        chatEntry.textContent = `${doc.data().sender}: ${doc.data().message}`;
        chatLog.appendChild(chatEntry);
    });
});

// Event listeners
document.getElementById('createMeeting').addEventListener('click', async () => {
    const topic = document.getElementById('topic').value;
    const startTime = document.getElementById('startTime').value;
    const duration = document.getElementById('duration').value;
    const meeting = await createMeeting(topic, startTime, duration);
    if (meeting) {
        alert('Meeting created successfully');
    }
});

document.getElementById('joinMeeting').addEventListener('click', async () => {
    const meetingId = document.getElementById('meetingId').value;
    const userName = document.getElementById('userName').value;
    const meeting = await joinMeeting(meetingId, userName);
    if (meeting) {
        alert('Joined meeting successfully');
    }
});

document.getElementById('sendMessage').addEventListener('click', () => {
    const message = document.getElementById('message').value;
    sendChatMessage(message);
});

document.getElementById('shareFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        shareFile(file);
    }
});