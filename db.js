const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Initializes the database schema
 */
async function initDB() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      sender_id BIGINT,
      username TEXT,
      message_text TEXT,
      chat_title TEXT,
      link_to_msg TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(queryText);
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
}

/**
 * Saves a new lead to the database
 */
async function saveLead(lead) {
  const queryText = `
    INSERT INTO leads (sender_id, username, message_text, chat_title, link_to_msg)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [
    lead.senderId,
    lead.username,
    lead.text,
    lead.chatTitle,
    lead.link
  ];
  try {
    const res = await pool.query(queryText, values);
    return res.rows[0];
  } catch (err) {
    console.error('❌ Error saving lead:', err);
    throw err;
  }
}

module.exports = {
  pool,
  initDB,
  saveLead
};
