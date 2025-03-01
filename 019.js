// Frontend validation
function validateForm() {
    const requiredFields = [
        'firstName', 'lastName', 'email', 'phone',
        'date', 'time', 'doctor'
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

// Initialize calendar
document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay'
        },
        events: '/api/appointments',
        selectable: true,
        select: function(info) {
            showAppointmentForm(info.startStr, info.endStr);
        }
    });
    calendar.render();
});

// Show appointment form
function showAppointmentForm(start, end) {
    document.getElementById('appointmentForm').style.display = 'block';
    document.getElementById('date').value = start;
    document.getElementById('time').value = end;
}

// Hide appointment form
function hideAppointmentForm() {
    document.getElementById('appointmentForm').style.display = 'none';
}

// Submit appointment
async function submitAppointment() {
    if (!validateForm()) return;

    const appointmentData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        doctor: document.getElementById('doctor').value
    };

    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointmentData),
        });

        if (!response.ok) {
            throw new Error('Appointment booking failed');
        }

        const data = await response.json();
        alert('Appointment booked successfully');
        window.location.reload();
    } catch (error) {
        console.error('Error booking appointment:', error);
        alert('Failed to book appointment');
    }
}

// Event listeners
document.getElementById('submitAppointment').addEventListener('click', submitAppointment);
document.getElementById('cancelAppointment').addEventListener('click', hideAppointmentForm);