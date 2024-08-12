// database.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./video_details.db'); // Use file-based database for persistence

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS video_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    videoId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    keywords TEXT,
    privacyStatus TEXT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

module.exports = db;
