// Dark mode toggle functionality

// Theme constants
const THEME = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Get saved theme
function getSavedTheme() {
  return localStorage.getItem('theme') || THEME.LIGHT;
}

// Set theme
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// Toggle theme
function toggleTheme() {
  const currentTheme = getSavedTheme();
  const newTheme = currentTheme === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
  setTheme(newTheme);
}

// Initialize theme
function initializeTheme() {
  const savedTheme = getSavedTheme();
  setTheme(savedTheme);
}

// Add event listener for theme toggle button
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// Initialize theme on page load
initializeTheme();
/* light.css */
[data-theme="light"] {
  background-color: #ffffff;
  color: #000000;
}

/* dark.css */
[data-theme="dark"] {
  background-color: #1a1a1a;
  color: #ffffff;
}
// theme-toggle.js
const THEME = {
  LIGHT: 'light',
  DARK: 'dark'
};

function getSavedTheme() {
  return localStorage.getItem('theme') || THEME.LIGHT;
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const currentTheme = getSavedTheme();
  const newTheme = currentTheme === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
  setTheme(newTheme);
}

function initializeTheme() {
  const savedTheme = getSavedTheme();
  setTheme(savedTheme);
}

document.getElementById('themeToggle').addEventListener('click', toggleTheme);
initializeTheme();