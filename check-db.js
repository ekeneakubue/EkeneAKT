
const { Pool } = require('pg');
require('dotenv').config();

async function check() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'displayOrder'");
        console.log('Column check result:', res.rows);
    } catch (err) {
        console.error('Error checking column:', err);
    } finally {
        await pool.end();
    }
}

check();
