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

// Task model (task.js)
class Task {
  constructor(id, title, description, deadline, priority, assignedTo) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.deadline = deadline;
    this.priority = priority;
    this.assignedTo = assignedTo;
    this.status = 'open';
    this.createdAt = new Date();
  }
}

// MongoDB setup (db.js)
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/tasks', { useNewUrlParser: true, useUnifiedTopology: true });

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  deadline: Date,
  priority: String,
  assignedTo: String,
  status: String,
  createdAt: Date
});

const Task = mongoose.model('Task', taskSchema);

async function createTask(task) {
  const dbTask = new Task(task);
  return dbTask.save();
}

async function getTasks() {
  return Task.find().sort({ createdAt: -1 }).exec();
}

async function updateTask(id, updates) {
  return Task.findOneAndUpdate({ _id: id }, updates, { new: true });
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

  socket.on('newTask', async (task) => {
    try {
      const newTask = await createTask(task);
      io.emit('taskCreated', newTask);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  });

  socket.on('updateTask', async (id, updates) => {
    try {
      const updatedTask = await updateTask(id, updates);
      io.emit('taskUpdated', updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  });

  socket.on('deleteTask', async (id) => {
    try {
      await Task.deleteOne({ _id: id });
      io.emit('taskDeleted', id);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// React component (App.js)
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import moment from 'moment';

function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'low',
    assignedTo: ''
  });
  const socket = io();

  useEffect(() => {
    const loadTasks = async () => {
      const data = await getTasks();
      setTasks(data);
    };
    loadTasks();

    socket.on('taskCreated', (task) => {
      setTasks(prev => [...prev, task]);
    });

    socket.on('taskUpdated', (task) => {
      setTasks(prev => prev.map(t => t._id === task._id ? task : t));
    });

    socket.on('taskDeleted', (id) => {
      setTasks(prev => prev.filter(t => t._id !== id));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const task = {
        ...newTask,
        deadline: new Date(newTask.deadline),
        assignedTo: newTask.assignedTo || 'Unassigned'
      };
      socket.emit('newTask', task);
      setNewTask({
        title: '',
        description: '',
        deadline: '',
        priority: 'low',
        assignedTo: ''
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      socket.emit('updateTask', id, updates);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      socket.emit('deleteTask', id);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div>
      <h1>Task Management System</h1>
      <div className="task-form">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="Task title"
          />
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="Task description"
          />
          <input
            type="date"
            value={newTask.deadline}
            onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
            placeholder="Deadline"
          />
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            type="text"
            value={newTask.assignedTo}
            onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
            placeholder="Assigned to"
          />
          <button type="submit">Create Task</button>
        </form>
      </div>
      <div className="task-list">
        {tasks.map(task => (
          <div key={task._id} className="task-item">
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <p>Deadline: {moment(task.deadline).format('MMM DD, YYYY')}</p>
            <p>Priority: {task.priority}</p>
            <p>Assigned to: {task.assignedTo}</p>
            <p>Status: {task.status}</p>
            <button onClick={() => handleUpdate(task._id, { status: 'in progress' })}>
              Start Task
            </button>
            <button onClick={() => handleUpdate(task._id, { status: 'completed' })}>
              Complete Task
            </button>
            <button onClick={() => handleDelete(task._id)}>
              Delete Task
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskManagement;