// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io": "^4.5.4",
    "quill": "^1.3.7",
    "mongodb": "^4.5.0"
  }
}

// Document model (document.js)
class Document {
  constructor(id, title, content, version) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.version = version;
    this.history = [];
  }
}

// MongoDB setup (db.js)
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/documents', { useNewUrlParser: true, useUnifiedTopology: true });

const documentSchema = new mongoose.Schema({
  title: String,
  content: String,
  version: Number,
  history: [{ content: String, version: Number, timestamp: Date }]
});

const Document = mongoose.model('Document', documentSchema);

async function createDocument(doc) {
  const dbDoc = new Document(doc);
  return dbDoc.save();
}

async function getDocument(id) {
  return Document.findById(id).exec();
}

async function updateDocument(id, updates) {
  return Document.findOneAndUpdate({ _id: id }, updates, { new: true });
}

// WebSocket server (server.js)
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', (docId) => {
    socket.join(docId);
    io.to(docId).emit('userJoined', `${socket.id} joined the document`);
  });

  socket.on('leave', (docId) => {
    socket.leave(docId);
    io.to(docId).emit('userLeft', `${socket.id} left the document`);
  });

  socket.on('contentChange', (docId, content, version) => {
    io.to(docId).emit('updateContent', content, version);
  });

  socket.on('comment', (docId, comment) => {
    io.to(docId).emit('newComment', comment);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Quill editor integration (editor.js)
const Quill = require('quill');

function createEditor(containerId, content) {
  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    ['link', 'image'],
    ['clean']
  ];

  const editor = new Quill(`#${containerId}`, {
    theme: 'snow',
    modules: {
      toolbar: toolbarOptions
    },
    placeholder: 'Start typing...',
    content: content || ''
  });

  editor.on('text-change', (delta, oldDelta, source) => {
    if (source === 'user') {
      const content = editor.getContents();
      socket.emit('contentChange', editor.docId, content, editor.getVersion());
    }
  });

  return editor;
}

// Conflict resolution (cr.js)
function resolveConflicts(baseContent, userContent, otherContent) {
  // Implement operational transformation logic
  // to resolve editing conflicts
}

// React component (App.js)
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function DocumentEditor() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [content, setContent] = useState('');
  const [comments, setComments] = useState([]);
  const socket = io();

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const data = await fetch('/api/documents').then(res => res.json());
        setDocuments(data);
      } catch (error) {
        console.error('Error loading documents:', error);
      }
    };
    loadDocuments();
  }, []);

  const handleCreateDoc = async () => {
    try {
      const newDoc = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Document', content: '' })
      }).then(res => res.json());
      setDocuments(prev => [...prev, newDoc]);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const handleSelectDoc = async (docId) => {
    try {
      const doc = await fetch(`/api/documents/${docId}`).then(res => res.json());
      setSelectedDoc(doc);
      setContent(doc.content);
      setComments(doc.comments || []);
      socket.emit('join', docId);
    } catch (error) {
      console.error('Error selecting document:', error);
    }
  };

  const handleContentChange = async (newContent) => {
    try {
      setContent(newContent);
      socket.emit('contentChange', selectedDoc._id, newContent, selectedDoc.version + 1);
      await fetch(`/api/documents/${selectedDoc._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent, version: selectedDoc.version + 1 })
      });
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const handleAddComment = async (comment) => {
    try {
      socket.emit('comment', selectedDoc._id, comment);
      await fetch(`/api/documents/${selectedDoc._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment })
      });
      setComments(prev => [...prev, comment]);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div>
      <h1>Collaborative Document Editor</h1>
      <div className="document-list">
        <button onClick={handleCreateDoc}>Create New Document</button>
        <ul>
          {documents.map(doc => (
            <li key={doc._id}>
              <button onClick={() => handleSelectDoc(doc._id)}>
                {doc.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {selectedDoc && (
        <div className="document-editor">
          <h2>{selectedDoc.title}</h2>
          <div id="editor" className="editor" />
          <div className="comments">
            <h3>Comments</h3>
            <ul>
              {comments.map((comment, index) => (
                <li key={index}>{comment}</li>
              ))}
            </ul>
            <input
              type="text"
              placeholder="Add a comment..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentEditor;