// Import required libraries
import * as tf from '@tensorflow/tfjs';
import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';

// Load document
async function loadDocument(file) {
  try {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(file);
    return text;
  } catch (error) {
    console.error('Error loading document:', error);
  }
}

// Extract key terms
async function extractKeyTerms(text) {
  try {
    const model = await tf.loadLayersModel('model.json');
    const tensor = tf.tensor2d([text]);
    const predictions = model.predict(tensor);
    return predictions.dataSync();
  } catch (error) {
    console.error('Error extracting key terms:', error);
  }
}

// Generate summary
async function generateSummary(text) {
  try {
    const summary = await tf.summarizeText(text);
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
  }
}

// Analyze document
async function analyzeDocument(file) {
  try {
    const text = await loadDocument(file);
    const keyTerms = await extractKeyTerms(text);
    const summary = await generateSummary(text);
    return { text, keyTerms, summary };
  } catch (error) {
    console.error('Error analyzing document:', error);
  }
}
const express = require('express');
const app = express();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// File upload route
app.post('/upload', upload.single('document'), async (req, res) => {
  try {
    const file = req.file;
    const analysis = await analyzeDocument(file.path);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing document' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// Import TensorFlow.js
import * as tf from '@tensorflow/tfjs';

// Create model
const model = tf.sequential({
  layers: [
    tf.layers.embedding({ inputDim: 10000, outputDim: 16, inputLength: 100 }),
    tf.layers.globalAveragePooling1D(),
    tf.layers.dense({ units: 64, activation: 'relu' }),
    tf.layers.dropout(0.5),
    tf.layers.dense({ units: 1, activation: 'sigmoid' })
  ]
});

// Compile model
model.compile({
  optimizer: tf.train.adam(),
  loss: 'binaryCrossentropy',
  metrics: ['accuracy']
});

// Export model
async function exportModel() {
  try {
    await model.save('file://model.json');
    console.log('Model saved successfully');
  } catch (error) {
    console.error('Error saving model:', error);
  }
}

// Train model
async function trainModel() {
  try {
    // Load training data
    const trainingData = await loadTrainingData();
    const inputs = trainingData.map(item => item.text);
    const outputs = trainingData.map(item => item.label);

    // Convert to tensors
    const inputTensor = tf.tensor2d(inputs);
    const outputTensor = tf.tensor2d(outputs);

    // Train model
    await model.fit(inputTensor, outputTensor, {
      epochs: 100,
      batchSize: 32,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: Loss = ${logs.loss.toFixed(4)}, Accuracy = ${logs.accuracy.toFixed(4)}`);
        }
      }
    });
  } catch (error) {
    console.error('Error training model:', error);
  }
}
// Analyze document
async function analyzeDocument(filePath) {
  try {
    // Extract text from document
    const text = await extractText(filePath);
    
    // Extract key terms
    const keyTerms = await extractKeyTerms(text);
    
    // Generate summary
    const summary = await generateSummary(text);
    
    return { text, keyTerms, summary };
  } catch (error) {
    console.error('Error analyzing document:', error);
  }
}

// Extract text from document
async function extractText(filePath) {
  try {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(filePath);
    return text;
  } catch (error) {
    console.error('Error extracting text:', error);
  }
}