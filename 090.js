// rich-text.js
class RichTextDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.formatter = new Formatter();
    this.inputValidator = new InputValidator();
  }

  displayText(text) {
    try {
      // Validate the input text
      this.inputValidator.validate(text);
      
      // Format the text
      const formattedText = this.formatter.applyFormatting(text);
      
      // Display the formatted text
      this.container.innerHTML = formattedText;
    } catch (error) {
      console.error('Error displaying text:', error);
      this.container.innerHTML = `<p class="error">${error.message}</p>`;
    }
  }
}

class Formatter {
  applyFormatting(text) {
    // Bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Underline text
    text = text.replace(/_(.*?)_/g, '<u>$1</u>');
    
    // Strikethrough text
    text = text.replace(/~(.*?)~/g, '<s>$1</s>');
    
    // Headers
    text = text.replace(/#{3,} (.*)/g, '<h3>$1</h3>');
    text = text.replace(/#{2} (.*)/g, '<h2>$1</h2>');
    text = text.replace(/#{1} (.*)/g, '<h1>$1</h1>');
    
    // Lists
    text = text.replace(/^(?:-|\+|\*)\s+(.*)$/gm, '<li>$1</li>');
    text = text.replace(/((?:-|\+|\*)\s+.+$)+/g, '<ul>$1</ul>');
    
    // Links
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
    // Images
    text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
    
    return text;
  }
}

class InputValidator {
  validate(text) {
    // Check for script tags
    if (/<script>/gi.test(text)) {
      throw new Error('Script tags are not allowed.');
    }
    
    // Check for SQL injection attempts
    if (/(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)/gi.test(text)) {
      throw new Error('SQL injection attempt detected.');
    }
    
    // Check for XSS patterns
    if (/(<.*>|>)/gi.test(text)) {
      throw new Error('Invalid characters detected.');
    }
  }
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  const display = new RichTextDisplay('output');
  
  document.getElementById('input').addEventListener('input', (e) => {
    display.displayText(e.target.value);
  });
});