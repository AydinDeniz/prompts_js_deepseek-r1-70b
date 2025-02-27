// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tensorflowjs": "^3.18.0",
    "papaparse": "^5.3.2",
    "chart.js": "^3.7.1"
  }
}

// Machine learning model (model.js)
const tf = require('@tensorflow/tfjs');

async function trainModel(expenses) {
  const tensorData = tf.tensor2d(expenses);
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

async function forecastSavings(model, income) {
  const tensor = tf.tensor2d([income]);
  const prediction = model.predict(tensor);
  return prediction.dataSync()[0];
}

// Data processing (data.js)
const Papa = require('papaparse');

async function processExpenses(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (result) => resolve(result.data),
      header: true,
      dynamicTyping: true,
      complete: (result, file) => resolve(result.data),
      error: (error, file, input, reason, row) => reject(error)
    });
  });
}

// Budget recommendations (budget.js)
function generateBudget(income, expenses) {
  const budget = {
    income,
    expenses: expenses.reduce((acc, expense) => acc + expense.amount, 0),
    savings: income - expenses.reduce((acc, expense) => acc + expense.amount, 0),
    recommendations: []
  };

  if (budget.savings < 0) {
    budget.recommendations.push('Reduce expenses to avoid deficit');
  }

  return budget;
}

// React component (App.js)
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

function FinanceAssistant() {
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [forecast, setForecast] = useState(0);

  useEffect(() => {
    const model = trainModel(expenses);
    const prediction = forecastSavings(model, income);
    setForecast(prediction);
  }, [expenses, income]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const expenseData = await processExpenses(file);
    setExpenses(expenseData);
  };

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Savings Forecast',
      data: [forecast],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  return (
    <div>
      <h1>Personal Finance Management Assistant</h1>
      <div className="input-section">
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(parseFloat(e.target.value))}
          placeholder="Enter monthly income"
        />
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
        />
      </div>
      <div className="budget-summary">
        <h2>Budget Summary</h2>
        <p>Income: ${income}</p>
        <p>Expenses: ${expenses.reduce((acc, expense) => acc + expense.amount, 0)}</p>
        <p>Savings: ${income - expenses.reduce((acc, expense) => acc + expense.amount, 0)}</p>
      </div>
      <div className="forecast">
        <h2>Savings Forecast</h2>
        <Line data={chartData} />
      </div>
    </div>
  );
}

export default FinanceAssistant;