// form-auto-save.js
class FormAutoSave {
  constructor(formId, saveInterval = 30000) {
    this.formId = formId;
    this.saveInterval = saveInterval;
    this.storageKey = `form_${formId}_data`;
    this.lastSaved = 0;
    this.initialize();
  }

  initialize() {
    // Restore saved data on page load
    this.restoreData();

    // Save form data periodically
    setInterval(() => {
      this.saveData();
    }, this.saveInterval);

    // Save data before page unload
    window.addEventListener('beforeunload', () => {
      this.saveData();
    });
  }

  saveData() {
    const formData = {};
    const form = document.getElementById(this.formId);
    const inputs = form.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
      if (input.name) {
        switch (input.type) {
          case 'checkbox':
          case 'radio':
            formData[input.name] = input.checked;
            break;
          default:
            formData[input.name] = input.value;
        }
      }
    });

    const saveData = {
      timestamp: new Date().getTime(),
      data: formData
    };

    localStorage.setItem(this.storageKey, JSON.stringify(saveData));
    this.lastSaved = saveData.timestamp;
  }

  restoreData() {
    const savedData = localStorage.getItem(this.storageKey);
    if (savedData) {
      const data = JSON.parse(savedData);
      const form = document.getElementById(this.formId);
      const inputs = form.querySelectorAll('input, textarea, select');

      inputs.forEach(input => {
        if (input.name) {
          const value = data.data[input.name];
          switch (input.type) {
            case 'checkbox':
            case 'radio':
              input.checked = value;
              break;
            default:
              input.value = value;
          }
        }
      });

      // Show confirmation message
      this.showMessage('Form data restored from last save.');
    }
  }

  showMessage(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '20px';
    toast.style.backgroundColor = '#4CAF50';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  }
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  const form = new FormAutoSave('myForm');
});