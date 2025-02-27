// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tensorflowjs": "^3.18.0",
    "natural": "^0.6.3",
    "axios": "^0.21.1",
    "rss-parser": "^3.5.0"
  }
}

// News article model (article.js)
class Article {
  constructor(id, title, content, source, date) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.source = source;
    this.date = date;
    this.category = null;
    this.summary = null;
  }
}

// Machine learning model (model.js)
const tf = require('@tensorflow/tfjs');

async function trainModel(articles) {
  const tensorData = tf.tensor2d(articles);
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

async function categorizeArticle(model, article) {
  const tensor = tf.tensor2d([article.content]);
  const prediction = model.predict(tensor);
  return prediction.dataSync()[0];
}

// NLP processing (nlp.js)
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const PorterStemmer = natural.PorterStemmer;

function summarizeArticle(article) {
  const tokens = tokenizer.tokenize(article.content);
  const stems = tokens.map(token => PorterStemmer.stem(token));
  return stems.join(' ');
}

// RSS feed parser (rss.js)
const Parser = require('rss-parser');

const parser = new Parser();

async function fetchFeed(url) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items;
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return [];
  }
}

// React component (App.js)
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function NewsAggregator() {
  const [sources, setSources] = useState([
    'http://rss.cnn.com/rss/cnn_topstories.rss',
    'http://feeds.bbci.co.uk/news/rss.xml'
  ]);
  const [articles, setArticles] = useState([]);
  const [preferences, setPreferences] = useState({});

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const allArticles = [];
        for (const source of sources) {
          const feed = await fetchFeed(source);
          allArticles.push(...feed.map(article => new Article(
            Date.now().toString(),
            article.title,
            article.content,
            article.link,
            article.pubDate
          )));
        }
        setArticles(allArticles);
      } catch (error) {
        console.error('Error loading articles:', error);
      }
    };
    loadArticles();
  }, [sources]);

  const handlePreferenceChange = async (category, weight) => {
    try {
      const model = await trainModel(articles);
      const updatedPreferences = { ...preferences, [category]: weight };
      setPreferences(updatedPreferences);
      const filteredArticles = articles.filter(article => {
        const prediction = await categorizeArticle(model, article);
        return prediction >= weight;
      });
      setArticles(filteredArticles);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const handleSummarize = (article) => {
    const summary = summarizeArticle(article);
    return summary;
  };

  return (
    <div>
      <h1>Personalized News Aggregator</h1>
      <div className="sources">
        <h2>News Sources</h2>
        <ul>
          {sources.map(source => (
            <li key={source}>{source}</li>
          ))}
        </ul>
      </div>
      <div className="preferences">
        <h2>Preferences</h2>
        <div className="preference-categories">
          {Object.keys(preferences).map(category => (
            <div key={category}>
              <label>{category}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={preferences[category]}
                onChange={(e) => handlePreferenceChange(category, parseFloat(e.target.value))}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="articles">
        <h2>Personalized Articles</h2>
        <ul>
          {articles.map(article => (
            <li key={article.id}>
              <h3>{article.title}</h3>
              <p>{handleSummarize(article)}</p>
              <p>Source: {article.source}</p>
              <p>Date: {new Date(article.date).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default NewsAggregator;