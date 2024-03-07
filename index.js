const express = require('express');
const app = express();
const path = require('path');
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://localhost/acme_flavors_db',
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// GET all flavors
app.get('/api/flavors', async (req, res) => {
    try {
        const { rows } = await client.query('SELECT * FROM flavors');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET a single flavor by id
app.get('/api/flavors/:id', async (req, res) => {
    try {
        const { rows } = await client.query('SELECT * FROM flavors WHERE id = $1', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).send('Flavor not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST a new flavor
app.post('/api/flavors', async (req, res) => {
    try {
        const { name, is_favorite } = req.body;
        const { rows } = await client.query('INSERT INTO flavors (name, is_favorite) VALUES ($1, $2) RETURNING *', [name, is_favorite]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE a flavor by id
app.delete('/api/flavors/:id', async (req, res) => {
    try {
        await client.query('DELETE FROM flavors WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT (update) a flavor by id
app.put('/api/flavors/:id', async (req, res) => {
    try {
        const { name, is_favorite } = req.body;
        const { rows } = await client.query('UPDATE flavors SET name = $1, is_favorite = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *', [name, is_favorite, req.params.id]);
        if (rows.length === 0) {
            return res.status(404).send('Flavor not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function init() {
    try {
        await client.connect();
        console.log('Connected to database.');

        const SQL = `
            DROP TABLE IF EXISTS flavors;
            CREATE TABLE flavors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                is_favorite BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await client.query(SQL);
        console.log('Database initialized.');

        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    } catch (err) {
        console.error('Failed to connect to the database or initialize it', err);
    }
}

init();
