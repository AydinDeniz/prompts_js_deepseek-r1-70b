function validateAndSubmitForm(formData) {
    // Validation logic
    const validationRules = {
        name: {
            required: true,
            minLength: 2,
            maxLength: 50
        },
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            maxLength: 100
        },
        phone: {
            required: true,
            pattern: /^\d{10}$/,
            maxLength: 10
        }
    };

    let isValid = true;

    // Validate name
    if (!formData.name) {
        alert('Name is required');
        isValid = false;
    } else if (formData.name.length < validationRules.name.minLength || formData.name.length > validationRules.name.maxLength) {
        alert('Name must be between 2 and 50 characters');
        isValid = false;
    }

    // Validate email
    if (!formData.email) {
        alert('Email is required');
        isValid = false;
    } else if (!validationRules.email.pattern.test(formData.email)) {
        alert('Please enter a valid email address');
        isValid = false;
    } else if (formData.email.length > validationRules.email.maxLength) {
        alert('Email must be less than 100 characters');
        isValid = false;
    }

    // Validate phone number
    if (!formData.phone) {
        alert('Phone number is required');
        isValid = false;
    } else if (!validationRules.phone.pattern.test(formData.phone)) {
        alert('Please enter a valid 10-digit phone number');
        isValid = false;
    } else if (formData.phone.length > validationRules.phone.maxLength) {
        alert('Phone number must be 10 digits');
        isValid = false;
    }

    if (!isValid) return;

    // Submit data using Fetch API
    fetch('/api/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        alert('Form submitted successfully');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error submitting form. Please try again later.');
    });
}