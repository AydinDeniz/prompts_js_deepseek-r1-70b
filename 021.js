// Live classroom platform implementation
class ClassroomApp {
    constructor() {
        this.videoGrid = null;
        this.chatMessages = [];
        this.currentMeeting = null;
        this.fileUploader = null;
        this.firebaseRef = null;
        this.zoomClient = null;
    }

    init() {
        this.videoGrid = new VideoGrid();
        this.chatMessages = [];
        this.zoomClient = new ZoomClient('your-zoom-api-key');
        this.firebaseRef = firebase.firestore();
        this.setupFirebaseListeners();
    }

    setupFirebaseListeners() {
        firebase.auth().onAuthStateChange((user, auth) => {
            if (user) {
                this.currentUser = user;
                this.loadMeetingData();
            }
        });
    }

    startMeeting() {
        if (!this.currentUser) {
            alert('Please log in to start a meeting');
            return;
        }

        this.currentMeeting = this.zoomClient.startMeeting({
            hostId: this.currentUser.uid,
            meetingType: 'live',
            tmiEnabled: true,
            useOriginalName: true
        });

        this.currentMeeting.on('meeting.progress', (data) => {
            console.log('Meeting progress:', data);
        });

        this.currentMeeting.on('meeting.joined', () => {
            this.videoGrid.updateMeetingID(this.currentMeeting.id);
        });
    }

    joinMeeting(meetingID) {
        if (!this.currentUser) {
            alert('Please log in to join a meeting');
            return;
        }

        this.currentMeeting = this.zoomClient.joinMeeting({
            meetingID: meetingID,
            hostID: this.currentUser.uid
        });

        this.videoGrid.updateMeetingID(meetingID);
    }

    handleSendMessage(message) {
        const newMessage = {
            id: Date.now(),
            text: message,
            sender: this.currentUser.uid,
            timestamp: new Date().toISOString()
        };

        this.chatMessages.push(newMessage);
        this.saveMessageToFirebase(newMessage);

        this.videoGrid.addMessage(newMessage);
    }

    handleFileUpload(file) {
        if (!this.fileUploader) {
            alert('File upload component not initialized');
            return;
        }

        const uploadRef = this.fileUploader.upload(file);
        uploadRef.on('complete', (data) => {
            console.log('File uploaded:', data);
            this.videoGrid.addFile(data.file);
        });
    }

    saveMessageToFirebase(message) {
        this.firebaseRef.collection('messages').add(message);
    }

    loadMeetingData() {
        this.firebaseRef.collection('meetings').get()
            .then(snap => {
                snap.forEach(doc => {
                    const meeting = doc.data;
                    meeting.id = doc.id;
                    this.currentMeeting = meeting;
                    this.videoGrid.updateMeetingData(meeting);
                });
            })
            .catch(err => console.error('Error loading meetings:', err));
    }
}

// React component for the classroom
function Classroom() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isMeetingRunning, setIsMeetingRunning] = useState(false);
    const [selectedMeetingID, setSelectedMeetingID] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [files, setFiles] = useState([]);

    useEffect(() => {
        if (isAuthenticated) {
            ClassroomApp.getInstance().init();
        }
    }, [isAuthenticated]);

    return (
        <div className="container">
            <header>
                <h1>Online Classroom</h1>
                <button onClick={ClassroomApp.getInstance().startMeeting}>
                    <FiPlus size={24} />
                </button>
            </header>

            <div className="classroom-grid">
                <div className="video-container">
                    {ClassroomApp.getInstance().videoGrid.render()}
                </div>

                <div className="chat-container">
                    <div className="messages">
                        {ClassroomApp.getInstance().chatMessages.map(msg => (
                            <div key={msg.id} className="message">
                                <div className="message-content">{msg.text}</div>
                                <div className="message-time">{msg.timestamp}</div>
                            </div>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Send a message..."
                        className="message-input"
                    />
                </div>

                <div className="files-container">
                    <div className="file-uploader">
                        <FiFile size={24} />
                        <p>Drag and drop files here</p>
                        <input type="file" multiple accept="*" />
                    </div>
                    <div className="uploaded-files">
                        {files.map((file, index) => (
                            <div key={index} className="file-item">
                                <FiFile size={16} className="file-icon" />
                                <span>{file.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="controls">
                <button onClick={() => ClassroomApp.getInstance().joinMeeting(selectedMeetingID)}>
                    <FiClock size={20} /> Join Meeting
                </button>
            </div>
        </div>
    );
}

// Initialize the classroom app
ClassroomApp.getInstance = new ClassroomApp();

// Start the app
function main() {
    const app = document.getElementById('app');
    app.appendChild(new Classroom());
}

// Add authentication listener
window.addEventListener('load', () => {
    const loginButton = document.querySelector('#login-button');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            firebase.auth().signInWithEmailAndPassword('user@example.com', 'password');
        });
    }
});