// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tensorflowjs": "^3.18.0",
    "mongodb": "^4.5.0",
    "socket.io": "^4.5.4"
  }
}

// Adaptive learning model (model.js)
const tf = require('@tensorflow/tfjs');

async function trainModel(learnerData) {
  const tensorData = tf.tensor2d(learnerData);
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

async function adjustDifficulty(model, learnerProgress) {
  const tensor = tf.tensor2d([learnerProgress]);
  const prediction = model.predict(tensor);
  return prediction.dataSync()[0];
}

// Learning content (content.js)
const content = [
  {
    id: 1,
    topic: 'Math',
    difficulty: 'easy',
    questions: [
      { id: 1, question: '2 + 2 = ?', answer: 4 },
      { id: 2, question: '3 + 1 = ?', answer: 4 }
    ]
  },
  {
    id: 2,
    topic: 'Math',
    difficulty: 'medium',
    questions: [
      { id: 3, question: '5 * 5 = ?', answer: 25 },
      { id: 4, question: '7 - 3 = ?', answer: 4 }
    ]
  }
];

// Progress tracking (progress.js)
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/education', { useNewUrlParser: true, useUnifiedTopology: true });

const learnerSchema = new mongoose.Schema({
  id: String,
  progress: {
    topic: String,
    difficulty: String,
    score: Number
  }
});

const Learner = mongoose.model('Learner', learnerSchema);

async function updateProgress(learnerId, topic, difficulty, score) {
  const learner = await Learner.findOneAndUpdate(
    { id: learnerId },
    { $set: { 'progress.topic': topic, 'progress.difficulty': difficulty, 'progress.score': score } },
    { new: true }
  );
  return learner;
}

// React component (App.js)
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function EducationPlatform() {
  const [learnerId, setLearnerId] = useState('');
  const [currentContent, setCurrentContent] = useState({});
  const [progress, setProgress] = useState({});

  useEffect(() => {
    const model = trainModel(progress);
    const difficulty = adjustDifficulty(model, progress.score);
    setCurrentContent(content.find(c => c.difficulty === difficulty));
  }, [progress]);

  const handleAnswer = async (questionId, answer) => {
    try {
      const correct = currentContent.questions.find(q => q.id === questionId).answer === answer;
      const score = correct ? 100 : 0;
      const updatedProgress = await updateProgress(learnerId, currentContent.topic, currentContent.difficulty, score);
      setProgress(updatedProgress.progress);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  return (
    <div>
      <h1>Interactive Online Education Platform</h1>
      <div className="learner-info">
        <input
          type="text"
          value={learnerId}
          onChange={(e) => setLearnerId(e.target.value)}
          placeholder="Enter learner ID"
        />
      </div>
      <div className="content">
        <h2>{currentContent.topic}</h2>
        <h3>Difficulty: {currentContent.difficulty}</h3>
        {currentContent.questions.map(question => (
          <div key={question.id}>
            <p>{question.question}</p>
            <input
              type="number"
              onChange={(e) => handleAnswer(question.id, parseInt(e.target.value))}
              placeholder="Enter answer"
            />
          </div>
        ))}
      </div>
      <div className="progress">
        <h2>Progress</h2>
        <p>Topic: {progress.topic}</p>
        <p>Difficulty: {progress.difficulty}</p>
        <p>Score: {progress.score}%</p>
      </div>
    </div>
  );
}

export default EducationPlatform;