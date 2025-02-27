// backend/app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const moment = require('moment');

const app = express();
const port = process.env.PORT || 3000;

// Database configuration
const dbConfig = {
  user: 'your_username',
  host: 'localhost',
  database: 'healthcare',
  password: 'your_password',
  port: 5432,
};

const pool = new Pool(dbConfig);

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.post('/api/doctors', getDoctors);
app.post('/api/slots', getAvailableSlots);
app.post('/api/book', bookAppointment);
app.post('/api/patient/appointments', getPatientAppointments);

// Get available doctors
async function getDoctors(req, res) {
  try {
    const result = await pool.query('SELECT * FROM doctors WHERE is_available = true');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
}

// Get available time slots
async function getAvailableSlots(req, res) {
  try {
    const { doctorId, date } = req.body;
    if (!doctorId || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const formattedDate = moment(date).format('YYYY-MM-DD');
    const result = await pool.query(`
      SELECT * FROM time_slots 
      WHERE doctor_id = $1 AND date = $2 AND is_available = true
      ORDER BY time`, [doctorId, formattedDate]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
}

// Book appointment
async function bookAppointment(req, res) {
  try {
    const { doctorId, slotId, patientInfo } = req.body;
    if (!doctorId || !slotId || !patientInfo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert appointment
    const result = await pool.query(`
      INSERT INTO appointments 
      (doctor_id, slot_id, patient_name, patient_email, patient_phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`, 
      [doctorId, slotId, 
       patientInfo.name, patientInfo.email, patientInfo.phone]);

    // Update slot availability
    await pool.query('UPDATE time_slots SET is_available = false WHERE id = $1', [slotId]);

    res.status(201).json({ appointment: result.rows[0] });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
}

// Get patient appointments
async function getPatientAppointments(req, res) {
  try {
    const { patientEmail } = req.body;
    if (!patientEmail) {
      return res.status(400).json({ error: 'Missing patient email' });
    }

    const result = await pool.query(`
      SELECT * FROM appointments 
      WHERE patient_email = $1
      ORDER BY appointment_date DESC`, [patientEmail]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
}

// Start server
app.listen(port, () => {
  console.log(`Healthcare appointment scheduler running on port ${port}`);
});
// frontend/app.js
$(document).ready(function() {
  // Calendar initialization
  $('#calendar').fullCalendar({
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'month,agendaWeek,agendaDay'
    },
    events: '/api/events',
    selectable: true,
    selectHelper: true,
    select: function(start, end, allDay) {
      // Handle date selection
      const formattedStart = start.format();
      const formattedEnd = end.format();
      // Call backend to book appointment
    },
    eventDidMount: function(info) {
      // Add event details
    }
  });

  // Form submission
  $('#bookingForm').submit(function(e) {
    e.preventDefault();
    const formData = $(this).serializeArray();
    // Convert to object
    const data = {};
    formData.forEach(item => {
      data[item.name] = item.value;
    });
    // Validate inputs
    if (!data.doctor || !data.date || !data.patientName) {
      alert('Please fill in all required fields');
      return;
    }
    // Send request to backend
    $.ajax({
      type: 'POST',
      url: '/api/book',
      data: JSON.stringify(data),
      contentType: 'application/json',
      success: function(response) {
        // Handle success
      },
      error: function(xhr, status, error) {
        // Handle error
      }
    });
  });
});