function validateAndSubmitForm(formId) {
    const form = document.getElementById(formId);
    const nameInput = form.querySelector('#name');
    const emailInput = form.querySelector('#email');
    const phoneInput = form.querySelector('#phone');

    // Validation functions
    function validateName(name) {
        return name.length >= 2 && /^[a-zA-Z ]+$/.test(name);
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePhone(phone) {
        return /^\d{10}$/.test(phone);
    }

    // Get values
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

    // Validate inputs
    if (!validateName(name)) {
        alert('Please enter a valid name with at least 2 letters');
        return;
    }
    if (!validateEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }
    if (!validatePhone(phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
    }

    // Prepare data
    const formData = {
        name,
        email,
        phone
    };

    // Submit data
    fetch('/api/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Form submitted successfully!');
            form.reset();
        } else {
            alert('Submission failed: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while submitting the form');
    });
}