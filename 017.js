document.addEventListener('DOMContentLoaded', function() {
    // Search form
    const searchForm = document.getElementById('searchForm');
    const searchResults = document.getElementById('searchResults');
    const bookingForm = document.getElementById('bookingForm');
    const errorMessages = document.getElementById('errorMessages');
    const successMessages = document.getElementById('successMessages');

    // Validation functions
    function validateSearchForm() {
        const inputs = document.querySelectorAll('input, select');
        let isValid = true;

        inputs.forEach(input => {
            if (input.value.trim() === '') {
                isValid = false;
                input.parentElement.classList.add('invalid');
            }
        });

        return isValid;
    }

    async function handleSearch() {
        try {
            const location = document.getElementById('location').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const carType = document.getElementById('carType').value;

            if (!validateSearchForm()) return;

            const response = await fetch(`https://your-express-server/api/search?location=${location}&startDate=${startDate}&endDate=${endDate}&carType=${carType}`);
            const cars = await response.json();

            displaySearchResults(cars);
        } catch (error) {
            showError(error.message);
        }
    }

    function displaySearchResults(cars) {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = '';

        if (cars.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    No cars available for your search criteria.
                </div>
            `;
        } else {
            cars.forEach(car => {
                const carElement = document.createElement('div');
                carElement.className = 'car-result';
                carElement.innerHTML = `
                    <div class="car-image">
                        <img src="${car.image}" alt="${car.model}">
                    </div>
                    <div class="car-details">
                        <h3>${car.model}</h3>
                        <p>${car.description}</p>
                        <div class="car-specs">
                            <p>${car.year} • ${car.transmission}</p>
                            <p>${car.seats} seats • ${car.fuelType}</p>
                        </div>
                        <div class="car-price">
                            <span>$${car.dailyRate}</span> per day
                        </div>
                    </div>
                `;
                resultsContainer.appendChild(carElement);
            });
        }
    }

    // Booking form
    function validateBookingForm() {
        const inputs = document.querySelectorAll('input, select, textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (input.value.trim() === '') {
                isValid = false;
                input.parentElement.classList.add('invalid');
            }
        });

        return isValid;
    }

    async function handleBooking() {
        try {
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                carId: document.getElementById('carId').value,
                startDate: document.getElementById('startDate').value,
                endDate: document.getElementById('endDate').value,
                paymentMethod: document.getElementById('paymentMethod').value,
                paymentAmount: document.getElementById('paymentAmount').value,
                insurance: document.getElementById('insurance').checked,
                additionalDrivers: document.getElementById('additionalDrivers').checked
            };

            if (!validateBookingForm()) return;

            const response = await fetch(`https://your-express-server/api/booking`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showSuccess('Booking successful!');
                bookingForm.reset();
                window.location.reload();
            } else {
                throw new Error('Booking failed');
            }
        } catch (error) {
            showError(error.message);
        }
    }

    // Event listeners
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleSearch();
    });

    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleBooking();
    });
});

// Display error messages
function showError(message) {
    errorMessages.textContent = message;
    errorMessages.style.display = 'block';
}

// Display success messages
function showSuccess(message) {
    successMessages.textContent = message;
    successMessages.style.display = 'block';
    setTimeout(() => {
        successMessages.style.display = 'none';
    }, 3000);
}

// Close search form
document.getElementById('closeSearch').addEventListener('click', function() {
    searchForm.reset();
    searchResults.innerHTML = '';
});