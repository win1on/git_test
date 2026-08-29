(function () {
  const subjectSelect = document.getElementById('subject-select');
  const topicListEl = document.getElementById('topic-list');
  const yearSelect = document.getElementById('year-select');
  const paperSelect = document.getElementById('paper-select');
  const clearBtn = document.getElementById('clear-filters');
  const grid = document.getElementById('question-grid');
  const resultCount = document.getElementById('result-count');

  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const modalMeta = document.getElementById('modal-meta');
  const modalQuestionBody = document.getElementById('modal-question-body');
  const modalMsBody = document.getElementById('modal-ms-body');
  const revealBtn = document.getElementById('reveal-ms');
  const modalClose = document.getElementById('modal-close');

  let selectedTopics = new Set();

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  async function loadSubjects() {
    const subjects = await fetch('/api/subjects').then((r) => r.json());
    for (const s of subjects) {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      subjectSelect.appendChild(opt);
    }
  }

  async function loadYearsAndPapers() {
    const [years, papers] = await Promise.all([
      fetch('/api/years').then((r) => r.json()),
      fetch('/api/papers').then((r) => r.json()),
    ]);
    for (const y of years) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      yearSelect.appendChild(opt);
    }
    for (const p of papers) {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      paperSelect.appendChild(opt);
    }
  }

  async function loadTopics() {
    selectedTopics = new Set();
    const subject = subjectSelect.value;
    const url = subject ? `/api/topics?subject=${encodeURIComponent(subject)}` : '/api/topics';
    const topics = await fetch(url).then((r) => r.json());

    if (!topics.length) {
      topicListEl.innerHTML = '<p style="color: var(--muted); font-size: 0.85rem;">No topics yet.</p>';
      return;
    }

    topicListEl.innerHTML = topics
      .map(
        (t) => `
        <label>
          <input type="checkbox" value="${escapeHtml(t)}" class="topic-checkbox" />
          ${escapeHtml(t)}
        </label>`
      )
      .join('');

    topicListEl.querySelectorAll('.topic-checkbox').forEach((cb) => {
      cb.addEventListener('change', () => {
        if (cb.checked) selectedTopics.add(cb.value);
        else selectedTopics.delete(cb.value);
        loadQuestions();
      });
    });
  }

  function buildQuery() {
    const params = new URLSearchParams();
    if (subjectSelect.value) params.set('subject', subjectSelect.value);
    if (selectedTopics.size) params.set('topics', [...selectedTopics].join(','));
    if (yearSelect.value) params.set('year', yearSelect.value);
    if (paperSelect.value) params.set('paper', paperSelect.value);
    return params.toString();
  }

  async function loadQuestions() {
    resultCount.textContent = 'Loading questions…';
    const qs = buildQuery();
    const questions = await fetch(`/api/questions${qs ? `?${qs}` : ''}`).then((r) => r.json());

    resultCount.textContent = `${questions.length} question${questions.length === 1 ? '' : 's'} found`;

    if (!questions.length) {
      grid.innerHTML = '<div class="empty-state">No questions match these filters yet. Try clearing some filters, or add questions from the Admin page.</div>';
      return;
    }

    grid.innerHTML = questions
      .map((q) => {
        const title = `${escapeHtml(q.subject)}${q.paper ? ' · ' + escapeHtml(q.paper) : ''}${
          q.question_number ? ' · Q' + escapeHtml(q.question_number) : ''
        }`;
        const yearSession = [q.session, q.year].filter(Boolean).join(' ');
        return `
        <article class="question-card" data-id="${q.id}">
          <div class="top-row">
            <span class="title">${title}</span>
            ${q.marks != null ? `<span class="tag marks">${escapeHtml(q.marks)} marks</span>` : ''}
          </div>
          <div class="meta-row">
            <span class="tag topic">${escapeHtml(q.topic)}</span>
            ${q.subtopic ? `<span class="tag topic">${escapeHtml(q.subtopic)}</span>` : ''}
            ${q.difficulty ? `<span class="tag">${escapeHtml(q.difficulty)}</span>` : ''}
            ${yearSession ? ` &middot; ${escapeHtml(yearSession)}` : ''}
          </div>
        </article>`;
      })
      .join('');

    grid.querySelectorAll('.question-card').forEach((card) => {
      card.addEventListener('click', () => openQuestion(card.dataset.id));
    });
  }

  async function openQuestion(id) {
    const q = await fetch(`/api/questions/${id}`).then((r) => r.json());
    modalTitle.textContent = `${q.subject} — ${q.topic}${q.subtopic ? ' / ' + q.subtopic : ''}`;

    const metaParts = [];
    if (q.paper) metaParts.push(q.paper);
    if (q.question_number) metaParts.push(`Question ${q.question_number}`);
    if (q.session || q.year) metaParts.push([q.session, q.year].filter(Boolean).join(' '));
    if (q.marks != null) metaParts.push(`${q.marks} marks`);
    if (q.difficulty) metaParts.push(q.difficulty);
    modalMeta.textContent = metaParts.join(' · ');

    modalQuestionBody.innerHTML = '';
    if (q.question_text) {
      const p = document.createElement('div');
      p.className = 'text-block';
      p.textContent = q.question_text;
      modalQuestionBody.appendChild(p);
    }
    if (q.question_image) {
      const img = document.createElement('img');
      img.src = `/${q.question_image}`;
      img.alt = 'Question';
      modalQuestionBody.appendChild(img);
    }
    if (!q.question_text && !q.question_image) {
      modalQuestionBody.innerHTML = '<p style="color: var(--muted);">No question content uploaded.</p>';
    }

    modalMsBody.innerHTML = '';
    if (q.markscheme_text) {
      const p = document.createElement('div');
      p.className = 'text-block';
      p.textContent = q.markscheme_text;
      modalMsBody.appendChild(p);
    }
    if (q.markscheme_image) {
      const img = document.createElement('img');
      img.src = `/${q.markscheme_image}`;
      img.alt = 'Mark scheme';
      modalMsBody.appendChild(img);
    }
    if (!q.markscheme_text && !q.markscheme_image) {
      modalMsBody.innerHTML = '<p style="color: var(--muted);">No mark scheme uploaded.</p>';
    }

    modalMsBody.hidden = true;
    revealBtn.textContent = 'Reveal Mark Scheme';
    modalBackdrop.hidden = false;
  }

  revealBtn.addEventListener('click', () => {
    const hidden = modalMsBody.hidden;
    modalMsBody.hidden = !hidden;
    revealBtn.textContent = hidden ? 'Hide Mark Scheme' : 'Reveal Mark Scheme';
  });

  modalClose.addEventListener('click', () => (modalBackdrop.hidden = true));
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) modalBackdrop.hidden = true;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modalBackdrop.hidden = true;
  });

  subjectSelect.addEventListener('change', () => {
    loadTopics().then(loadQuestions);
  });
  yearSelect.addEventListener('change', loadQuestions);
  paperSelect.addEventListener('change', loadQuestions);

  clearBtn.addEventListener('click', () => {
    subjectSelect.value = '';
    yearSelect.value = '';
    paperSelect.value = '';
    loadTopics().then(loadQuestions);
  });

  (async function init() {
    await Promise.all([loadSubjects(), loadYearsAndPapers(), loadTopics()]);
    await loadQuestions();
  })();
})();
