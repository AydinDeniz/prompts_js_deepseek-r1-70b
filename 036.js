const express = require('express');
const app = express();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/products', { useNewUrlParser: true, useUnifiedTopology: true });

// Product model
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  stock: Number
});

const Product = mongoose.model('Product', productSchema);

// API endpoints
app.use(express.json());

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log('Product service is running on port 3001');
});

const express = require('express');
const app = express();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/orders', { useNewUrlParser: true, useUnifiedTopology: true });

// Order model
const orderSchema = new mongoose.Schema({
  userId: String,
  products: Array,
  total: Number,
  status: String
});

const Order = mongoose.model('Order', orderSchema);

// API endpoints
app.use(express.json());

app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error creating order' });
  }
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log('Order service is running on port 3002');
});

const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { typeDefs } = require('./schema');
const { resolvers } = require('./resolvers');

// Initialize Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Start server
server.listen().then(({ url }) => {
  console.log(`GraphQL API is running on ${url}`);
});

version: '3'

services:
  product-service:
    build: ./product-service
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://localhost:27017/products
    depends_on:
      - mongo

  order-service:
    build: ./order-service
    ports:
      - "3002:3002"
    environment:
      - MONGODB_URI=mongodb://localhost:27017/orders
    depends_on:
      - mongo

  graphql-gateway:
    build: ./graphql-gateway
    ports:
      - "4000:4000"
    environment:
      - PRODUCT_SERVICE_URL=http://product-service:3001
      - ORDER_SERVICE_URL=http://order-service:3002
    depends_on:
      - product-service
      - order-service

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
  
  const express = require('express');
const app = express();
const WebSocket = require('ws');
const server = app.listen(3003, () => {
  console.log('Notification service is running on port 3003');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    switch(data.type) {
      case 'orderStatus':
        handleOrderStatus(data);
        break;
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function handleOrderStatus(data) {
  // Implement logic to send notifications
}