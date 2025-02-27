// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io": "^4.5.4",
    "mongodb": "^4.5.0",
    "node-red-contrib-home-assistant": "^0.1.1"
  }
}

// Device model (device.js)
class Device {
  constructor(id, name, type, status) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.status = status;
    this.lastUpdate = new Date();
  }
}

// MongoDB setup (db.js)
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/homeautomation', { useNewUrlParser: true, useUnifiedTopology: true });

const deviceSchema = new mongoose.Schema({
  name: String,
  type: String,
  status: Boolean,
  lastUpdate: Date
});

const Device = mongoose.model('Device', deviceSchema);

async function getDevices() {
  return Device.find().exec();
}

async function updateDevice(id, status) {
  return Device.findOneAndUpdate({ _id: id }, { status, lastUpdate: new Date() }, { new: true });
}

// Home Assistant integration (ha.js)
const { HomeAssistant } = require('home-assistant');

const ha = new HomeAssistant({
  url: 'http://your-home-assistant:8123',
  token: 'your_long_lived_access_token'
});

async function getEntities() {
  try {
    const states = await ha.states();
    return states.map(state => ({
      entity_id: state.entity_id,
      state: state.state,
      attributes: state.attributes
    }));
  } catch (error) {
    console.error('Error fetching Home Assistant entities:', error);
    return [];
  }
}

// Energy tracking (energy.js)
const energyData = [];

function trackEnergy(device, status) {
  energyData.push({
    device: device.name,
    status,
    timestamp: new Date()
  });
}

// React component (App.js)
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function HomeAutomation() {
  const [devices, setDevices] = useState([]);
  const [energy, setEnergy] = useState(energyData);
  const [routines, setRoutines] = useState([]);
  const socket = io();

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const data = await getDevices();
        setDevices(data);
      } catch (error) {
        console.error('Error loading devices:', error);
      }
    };
    loadDevices();

    const loadEnergy = async () => {
      try {
        const data = await fetch('/api/energy').then(res => res.json());
        setEnergy(data);
      } catch (error) {
        console.error('Error loading energy data:', error);
      }
    };
    loadEnergy();

    const loadRoutines = async () => {
      try {
        const data = await fetch('/api/routines').then(res => res.json());
        setRoutines(data);
      } catch (error) {
        console.error('Error loading routines:', error);
      }
    };
    loadRoutines();
  }, []);

  const handleDeviceToggle = async (id) => {
    try {
      const device = devices.find(d => d.id === id);
      const updatedDevice = await updateDevice(id, !device.status);
      setDevices(prev => prev.map(d => d.id === id ? updatedDevice : d));
      trackEnergy(device, updatedDevice.status);
    } catch (error) {
      console.error('Error toggling device:', error);
    }
  };

  const handleRoutineCreate = async (routine) => {
    try {
      const newRoutine = await fetch('/api/routines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routine)
      }).then(res => res.json());
      setRoutines(prev => [...prev, newRoutine]);
    } catch (error) {
      console.error('Error creating routine:', error);
    }
  };

  return (
    <div>
      <h1>Home Automation Dashboard</h1>
      <div className="devices">
        <h2>Connected Devices</h2>
        <ul>
          {devices.map(device => (
            <li key={device.id}>
              <h3>{device.name}</h3>
              <p>Status: {device.status ? 'On' : 'Off'}</p>
              <p>Last Updated: {new Date(device.lastUpdate).toLocaleString()}</p>
              <button onClick={() => handleDeviceToggle(device.id)}>
                {device.status ? 'Turn Off' : 'Turn On'}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="energy-tracking">
        <h2>Energy Consumption</h2>
        <div className="energy-chart">
          {/* Implement energy usage chart using Chart.js or similar */}
        </div>
      </div>
      <div className="routines">
        <h2>Automated Routines</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const routine = {
            name: e.target.name.value,
            trigger: e.target.trigger.value,
            actions: e.target.actions.value.split(',')
          };
          handleRoutineCreate(routine);
        }}>
          <input type="text" name="name" placeholder="Routine Name" />
          <select name="trigger">
            <option value="time">Time</option>
            <option value="device">Device State</option>
            <option value="schedule">Schedule</option>
          </select>
          <input type="text" name="actions" placeholder="Actions (comma-separated)" />
          <button type="submit">Create Routine</button>
        </form>
        <ul>
          {routines.map(routine => (
            <li key={routine.id}>
              <h3>{routine.name}</h3>
              <p>Trigger: {routine.trigger}</p>
              <p>Actions: {routine.actions.join(', ')}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default HomeAutomation;