(function () {
  const form = document.getElementById('question-form');
  const msgEl = document.getElementById('form-msg');
  const subjectInput = document.getElementById('subject');
  const topicInput = document.getElementById('topic');
  const subjectOptions = document.getElementById('subject-options');
  const topicOptions = document.getElementById('topic-options');

  async function loadSubjectOptions() {
    const subjects = await fetch('/api/subjects').then((r) => r.json());
    subjectOptions.innerHTML = subjects.map((s) => `<option value="${s}"></option>`).join('');
  }

  async function loadTopicOptions() {
    const subject = subjectInput.value;
    const url = subject ? `/api/topics?subject=${encodeURIComponent(subject)}` : '/api/topics';
    const topics = await fetch(url).then((r) => r.json());
    topicOptions.innerHTML = topics.map((t) => `<option value="${t}"></option>`).join('');
  }

  subjectInput.addEventListener('input', loadTopicOptions);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgEl.className = 'form-msg';
    msgEl.textContent = '';

    const formData = new FormData(form);
    try {
      const res = await fetch('/api/questions', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add question');

      msgEl.className = 'form-msg success';
      msgEl.textContent = `Question added (#${data.id}). You can add another below.`;

      const keepSubject = subjectInput.value;
      const keepTopic = topicInput.value;
      form.reset();
      subjectInput.value = keepSubject;
      topicInput.value = keepTopic;
      await loadSubjectOptions();
      await loadTopicOptions();
    } catch (err) {
      msgEl.className = 'form-msg error';
      msgEl.textContent = err.message;
    }
  });

  loadSubjectOptions();
  loadTopicOptions();
})();
