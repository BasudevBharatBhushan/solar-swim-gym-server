require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Solar Swim Gym Backend API is running');
});

// Example Health Check
app.get('/health', async (req, res) => {
  try {
    const time = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: time.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
