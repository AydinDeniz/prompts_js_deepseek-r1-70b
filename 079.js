// Typing speed monitor

let startTime;
let numWords = 0;
let numErrors = 0;
const targetWpm = 60;
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const progressBar = document.getElementById('progressBar');

// Start timer when typing starts
document.getElementById('textInput').addEventListener('focus', () => {
  startTime = Date.now();
});

// Calculate WPM and accuracy
function calculateStats() {
  const elapsed = (Date.now() - startTime) / 1000 / 60; // Hours
  const wpm = numWords / elapsed;
  const accuracy = ((numWords - numErrors) / numWords) * 100;

  wpmElement.textContent = `WPM: ${wpm.toFixed(2)}`;
  accuracyElement.textContent = `Accuracy: ${accuracy.toFixed(2)}%`;

  // Update progress bar
  const progress = (wpm / targetWpm) * 100;
  progressBar.style.width = `${Math.min(progress, 100)}%`;
}

// Check for errors and count words
function checkInput() {
  const text = this.value;
  const words = text.trim().split(/\s+/);
  numWords = words.length;

  // Count errors (example: check for lowercase letters)
  numErrors = words.filter(word => word !== word.toLowerCase()).length;

  calculateStats();
}

// Add event listener for input
document.getElementById('textInput').addEventListener('input', debounce(checkInput, 500));

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(func, wait);
  };
}
// typing-speed.js
let startTime;
let numWords = 0;
let numErrors = 0;
const targetWpm = 60;
const wpmElement = document.getElementById('wpm');
const accuracyElement = document.getElementById('accuracy');
const progressBar = document.getElementById('progressBar');

document.getElementById('textInput').addEventListener('focus', () => {
  startTime = Date.now();
});

function calculateStats() {
  const elapsed = (Date.now() - startTime) / 1000 / 60; // Hours
  const wpm = numWords / elapsed;
  const accuracy = ((numWords - numErrors) / numWords) * 100;

  wpmElement.textContent = `WPM: ${wpm.toFixed(2)}`;
  accuracyElement.textContent = `Accuracy: ${accuracy.toFixed(2)}%`;

  const progress = (wpm / targetWpm) * 100;
  progressBar.style.width = `${Math.min(progress, 100)}%`;
}

function checkInput() {
  const text = this.value;
  const words = text.trim().split(/\s+/);
  numWords = words.length;

  numErrors = words.filter(word => word !== word.toLowerCase()).length;

  calculateStats();
}

document.getElementById('textInput').addEventListener('input', debounce(checkInput, 500));

function debounce(func, wait) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(func, wait);
  };
}