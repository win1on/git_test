const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    subtopic TEXT,
    year INTEGER,
    session TEXT,
    paper TEXT,
    question_number TEXT,
    marks INTEGER,
    difficulty TEXT,
    question_text TEXT,
    question_image TEXT,
    markscheme_text TEXT,
    markscheme_image TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
  CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
`);

module.exports = db;
