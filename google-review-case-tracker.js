(() => {
  const storageKey = 'reviewremoval.review-cases.v1';
  const form = document.querySelector('#case-form');
  const list = document.querySelector('#case-list');
  const message = document.querySelector('#case-message');
  const count = document.querySelector('#case-count');
  const exportButton = document.querySelector('#case-export');
  const cancel = document.querySelector('#case-cancel');
  const saveButton = form.querySelector('[type="submit"]');
  const { reported, stage, updated } = form.elements;
  const stages = {
    pending: ['Report pending', 'Check the current decision in Google’s Reviews Management Tool.'],
    declined: ['No violation found', 'Check whether Google offers a one-time appeal for this review.'],
    appealed: ['Appeal submitted', 'Check your email for Google’s next decision.'],
    removed: ['Removed', 'Record the date you confirmed the outcome.', true],
    retained: ['Remains live after appeal', 'Keep a record of Google’s final decision.', true]
  };
  const dayFormat = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'UTC' });
  let editingId = null;
  let memoryOnly = false;

  function today() {
    const date = new Date();
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(part => String(part).padStart(2, '0')).join('-');
  }

  function validDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  }

  function load() {
    if (memoryOnly) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || !Array.isArray(saved.cases)) return { next: 1, cases: [] };
      const cases = saved.cases.filter(item => item && Number.isSafeInteger(item.id) && item.id > 0 &&
        validDate(item.reported) && Object.hasOwn(stages, item.stage) &&
        (item.updated === '' || validDate(item.updated) && item.updated >= item.reported))
        .slice(0, 100).map(({ id, reported, stage, updated }) => ({ id, reported, stage, updated }));
      const highest = Math.max(0, ...cases.map(item => item.id));
      const next = Number.isSafeInteger(saved.next) && saved.next > highest ? saved.next : highest + 1;
      return { next, cases };
    } catch (_) {
      return { next: 1, cases: [] };
    }
  }

  let state = load();

  function persist(text) {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (_) { memoryOnly = true; }
    message.textContent = memoryOnly ? text + ' Browser storage is unavailable. Download a CSV before leaving.' : text;
    render();
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function elapsed(item) {
    if (stages[item.stage][2] && !item.updated) return 'Outcome date unrecorded';
    const days = Math.max(0, (Date.parse(stages[item.stage][2] ? item.updated : today()) - Date.parse(item.reported)) / 86400000);
    return days + (days === 1 ? ' calendar day' : ' calendar days') + (stages[item.stage][2] ? ' to recorded outcome' : ' since report');
  }

  function render() {
    list.replaceChildren();
    count.textContent = state.cases.length + (state.cases.length === 1 ? ' case' : ' cases');
    exportButton.disabled = state.cases.length === 0;
    document.querySelector('#case-empty').hidden = state.cases.length !== 0;
    for (const item of state.cases) {
      const [label, step] = stages[item.stage];
      const row = element('li', '', 'case-row');
      const header = element('div', '', 'case-row-header');
      header.append(element('strong', 'Case ' + item.id), element('span', label, 'case-stage'));
      const dates = 'Reported ' + dayFormat.format(new Date(item.reported)) +
        (item.updated ? ' · Status dated ' + dayFormat.format(new Date(item.updated)) : '');
      const actions = element('div', '', 'case-row-actions');
      for (const [action, name] of [['edit', 'Edit'], ['remove', 'Remove']]) {
        const button = element('button', name);
        button.type = 'button';
        button.dataset.action = action;
        button.dataset.caseId = item.id;
        button.setAttribute('aria-label', name + ' case ' + item.id);
        actions.append(button);
      }
      row.append(header, element('p', dates, 'case-dates'), element('p', elapsed(item), 'case-elapsed'), element('p', step), actions);
      list.append(row);
    }
  }

  function freshForm() {
    editingId = null;
    form.reset();
    reported.value = today();
    updated.min = reported.value;
    updated.setCustomValidity('');
    saveButton.textContent = 'Add case';
    cancel.hidden = true;
  }

  reported.max = updated.max = today();
  freshForm();
  form.querySelector('fieldset').disabled = false;
  render();

  function checkDates() {
    updated.min = reported.value;
    updated.setCustomValidity(updated.value && updated.value < reported.value ? 'Use a status date on or after the report date.' : '');
  }
  form.addEventListener('input', checkDates);
  form.addEventListener('submit', event => {
    event.preventDefault();
    checkDates();
    if (!form.reportValidity()) return;
    if (editingId === null && state.cases.length >= 100) {
      message.textContent = 'Download your CSV and remove a case before adding another. This tracker holds up to 100 cases.';
      return;
    }
    const item = { id: editingId ?? state.next++, reported: reported.value, stage: stage.value, updated: updated.value };
    if (editingId === null) state.cases.unshift(item);
    else state.cases = state.cases.map(existing => existing.id === editingId ? item : existing);
    freshForm();
    persist('Case ' + item.id + ' saved.');
  });

  cancel.addEventListener('click', () => { freshForm(); reported.focus(); });
  list.addEventListener('click', event => {
    const button = event.target.closest('button[data-case-id]');
    const item = button && state.cases.find(entry => entry.id === Number(button.dataset.caseId));
    if (!item) return;
    if (button.dataset.action === 'remove') {
      if (!window.confirm('Remove case ' + item.id + ' from this browser?')) return;
      if (editingId === item.id) freshForm();
      state.cases = state.cases.filter(entry => entry.id !== item.id);
      persist('Case ' + item.id + ' removed.');
      reported.focus();
      return;
    }
    editingId = item.id;
    reported.value = item.reported;
    stage.value = item.stage;
    updated.value = item.updated;
    saveButton.textContent = 'Save case ' + item.id;
    cancel.hidden = false;
    checkDates();
    reported.focus();
  });
  exportButton.addEventListener('click', () => {
    const lines = ['Case,Report date,Recorded status,Status date'];
    for (const item of state.cases) lines.push([item.id, item.reported, stages[item.stage][0], item.updated].join(','));
    const url = URL.createObjectURL(new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' }));
    const link = element('a', '');
    link.href = url;
    link.download = 'reviewremoval-case-log.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  window.addEventListener('storage', event => {
    if (memoryOnly || (event.key !== storageKey && event.key !== null)) return;
    state = load();
    if (editingId !== null && !state.cases.some(item => item.id === editingId)) freshForm();
    render();
  });
})();
