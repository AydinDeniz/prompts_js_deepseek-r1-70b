// Client-side code
const socket = io();
const editor = document.getElementById('editor');
const userId = localStorage.getItem('userId') || UUID();
const docId = window.location.pathname.split('/').pop();

// Load document
socket.emit('load-doc', docId);

// Handle document load
socket.on('doc-loaded', (data) => {
    editor.value = data.content;
    editor.focus();
});

// Handle real-time updates
socket.on('update', (update) => {
    const range = document.createRange();
    const selection = window.getSelection();
    const offset = selection.focusOffset || 0;

    editor.value = editor.value.substring(0, update.start) + update.text + editor.value.substring(update.end);
});

// Track local changes
let lastChange = 0;
let timeout;

editor.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        const text = e.target.value.substring(start, end);
        
        socket.emit('update', {
            docId,
            start,
            end,
            text,
            userId
        });
        
        lastChange = Date.now();
    }, 500);
});

// User permissions
socket.on('permissions', (perms) => {
    if (!perms.includes(userId)) {
        editor.readOnly = true;
        alert('You do not have permission to edit this document');
    }
});

// Version history
socket.on('history', (versions) => {
    const history = document.getElementById('history');
    history.innerHTML = versions.map(v => `
        <div>${v.version} - ${v.user} - ${v.date}</div>
    `).join('');
});

// Firebase setup
const firebaseConfig = {
    apiKey: 'your-api-key',
    authDomain: 'your-auth-domain',
    databaseURL: 'your-database-url'
};

const firebase = initializeApp(firebaseConfig);
const db = getFirestore(firebase);

// Save document
async function saveDocument() {
    await setDoc(doc(db, 'documents', docId), {
        content: editor.value,
        lastModified: serverTimestamp(),
        version: increment(1)
    });
}

// Real-time database listener
onSnapshot(doc(db, 'documents', docId), (doc) => {
    if (doc.exists()) {
        editor.value = doc.data().content;
    }
});

// Error handling
socket.on('error', (error) => {
    console.error('WebSocket error:', error);
});

// UUID generator
function UUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}