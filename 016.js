// Server-side code
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Database configuration
const dbConfig = {
    user: 'your_username',
    host: 'localhost',
    database: 'polls',
    password: 'your_password',
    port: 5432,
};

const pool = new Pool(dbConfig);

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.post('/api/create-poll', createPoll);
app.post('/api/vote', vote);
app.get('/api/results', getResults);

// Create poll
async function createPoll(req, res) {
    try {
        const { question, options } = req.body;
        const result = await pool.query(`
            INSERT INTO polls (question, created_at)
            VALUES ($1, NOW())
            RETURNING *`, [question]);

        const pollId = result.rows[0].id;

        for (const option of options) {
            await pool.query(`
                INSERT INTO poll_options (poll_id, option, votes)
                VALUES ($1, $2, 0)`, [pollId, option]);
        }

        res.status(201).json({ pollId });
    } catch (error) {
        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Failed to create poll' });
    }
}

// Vote
async function vote(req, res) {
    try {
        const { pollId, optionId } = req.body;
        if (!pollId || !optionId) {
            return res.status(400).json({ error: 'Missing poll or option ID' });
        }

        await pool.query(`
            UPDATE poll_options
            SET votes = votes + 1
            WHERE id = $1`, [optionId]);

        res.status(200).json({ message: 'Vote recorded successfully' });
    } catch (error) {
        console.error('Error recording vote:', error);
        res.status(500).json({ error: 'Failed to record vote' });
    }
}

// Get results
async function getResults(req, res) {
    try {
        const { pollId } = req.query;
        if (!pollId) {
            return res.status(400).json({ error: 'Missing poll ID' });
        }

        const results = await pool.query(`
            SELECT p.question, po.option, po.votes
            FROM polls p
            LEFT JOIN poll_options po ON p.id = po.poll_id
            WHERE p.id = $1`, [pollId]);

        res.status(200).json(results.rows);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
}

// Start server
app.listen(port, () => {
    console.log(`Polling system server running on port ${port}`);
});
// Client-side code
const createPollForm = document.getElementById('create-poll-form');
const voteForm = document.getElementById('vote-form');
const resultsDiv = document.getElementById('results');

// Create poll
createPollForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(createPollForm);
    const data = {
        question: formData.get('question'),
        options: Array.from(formData.getAll('option'))
    };

    try {
        const response = await fetch('/api/create-poll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to create poll');
        }

        const { pollId } = await response.json();
        window.location.href = `/poll/${pollId}`;
    } catch (error) {
        console.error('Error creating poll:', error);
        alert('Failed to create poll');
    }
});

// Vote
voteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(voteForm);
    const data = {
        pollId: formData.get('pollId'),
        optionId: formData.get('optionId')
    };

    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to record vote');
        }

        updateResults();
    } catch (error) {
        console.error('Error recording vote:', error);
        alert('Failed to record vote');
    }
});

// Update results
async function updateResults() {
    try {
        const pollId = window.location.pathname.split('/').pop();
        const response = await fetch(`/api/results?pollId=${pollId}`);
        const results = await response.json();

        resultsDiv.innerHTML = results.map(result => `
            <div>
                <p>${result.option}</p>
                <p>Votes: ${result.votes}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching results:', error);
    }
}

// Initial results load
updateResults();