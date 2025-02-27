// Idle detection and auto-logout functionality

let timeoutId;
let timeoutWarningId;
let timeoutLogoutId;
let lastActivity = new Date();

// Time in milliseconds
const INACTIVE_TIME = 30000; // 30 seconds
const WARNING_TIME = 10000;  // 10 seconds

// Warning modal
const warningModal = `
  <div id="warningModal" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.5); z-index: 1000;">
    <h3>Idle Detection Warning</h3>
    <p>You have been inactive for ${INACTIVE_TIME / 1000} seconds.</p>
    <p>Please respond within ${WARNING_TIME / 1000} seconds to stay logged in.</p>
  </div>
`;

// Show warning modal
function showWarning() {
  document.body.innerHTML += warningModal;
}

// Hide warning modal
function hideWarning() {
  const modal = document.getElementById('warningModal');
  if (modal) {
    modal.remove();
  }
}

// Log out user
function logout() {
  // Add actual logout logic here
  console.log('User has been logged out due to inactivity.');
  window.location.href = '/login';
}

// Reset timeout
function resetTimeout() {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    showWarning();
    timeoutWarningId = setTimeout(logout, WARNING_TIME);
  }, INACTIVE_TIME);
}

// Event listeners
document.addEventListener('mousemove', resetTimeout);
document.addEventListener('keydown', resetTimeout);

// Initial setup
resetTimeout();