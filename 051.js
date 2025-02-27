// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "mongodb": "^4.5.0",
    "chart.js": "^3.7.1",
    "date-fns": "^2.28.0"
  }
}

// Transaction model (transaction.js)
class Transaction {
  constructor(id, description, amount, category, date) {
    this.id = id;
    this.description = description;
    this.amount = amount;
    this.category = category;
    this.date = date;
  }
}

// MongoDB setup (db.js)
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/expenses', { useNewUrlParser: true, useUnifiedTopology: true });

const transactionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  category: String,
  date: Date
});

const Transaction = mongoose.model('Transaction', transactionSchema);

async function addTransaction(transaction) {
  const dbTransaction = new Transaction(transaction);
  return dbTransaction.save();
}

async function getTransactions() {
  return Transaction.find().sort({ date: -1 }).exec();
}

async function categorizeTransactions(transactions) {
  const categories = {};
  transactions.forEach(t => {
    if (!categories[t.category]) {
      categories[t.category] = 0;
    }
    categories[t.category] += t.amount;
  });
  return categories;
}

// React component (App.js)
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { format, startOfWeek, addDays } from 'date-fns';

function ExpenseTracker() {
  const [transactions, setTransactions] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('Food');
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    const fetchTransactions = async () => {
      const data = await getTransactions();
      setTransactions(data);
      const categories = await categorizeTransactions(data);
      setChartData({
        labels: Object.keys(categories),
        datasets: [{
          label: 'Expenses by Category',
          data: Object.values(categories),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      });
    };
    fetchTransactions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const transaction = new Transaction(
      Date.now().toString(),
      description,
      parseFloat(amount),
      category,
      new Date()
    );
    await addTransaction(transaction);
    setTransactions([...transactions, transaction]);
    setDescription('');
    setAmount(0);
  };

  return (
    <div>
      <h1>Expense Tracker</h1>
      <div className="transaction-form">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Food</option>
            <option>Transport</option>
            <option>Shopping</option>
            <option>Bills</option>
            <option>Entertainment</option>
          </select>
          <button type="submit">Add Transaction</button>
        </form>
      </div>
      <div className="transactions-list">
        <h2>Recent Transactions</h2>
        <ul>
          {transactions.map(t => (
            <li key={t.id}>
              <p>{format(new Date(t.date), 'MMM dd, yyyy')}</p>
              <p>{t.description}</p>
              <p>${t.amount.toFixed(2)}</p>
              <span className={`category ${t.category.toLowerCase()}`}>
                {t.category}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="expense-chart">
        <Bar data={chartData} />
      </div>
    </div>
  );
}

export default ExpenseTracker;