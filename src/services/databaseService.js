const { Pool } = require('pg');
const dbConfig = require('../config/dbConfig');

class DatabaseService {
  constructor() {
    this.pool = new Pool(dbConfig);
  }

  async initializeTables() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        source VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, email, phone)
      )
    `;
    
    try {
      await this.pool.query(createTableQuery);
      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing database tables:', error);
      throw error;
    }
  }

  async saveContact(name, email, phone, source) {
    try {
      await this.pool.query(
        'INSERT INTO contacts (name, email, phone, source) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [name, email, phone, source]
      );
    } catch (error) {
      console.error('Error saving contact:', error);
      throw error;
    }
  }

  async findContacts(query) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM contacts WHERE name ILIKE $1',
        [`${query}%`]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding contacts:', error);
      throw error;
    }
  }
}

module.exports = DatabaseService;