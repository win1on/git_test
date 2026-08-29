const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');

const db = require('./db');
const SEED_TOPICS = require('./topics');

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
for (const sub of ['questions', 'markschemes']) {
  fs.mkdirSync(path.join(UPLOADS_DIR, sub), { recursive: true });
}

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const sub = file.fieldname === 'markscheme_image' ? 'markschemes' : 'questions';
    cb(null, path.join(UPLOADS_DIR, sub));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).slice(0, 10);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return cb(new Error('Only PNG, JPEG, WEBP, or GIF images are allowed'));
    }
    cb(null, true);
  },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function questionListRow(row) {
  return {
    id: row.id,
    subject: row.subject,
    topic: row.topic,
    subtopic: row.subtopic,
    year: row.year,
    session: row.session,
    paper: row.paper,
    question_number: row.question_number,
    marks: row.marks,
    difficulty: row.difficulty,
    has_question_image: !!row.question_image,
  };
}

// --- Reference data -------------------------------------------------

app.get('/api/subjects', (req, res) => {
  const fromDb = db.prepare('SELECT DISTINCT subject FROM questions').all().map((r) => r.subject);
  const all = new Set([...Object.keys(SEED_TOPICS), ...fromDb]);
  res.json([...all].sort());
});

app.get('/api/topics', (req, res) => {
  const { subject } = req.query;
  const seeded = (subject && SEED_TOPICS[subject]) || [];
  let fromDb = [];
  if (subject) {
    fromDb = db
      .prepare('SELECT DISTINCT topic FROM questions WHERE subject = ?')
      .all(subject)
      .map((r) => r.topic);
  } else {
    fromDb = db.prepare('SELECT DISTINCT topic FROM questions').all().map((r) => r.topic);
  }
  const all = new Set([...seeded, ...fromDb]);
  res.json([...all].sort());
});

app.get('/api/years', (req, res) => {
  const rows = db
    .prepare('SELECT DISTINCT year FROM questions WHERE year IS NOT NULL ORDER BY year DESC')
    .all();
  res.json(rows.map((r) => r.year));
});

app.get('/api/papers', (req, res) => {
  const rows = db
    .prepare('SELECT DISTINCT paper FROM questions WHERE paper IS NOT NULL ORDER BY paper')
    .all();
  res.json(rows.map((r) => r.paper));
});

// --- Questions --------------------------------------------------------

app.get('/api/questions', (req, res) => {
  const { subject, topics, year, paper, difficulty } = req.query;

  const clauses = [];
  const params = {};

  if (subject) {
    clauses.push('subject = @subject');
    params.subject = subject;
  }
  if (year) {
    clauses.push('year = @year');
    params.year = Number(year);
  }
  if (paper) {
    clauses.push('paper = @paper');
    params.paper = paper;
  }
  if (difficulty) {
    clauses.push('difficulty = @difficulty');
    params.difficulty = difficulty;
  }

  let topicList = [];
  if (topics) {
    topicList = Array.isArray(topics) ? topics : String(topics).split(',');
    topicList = topicList.map((t) => t.trim()).filter(Boolean);
  }
  if (topicList.length) {
    const placeholders = topicList.map((_, i) => `@topic${i}`).join(', ');
    clauses.push(`topic IN (${placeholders})`);
    topicList.forEach((t, i) => {
      params[`topic${i}`] = t;
    });
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT * FROM questions ${where} ORDER BY year DESC, id DESC`)
    .all(params);

  res.json(rows.map(questionListRow));
});

app.get('/api/questions/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Question not found' });
  res.json(row);
});

app.post(
  '/api/questions',
  upload.fields([
    { name: 'question_image', maxCount: 1 },
    { name: 'markscheme_image', maxCount: 1 },
  ]),
  (req, res) => {
    const b = req.body;
    if (!b.subject || !b.topic) {
      return res.status(400).json({ error: 'subject and topic are required' });
    }

    const questionImage = req.files?.question_image?.[0]
      ? `uploads/questions/${req.files.question_image[0].filename}`
      : null;
    const markschemeImage = req.files?.markscheme_image?.[0]
      ? `uploads/markschemes/${req.files.markscheme_image[0].filename}`
      : null;

    const stmt = db.prepare(`
      INSERT INTO questions
        (subject, topic, subtopic, year, session, paper, question_number, marks, difficulty,
         question_text, question_image, markscheme_text, markscheme_image)
      VALUES
        (@subject, @topic, @subtopic, @year, @session, @paper, @question_number, @marks, @difficulty,
         @question_text, @question_image, @markscheme_text, @markscheme_image)
    `);

    const info = stmt.run({
      subject: b.subject,
      topic: b.topic,
      subtopic: b.subtopic || null,
      year: b.year ? Number(b.year) : null,
      session: b.session || null,
      paper: b.paper || null,
      question_number: b.question_number || null,
      marks: b.marks ? Number(b.marks) : null,
      difficulty: b.difficulty || null,
      question_text: b.question_text || null,
      question_image: questionImage,
      markscheme_text: b.markscheme_text || null,
      markscheme_image: markschemeImage,
    });

    const created = db.prepare('SELECT * FROM questions WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  }
);

app.delete('/api/questions/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Question not found' });

  for (const rel of [row.question_image, row.markscheme_image]) {
    if (rel) {
      const abs = path.join(__dirname, '..', 'public', rel);
      fs.unlink(abs, () => {});
    }
  }

  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`IB Question Bank running at http://localhost:${PORT}`);
});
