const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('miningDatabase.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQlite database.');
    }
});

db.serialize(() => {
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
    );`);

    // Create wallets table
    db.run(`CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        address TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );`);

    // Create mining_stats table
    db.run(`CREATE TABLE IF NOT EXISTS mining_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        hash_rate REAL NOT NULL,
        shares INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );`);

    // Create pool_configs table
    db.run(`CREATE TABLE IF NOT EXISTS pool_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        pool_url TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );`);

    // Create payments table
    db.run(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount REAL NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );`);

    // Create mining_history table
    db.run(`CREATE TABLE IF NOT EXISTS mining_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount REAL NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );`);
});

module.exports = db;