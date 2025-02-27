// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io": "^4.5.4",
    "google-translate-api": "^2.0.1",
    "fluent-ffmpeg": "^2.1.2"
  }
}

// Web Speech API setup (speech.js)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = 'en-US';

let isListening = false;

function startListening() {
  isListening = true;
  recognition.start();
}

function stopListening() {
  isListening = false;
  recognition.stop();
}

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  handleTranscription(transcript);
};

recognition.onerror = (event) => {
  console.error('Error occurred in recognition:', event.error);
};

// Translation functionality (translate.js)
const translate = require('google-translate-api');

async function translateText(text, targetLang) {
  try {
    const translation = await translate(text, { to: targetLang });
    return translation.text;
  } catch (error) {
    console.error('Translation failed:', error);
    return text;
  }
}

// Audio handling (audio.js)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioStream;

async function requestAudio() {
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(audioStream);
    const analyzer = audioContext.createAnalyser();
    const gain = audioContext.createGain();
    
    source.connect(analyzer);
    analyzer.fftSize = 2048;
    analyzer.connect(gain);
    gain.connect(audioContext.destination);
  } catch (error) {
    console.error('Audio access denied:', error);
  }
}

// React component (App.js)
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function LanguageTranslator() {
  const [language, setLanguage] = useState('en');
  const [translation, setTranslation] = useState('');
  const [isListening, setIsListening] = useState(false);
  const socket = io();

  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === ' ' && !isListening) {
        startListening();
        setIsListening(true);
      } else if (e.key === 'Escape') {
        stopListening();
        setIsListening(false);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isListening]);

  const handleTranscription = async (transcript) => {
    try {
      const translatedText = await translateText(transcript, language);
      setTranslation(translatedText);
      socket.emit('translation', translatedText);
    } catch (error) {
      console.error('Error handling transcription:', error);
    }
  };

  return (
    <div>
      <h1>Real-Time Language Translator</h1>
      <div className="translator-interface">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
        </select>
        <button
          onClick={() => {
            if (isListening) {
              stopListening();
            } else {
              startListening();
            }
            setIsListening(!isListening);
          }}
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
        <div className="transcription">
          <h3>Original:</h3>
          <p>{translation}</p>
        </div>
      </div>
    </div>
  );
}

export default LanguageTranslator;