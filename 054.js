// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tensorflowjs": "^3.18.0",
    "twitter": "^5.1.1",
    "instagram-api": "^2.1.0",
    "vader-sentiment": "^4.0.1",
    "chart.js": "^3.7.1"
  }
}

// Sentiment analysis (sentiment.js)
const vader = require('vader-sentiment');

function analyzeSentiment(text) {
  const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(text);
  return sentiment.compound;
}

// Machine learning model (model.js)
const tf = require('@tensorflow/tfjs');

async function trainModel(tweets) {
  const tensorData = tf.tensor2d(tweets);
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

async function predictEngagement(model, tweet) {
  const tensor = tf.tensor2d([tweet]);
  const prediction = model.predict(tensor);
  return prediction.dataSync()[0];
}

// Social media API integration (api.js)
const Twitter = require('twitter');
const Instagram = require('instagram-api').default;

const twitterClient = new Twitter({
  consumer_key: 'your_consumer_key',
  consumer_secret: 'your_consumer_secret',
  access_token_key: 'your_access_token_key',
  access_token_secret: 'your_access_token_secret'
});

const instagram = new Instagram({
  username: 'your_username',
  password: 'your_password'
});

async function getTweets(screenName) {
  try {
    const response = await twitterClient.get(`statuses/user_timeline`, { screen_name: screenName });
    return response;
  } catch (error) {
    console.error('Error fetching tweets:', error);
    return [];
  }
}

async function getInstagramPosts(username) {
  try {
    await instagram.login();
    const response = await instagram.get(`users/${username}/media/recent/`);
    return response.items;
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    return [];
  }
}

// Data processing (data.js)
function processSocialData(data, platform) {
  if (platform === 'twitter') {
    return data.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      likes: tweet.favorite_count,
      retweets: tweet.retweet_count,
      timestamp: tweet.created_at
    }));
  } else if (platform === 'instagram') {
    return data.map(post => ({
      id: post.id,
      text: post.caption?.text || '',
      likes: post.likes.count,
      comments: post.comments.count,
      timestamp: post.created_time
    }));
  }
  return [];
}

// React component (App.js)
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

function SocialMediaAnalyzer() {
  const [platform, setPlatform] = useState('twitter');
  const [username, setUsername] = useState('');
  const [socialData, setSocialData] = useState([]);
  const [sentiment, setSentiment] = useState({});
  const [engagement, setEngagement] = useState({});

  useEffect(() => {
    const analyzeData = async () => {
      try {
        let data;
        if (platform === 'twitter') {
          data = await getTweets(username);
        } else if (platform === 'instagram') {
          data = await getInstagramPosts(username);
        }
        const processedData = processSocialData(data, platform);
        setSocialData(processedData);

        // Analyze sentiment
        const sentiments = processedData.map(post => analyzeSentiment(post.text));
        setSentiment({
          labels: processedData.map(post => post.id),
          data: sentiments
        });

        // Predict engagement
        const model = await trainModel(processedData.map(post => [post.likes, post.retweets]));
        const engagementPredictions = await Promise.all(
          processedData.map(post => predictEngagement(model, [post.likes, post.retweets]))
        );
        setEngagement({
          labels: processedData.map(post => post.id),
          data: engagementPredictions
        });
      } catch (error) {
        console.error('Error analyzing data:', error);
      }
    };

    if (username) {
      analyzeData();
    }
  }, [platform, username]);

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div>
      <h1>Social Media Feed Analyzer</h1>
      <div className="platform-selector">
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="twitter">Twitter</option>
          <option value="instagram">Instagram</option>
        </select>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
        />
      </div>
      <div className="data-analysis">
        <h2>Sentiment Analysis</h2>
        <Bar data={{ labels: sentiment.labels, datasets: [{ data: sentiment.data }] }} options={chartOptions} />
        <h2>Engagement Prediction</h2>
        <Bar data={{ labels: engagement.labels, datasets: [{ data: engagement.data }] }} options={chartOptions} />
      </div>
    </div>
  );
}

export default SocialMediaAnalyzer;