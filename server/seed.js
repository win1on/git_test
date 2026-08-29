const db = require('./db');

const count = db.prepare('SELECT COUNT(*) AS c FROM questions').get().c;
if (count > 0) {
  console.log(`Database already has ${count} question(s); skipping seed.`);
  process.exit(0);
}

const insert = db.prepare(`
  INSERT INTO questions
    (subject, topic, subtopic, year, session, paper, question_number, marks, difficulty,
     question_text, markscheme_text)
  VALUES
    (@subject, @topic, @subtopic, @year, @session, @paper, @question_number, @marks, @difficulty,
     @question_text, @markscheme_text)
`);

const samples = [
  {
    subject: 'Math AA',
    topic: 'Calculus',
    subtopic: 'Differentiation',
    year: 2022,
    session: 'May',
    paper: 'Paper 1',
    question_number: '4',
    marks: 6,
    difficulty: 'Medium',
    question_text:
      'Let f(x) = x^3 - 3x^2 + 2. Find f\'(x), and hence determine the coordinates of any local maximum and minimum points on the graph of y = f(x).',
    markscheme_text:
      "f'(x) = 3x^2 - 6x  (A1)\nSet f'(x) = 0: 3x(x - 2) = 0 => x = 0, x = 2  (M1)(A1)\nf(0) = 2 => local maximum at (0, 2)  (A1)\nf(2) = 8 - 12 + 2 = -2 => local minimum at (2, -2)  (A1)\nTotal: 6 marks",
  },
  {
    subject: 'Math AA',
    topic: 'Statistics and Probability',
    subtopic: 'Normal distribution',
    year: 2023,
    session: 'November',
    paper: 'Paper 2',
    question_number: '9',
    marks: 5,
    difficulty: 'Medium',
    question_text:
      'The heights of adult males in a population are normally distributed with mean 175 cm and standard deviation 8 cm. Find the probability that a randomly selected adult male is taller than 185 cm.',
    markscheme_text:
      'Z = (185 - 175) / 8 = 1.25  (M1)(A1)\nP(X > 185) = P(Z > 1.25) = 1 - 0.8944 = 0.1056  (M1)(A1)\nSo P(X > 185) ≈ 0.106 (3 s.f.)  (A1)\nTotal: 5 marks',
  },
  {
    subject: 'Physics',
    topic: 'Mechanics',
    subtopic: 'Kinematics',
    year: 2021,
    session: 'May',
    paper: 'Paper 1',
    question_number: '12',
    marks: 4,
    difficulty: 'Easy',
    question_text:
      'A ball is thrown vertically upward with an initial speed of 20 m/s. Calculate the maximum height reached, ignoring air resistance (g = 9.8 m/s^2).',
    markscheme_text:
      'Use v^2 = u^2 - 2gh with v = 0  (M1)\n0 = 20^2 - 2(9.8)h  (A1)\nh = 400 / 19.6 = 20.4 m  (A1)\nUnits and correct sig figs  (A1)\nTotal: 4 marks',
  },
  {
    subject: 'Chemistry',
    topic: 'Equilibrium',
    subtopic: 'Le Chatelier\'s principle',
    year: 2023,
    session: 'May',
    paper: 'Paper 2',
    question_number: '3',
    marks: 3,
    difficulty: 'Easy',
    question_text:
      'For the exothermic reaction N2(g) + 3H2(g) ⇌ 2NH3(g), predict and explain the effect of increasing temperature on the position of equilibrium.',
    markscheme_text:
      'Increasing temperature favours the endothermic (reverse) reaction  (A1)\nEquilibrium shifts left / towards reactants  (A1)\nYield of NH3 decreases  (A1)\nTotal: 3 marks',
  },
];

const insertMany = db.transaction((rows) => {
  for (const row of rows) insert.run(row);
});

insertMany(samples);
console.log(`Seeded ${samples.length} sample questions.`);
