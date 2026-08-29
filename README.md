# IB Question Bank

A simple, self-hosted question bank and mark scheme site for IB past-paper
questions — inspired by Revision Village. Browse questions, filter by
subject/topic, and reveal the mark scheme for each question.

## Features

- Browse questions with filters for **subject**, **topic** (multi-select),
  **year**, and **paper**.
- Each question can have a text and/or image version of the question, plus
  a text and/or image version of the mark scheme. Mark schemes are hidden
  until you click "Reveal Mark Scheme".
- An **Add Question** page (`/admin.html`) for importing questions from
  past papers: fill in the metadata (subject, topic, year, paper, marks,
  difficulty) and upload a screenshot/scan of the question and mark scheme
  (or paste in text instead).
- Seed topic lists for Math AA/AI, Physics, Chemistry, Biology, and
  Economics based on the IB syllabus guides — the topic filter also
  auto-picks up any custom topic you type in when adding a question.

## Running locally

```bash
npm install
npm run seed    # optional: adds a few sample questions so the site isn't empty
npm start
```

Then open http://localhost:3000.

## Importing your past papers

1. Go to **Add Question** in the nav bar.
2. Enter the subject and topic (type a new one if it's not in the
   suggestions — it will show up as a filter option immediately).
3. Fill in year/session/paper/question number/marks/difficulty as you like
   — all optional except subject and topic.
4. Upload a cropped screenshot of the question from the past paper PDF
   (or paste the text), and the matching mark scheme image/text.
5. Submit. The question immediately appears in the browse page and its
   topic appears in the filter sidebar.

Tip: a PDF-to-image tool (e.g. a screenshot, or a PDF viewer's snapshot
tool) works well for cropping individual questions out of past-paper PDFs.

## Data storage

- Question/mark scheme metadata is stored in a local SQLite database
  (`data.sqlite`, created automatically, gitignored).
- Uploaded images are stored under `public/uploads/` (gitignored) — back
  this folder up along with `data.sqlite` if you want to keep your
  imported content.

## Tech stack

Plain Node.js + Express + better-sqlite3 on the backend, static HTML/CSS
and vanilla JS on the frontend — no build step required.
