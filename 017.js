// Frontend validation
function validateForm() {
    const requiredFields = [
        'firstName', 'lastName', 'email', 'phone',
        'pickupDate', 'returnDate', 'carType'
    ];

    for (const field of requiredFields) {
        const input = document.getElementById(field);
        if (!input.value.trim()) {
            alert(`${field} is required`);
            return false;
        }
    }

    const email = document.getElementById('email').value;
    if (!validateEmail(email)) {
        alert('Please enter a valid email address');
        return false;
    }

    const phone = document.getElementById('phone').value;
    if (!validatePhone(phone)) {
        alert('Please enter a valid phone number');
        return false;
    }

    const pickupDate = new Date(document.getElementById('pickupDate').value);
    const returnDate = new Date(document.getElementById('returnDate').value);
    if (pickupDate >= returnDate) {
        alert('Return date must be after pick-up date');
        return false;
    }

    return true;
}

// Email validation
function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Phone validation
function validatePhone(phone) {
    const phonePattern = /^\d{10}$/;
    return phonePattern.test(phone);
}

// Search for available cars
async function searchCars() {
    try {
        const pickupDate = document.getElementById('pickupDate').value;
        const returnDate = document.getElementById('returnDate').value;
        const carType = document.getElementById('carType').value;

        const response = await fetch(`/api/cars?pickupDate=${pickupDate}&returnDate=${returnDate}&carType=${carType}`);
        const data = await response.json();

        displayAvailableCars(data);
    } catch (error) {
        console.error('Error searching cars:', error);
        alert('Failed to search for cars');
    }
}

// Display available cars
function displayAvailableCars(cars) {
    const carList = document.getElementById('carList');
    carList.innerHTML = cars.map(car => `
        <div class="car-item">
            <h3>${car.model}</h3>
            <p>Year: ${car.year}</p>
            <p>Price: $${car.dailyRate}</p>
            <button class="btn" onclick="selectCar(${car.id})">Select</button>
        </div>
    `).join('');
}

// Select car and populate details
function selectCar(carId) {
    fetch(`/api/cars/${carId}`)
        .then(response => response.json())
        .then(car => {
            document.getElementById('selectedCar').textContent = `${car.model} (${car.year})`;
            document.getElementById('carId').value = car.id;
        })
        .catch(error => {
            console.error('Error selecting car:', error);
        });
}

// Submit booking
async function submitBooking() {
    if (!validateForm()) return;

    const bookingData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        pickupDate: document.getElementById('pickupDate').value,
        returnDate: document.getElementById('returnDate').value,
        carId: document.getElementById('carId').value,
        paymentMethod: document.getElementById('paymentMethod').value
    };

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData),
        });

        if (!response.ok) {
            throw new Error('Booking failed');
        }

        const data = await response.json();
        alert('Booking successful');
        window.location.href = `/confirmation/${data.id}`;
    } catch (error) {
        console.error('Error submitting booking:', error);
        alert('Failed to submit booking');
    }
}

// Event listeners
document.getElementById('searchCars').addEventListener('click', searchCars);
document.getElementById('submitBooking').addEventListener('click', submitBooking);