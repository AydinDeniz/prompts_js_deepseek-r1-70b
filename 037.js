// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "d3": "^7.4.4",
    "ws": "^8.2.3",
    "axios": "^0.21.1"
  }
}

// Server setup (server.js)
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;

app.use(express.static('public'));

// WebSocket server
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Fetch real-time stock data
const axios = require('axios');
const stockApi = 'https://www.alphavantage.co/query?';

setInterval(async () => {
  try {
    const response = await axios.get(stockApi, {
      params: {
        function: 'TIME_SERIES_INTRADAY',
        symbol: 'MSFT',
        interval: '1min',
        apikey: 'YOUR_API_KEY'
      }
    });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(response.data));
      }
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
  }
}, 60000);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Trading algorithm (trading.js)
class TradingAlgorithm {
  constructor(parameters) {
    this.parameters = parameters;
    this.portfolio = {
      cash: 100000,
      positions: {},
      value: 100000
    };
  }

  executeTrade(symbol, quantity, price) {
    if (this.portfolio.cash >= quantity * price) {
      this.portfolio.cash -= quantity * price;
      this.portfolio.positions[symbol] = (this.portfolio.positions[symbol] || 0) + quantity;
      this.portfolio.value = this.portfolio.cash + Object.values(this.portfolio.positions).reduce((acc, qty) => acc + qty * price, 0);
    }
  }

  checkConditions(data) {
    // Implement trading logic based on parameters
  }
}

// D3.js visualization (visualization.js)
const margin = { top: 20, right: 20, bottom: 30, left: 20 };
const width = 500;
const height = 300;

const svg = d3.select('body')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

// React component (App.js)
import React, { useState, useEffect } from 'react';
import WebSocket from 'ws';

function TradingSimulator() {
  const [stockData, setStockData] = useState({});
  const [portfolio, setPortfolio] = useState({
    cash: 100000,
    positions: {},
    value: 100000
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');

    ws.onmessage = (event) => {
      setStockData(JSON.parse(event.data));
    };

    return () => ws.close();
  }, []);

  const handleTrade = (symbol, quantity, price) => {
    const algorithm = new TradingAlgorithm({
      // User-defined parameters
    });
    algorithm.executeTrade(symbol, quantity, price);
    setPortfolio(algorithm.portfolio);
  };

  return (
    <div>
      <h1>Stock Trading Simulator</h1>
      <div className="stock-data">
        <h2>Real-Time Stock Data</h2>
        <p>Symbol: {stockData['Meta Data']?.['2. Symbol']}</p>
        <p>Price: {stockData['Time Series (1min)']?.[Object.keys(stockData['Time Series (1min)'])[0]]['4. close']}</p>
      </div>
      <div className="portfolio">
        <h2>Portfolio</h2>
        <p>Cash: ${portfolio.cash}</p>
        <p>Value: ${portfolio.value}</p>
      </div>
      <div className="trading-form">
        <input type="text" placeholder="Symbol" />
        <input type="number" placeholder="Quantity" />
        <button onClick={() => handleTrade('MSFT', 10, 200)}>Trade</button>
      </div>
    </div>
  );
}

export default TradingSimulator;