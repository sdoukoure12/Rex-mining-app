// Database configuration for SQLite and Firebase

const sqlite3 = require('sqlite3').verbose();
const firebase = require('firebase/app');
require('firebase/database');

// SQLite Configuration
const sqliteDB = new sqlite3.Database(':memory:'); // Change to your database file path

// Firebase Configuration
const firebaseConfig = {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    databaseURL: 'YOUR_DATABASE_URL',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID'
};

firebase.initializeApp(firebaseConfig);

module.exports = { sqliteDB, firebase };