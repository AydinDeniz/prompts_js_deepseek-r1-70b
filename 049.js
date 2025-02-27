// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tensorflowjs": "^3.18.0",
    "mongodb": "^4.5.0",
    "socket.io": "^4.5.4",
    "highcharts": "^10.3.0"
  }
}

// Energy consumption model (model.js)
const tf = require('@tensorflow/tfjs');

async function trainModel(historicalData) {
  const tensorData = tf.tensor2d(historicalData);
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 64, activation: 'relu', inputShape: [tensorData.shape[1]] }),
      tf.layers.dense({ units: 32, activation: 'relu' }),
      tf.layers.dense({ units: 1 })
    ]
  });
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  await model.fit(tensorData, epochs=50);
  return model;
}

async function predictEnergyUsage(model, input) {
  const tensor = tf.tensor2d([input]);
  const prediction = model.predict(tensor);
  return prediction.dataSync()[0];
}

// Energy optimization logic (optimizer.js)
function optimizeEnergyUsage(prediction, storageCapacity, currentLoad) {
  if (prediction > currentLoad) {
    return {
      action: 'store',
      amount: prediction - currentLoad
    };
  } else {
    return {
      action: 'use',
      amount: currentLoad - prediction
    };
  }
}

// MongoDB setup (db.js)
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/energy', { useNewUrlParser: true, useUnifiedTopology: true });

const energySchema = new mongoose.Schema({
  timestamp: Date,
  usage: Number,
  generation: Number,
  storage: Number
});

const Energy = mongoose.model('Energy', energySchema);

async function storeEnergyData(data) {
  const energy = new Energy(data);
  return energy.save();
}

async function getEnergyHistory() {
  return Energy.find().sort({ timestamp: -1 }).exec();
}

// React component (App.js)
import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

function EnergyManagement() {
  const [energyUsage, setEnergyUsage] = useState(0);
  const [energyGeneration, setEnergyGeneration] = useState(0);
  const [storageLevel, setStorageLevel] = useState(0);
  const [energyHistory, setEnergyHistory] = useState([]);

  useEffect(() => {
    const model = trainModel(energyHistory);
    const prediction = predictEnergyUsage(model, energyUsage);
    const optimization = optimizeEnergyUsage(prediction, storageLevel, energyUsage);
    
    // Update storage level based on optimization
    setStorageLevel(prev => prev + (optimization.action === 'store' ? optimization.amount : -optimization.amount));
  }, [energyHistory, energyUsage, storageLevel]);

  const handleDataUpdate = async () => {
    try {
      const data = {
        timestamp: new Date(),
        usage: energyUsage,
        generation: energyGeneration,
        storage: storageLevel
      };
      await storeEnergyData(data);
      const history = await getEnergyHistory();
      setEnergyHistory(history.map(h => [h.timestamp, h.usage, h.generation, h.storage]));
    } catch (error) {
      console.error('Error updating energy data:', error);
    }
  };

  const chartOptions = {
    title: {
      text: 'Energy Usage Overview'
    },
    subtitle: {
      text: 'Source: Real-time Energy Data'
    },
    xAxis: {
      type: 'datetime'
    },
    yAxis: {
      title: {
        text: 'Energy (kWh)'
      }
    },
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle'
    },
    series: [
      {
        name: 'Energy Usage',
        data: energyHistory.map(h => [h[0].getTime(), h[1]])
      },
      {
        name: 'Energy Generation',
        data: energyHistory.map(h => [h[0].getTime(), h[2]])
      },
      {
        name: 'Storage Level',
        data: energyHistory.map(h => [h[0].getTime(), h[3]])
      }
    ]
  };

  return (
    <div>
      <h1>Sustainable Energy Management System</h1>
      <div className="energy-dashboard">
        <div className="energy-stats">
          <div>
            <h3>Current Energy Usage</h3>
            <p>{energyUsage} kWh</p>
          </div>
          <div>
            <h3>Current Generation</h3>
            <p>{energyGeneration} kWh</p>
          </div>
          <div>
            <h3>Storage Level</h3>
            <p>{storageLevel} kWh</p>
          </div>
        </div>
        <div className="chart">
          <HighchartsReact
            highcharts={Highcharts}
            options={chartOptions}
          />
        </div>
        <div className="controls">
          <button onClick={handleDataUpdate}>Update Data</button>
        </div>
      </div>
    </div>
  );
}

export default EnergyManagement;