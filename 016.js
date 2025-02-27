const express = require('express');
const router = express.Router();
const pg = require('pg');
const uuid = require('uuid');
const fs = require('fs');

// Database connection configuration
const config = {
    host: 'your-database-host',
    database: 'your-database-name',
    user: 'your-database-user',
    password: 'your-database-password',
    port: 5432
};

// Initialize the router
router.get('/polls', (req, res) => {
    // Get all polls from the database
    const query = 'SELECT * FROM polls';
    const conn = await pg.connect(config);

    try {
        const result = await conn.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching polls:', error);
        res.status(500).json({ error: 'Failed to fetch polls' });
    } finally {
        conn.end();
    }
});

// Create a new poll
router.post('/create-poll', (req, res) => {
    const { title, question, options } = req.body;

    if (!title || !question || !Array.isArray(options)) {
        return res.status(400).json({ error: 'Invalid poll data' });
    }

    const newPoll = {
        id: uuid.v4(),
        title,
        question,
        options: options.map(option => ({
            text: option.text,
            votes: 0
        })),
        createdAt: new Date().toISOString()
    };

    const conn = await pg.connect(config);

    try {
        const query = 'INSERT INTO polls (id, title, question, options, created_at) VALUES ($1, $2, $3, $4, $5)';
        const result = await conn.query(query, [
            newPoll.id,
            newPoll.title,
            newPoll.question,
            newPoll.options,
            newPoll.createdAt
        ]);

        res.json({ id: newPoll.id, success: true });
    } catch (error) {
        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Failed to create poll' });
    } finally {
        conn.end();
    }
});

// Get poll details
router.get('/poll/:id', (req, res) => {
    const conn = await pg.connect(config);

    try {
        const query = 'SELECT * FROM polls WHERE id = $1';
        const result = await conn.query(query, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Poll not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching poll details:', error);
        res.status(500).json({ error: 'Failed to fetch poll details' });
    } finally {
        conn.end();
    }
});

// Update poll
router.put('/update-poll/:id', (req, res) => {
    const { title, question, options } = req.body;

    if (!title || !question || !Array.isArray(options)) {
        return res.status(400).json({ error: 'Invalid poll data' });
    }

    const conn = await pg.connect(config);

    try {
        const query = 'UPDATE polls SET title = $1, question = $2, options = $3 WHERE id = $4';
        const result = await conn.query(query, [
            title,
            question,
            options,
            req.params.id
        ]);

        res.json({ id: req.params.id, success: true });
    } catch (error) {
        console.error('Error updating poll:', error);
        res.status(500).json({ error: 'Failed to update poll' });
    } finally {
        conn.end();
    }
});

// Delete poll
router.delete('/delete-poll/:id', (req, res) => {
    const conn = await pg.connect(config);

    try {
        const query = 'DELETE FROM polls WHERE id = $1';
        const result = await conn.query(query, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Poll not found' });
        }

        res.json({ id: req.params.id, success: true });
    } catch (error) {
        console.error('Error deleting poll:', error);
        res.status(500).json({ error: 'Failed to delete poll' });
    } finally {
        conn.end();
    }
});

// Vote for a poll option
router.post('/vote/:pollId/:optionId', (req, res) => {
    const { pollId, optionId } = req.params;

    const conn = await pg.connect(config);

    try {
        // Check if the option exists
        const query = 'SELECT * FROM poll_options WHERE id = $1';
        const result = await conn.query(query, [optionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Option not found' });
        }

        // Update the vote count
        const queryUpdate = 'UPDATE poll_options SET votes = $1 WHERE id = $2';
        const resultUpdate = await conn.query(queryUpdate, [
            result.rows[0].votes + 1,
            optionId
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error voting:', error);
        res.status(500).json({ error: 'Failed to vote' });
    } finally {
        conn.end();
    }
});

// Get poll results
router.get('/poll-results/:id', (req, res) => {
    const conn = await pg.connect(config);

    try {
        // Get the poll details
        const pollQuery = 'SELECT * FROM polls WHERE id = $1';
        const pollResult = await conn.query(pollQuery, [req.params.id]);

        if (pollResult.rows.length === 0) {
            return res.status(404).json({ error: 'Poll not found' });
        }

        // Calculate results
        const options = pollResult.rows[0].options;
        const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);

        const results = options.map(option => ({
            text: option.text,
            votes: option.votes,
            percentage: (option.votes / totalVotes) * 100
        }));

        res.json({ results });
    } catch (error) {
        console.error('Error calculating results:', error);
        res.status(500).json({ error: 'Failed to calculate results' });
    } finally {
        conn.end();
    }
});

module.exports = router;