<script>
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('userForm');
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const errorMessage = document.getElementById('error');
    const successMessage = document.getElementById('success');

    function validateForm() {
        let isValid = true;

        // Check name
        if (name.value.trim() === '') {
            errorMessage.textContent = 'Name is required';
            isValid = false;
        }

        // Check email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            errorMessage.textContent = 'Invalid email format';
            isValid = false;
        }

        // Check phone number
        const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
        if (!phoneRegex.test(phone.value)) {
            errorMessage.textContent = 'Invalid phone number';
            isValid = false;
        }

        return isValid;
    }

    async function handleSubmit() {
        errorMessage.textContent = '';
        successMessage.textContent = '';

        if (validateForm()) {
            try {
                const formData = {
                    name: name.value,
                    email: email.value,
                    phone: phone.value
                };

                const response = await fetch('https://your-node-js-endpoint.herokuapp.com/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    successMessage.textContent = 'User data submitted successfully!';
                    form.reset();
                } else {
                    throw new Error('Submission failed');
                }
            } catch (error) {
                errorMessage.textContent = error.message;
            }
        }
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleSubmit();
    });
});
</script>