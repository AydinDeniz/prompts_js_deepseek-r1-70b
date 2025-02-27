// prevent-special-characters.js
class CharacterValidator {
  constructor(inputId, allowedChars = []) {
    this.input = document.getElementById(inputId);
    this.allowedChars = allowedChars;
    this.invalidChars = [];
    this.feedbackElement = document.createElement('div');
    this.feedbackElement.className = 'validation-feedback';
    this.input.after(this.feedbackElement);

    this.initialize();
  }

  initialize() {
    this.input.addEventListener('paste', (e) => this.handlePaste(e));
    this.input.addEventListener('input', () => this.validateInput());
  }

  handlePaste(e) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    const cleanData = this.sanitizeInput(pastedData);
    if (cleanData !== pastedData) {
      this.showFeedback('Special characters removed from pasted content.');
      document.execCommand('insertText', false, cleanData);
    }
  }

  validateInput() {
    const inputValue = this.input.value;
    const isValid = this.checkForInvalidChars(inputValue);
    this.showValidationStatus(isValid);
  }

  sanitizeInput(input) {
    return input.replace(/[^a-zA-Z0-9\s]/g, '');
  }

  checkForInvalidChars(input) {
    const matches = input.match(/[^a-zA-Z0-9\s]/g) || [];
    this.invalidChars = matches;
    return matches.length === 0;
  }

  showValidationStatus(isValid) {
    this.feedbackElement.style.color = isValid ? 'green' : 'red';
    if (!isValid && this.invalidChars.length > 0) {
      this.showFeedback(`Invalid characters detected: ${this.invalidChars.join(', ')}`);
    } else {
      this.clearFeedback();
    }
  }

  showFeedback(message) {
    this.feedbackElement.textContent = message;
    this.feedbackElement.style.opacity = '1';
    setTimeout(() => {
      this.feedbackElement.style.opacity = '0';
    }, 3000);
  }

  clearFeedback() {
    this.feedbackElement.textContent = '';
    this.feedbackElement.style.opacity = '0';
  }

  destroy() {
    this.input.removeEventListener('paste', this.handlePaste);
    this.input.removeEventListener('input', this.validateInput);
    this.feedbackElement.remove();
  }
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  const validator = new CharacterValidator('myInput', [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' '
  ]);
});