
const state = {
  raw: [],
  filtered: [],
  filters: { search:'', school:'', schoolClass:'', level:'', day:'', includeHidden:false }
};

const els = {
  searchInput: document.getElementById('searchInput'),
  schoolFilter: document.getElementById('schoolFilter'),
  classFilter: document.getElementById('classFilter'),
  levelFilter: document.getElementById('levelFilter'),
  dayFilter: document.getElementById('dayFilter'),
  hiddenClassToggle: document.getElementById('hiddenClassToggle'),
  resetFilters: document.getElementById('resetFilters'),
  quickStats: document.getElementById('quickStats'),
  resultsCount: document.getElementById('resultsCount'),
  studentsTableBody: document.getElementById('studentsTableBody'),
  studentCards: document.getElementById('studentCards'),
  scheduleGrid: document.getElementById('scheduleGrid'),
  schoolBlocks: document.getElementById('schoolBlocks'),
  aboutList: document.getElementById('aboutList'),
  tabs: [...document.querySelectorAll('.tab')],
  panels: [...document.querySelectorAll('.tab-panel')],
  themeToggle: document.getElementById('themeToggle')
};

const uniq = values => [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b), undefined, {numeric:true, sensitivity:'base'}));

function optionize(select, values, placeholder){
  select.innerHTML = `<option value="">${placeholder}</option>` + values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
}

function escapeHtml(value){
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

function valueOrDash(v){ return v ? escapeHtml(v) : '—'; }

function searchableText(row){
  return [
    row.student_name, row.school_name, row.school_class_name,
    row.group_level_name, row.group_level_key, row.group_day_name, row.group_time_hm
  ].filter(Boolean).join(' ').toLowerCase();
}

function applyFilters(){
  const q = state.filters.search.trim().toLowerCase();
  state.filtered = state.raw.filter(row => {
    if (!state.filters.includeHidden && row.class_hidden) return false;
    if (state.filters.school && row.school_name !== state.filters.school) return false;
    if (state.filters.schoolClass && row.school_class_name !== state.filters.schoolClass) return false;
    if (state.filters.level && row.group_level_key !== state.filters.level) return false;
    if (state.filters.day && row.group_day_name !== state.filters.day) return false;
    if (q && !searchableText(row).includes(q)) return false;
    return true;
  });
  renderAll();
}

function renderStats(summary){
  const stats = [
    `${summary.students} students`,
    `${summary.schools} school${summary.schools === 1 ? '' : 's'}`,
    `${summary.classes} classes`,
    `${summary.groups} groups`,
    `${summary.levels} levels`
  ];
  els.quickStats.innerHTML = stats.map(s => `<span class="chip">${escapeHtml(s)}</span>`).join('');
}

function renderStudents(){
  els.resultsCount.textContent = `${state.filtered.length} result${state.filtered.length === 1 ? '' : 's'}`;

  if (!state.filtered.length){
    els.studentsTableBody.innerHTML = '<tr><td colspan="5" class="empty">No students match the current filters.</td></tr>';
    els.studentCards.innerHTML = '<div class="empty">No students match the current filters.</div>';
    return;
  }

  els.studentsTableBody.innerHTML = state.filtered.map(row => `
    <tr>
      <td><strong>${escapeHtml(row.student_name)}</strong></td>
      <td>${escapeHtml(row.school_name)}<br><small>${escapeHtml(row.school_key || '')}</small></td>
      <td>${escapeHtml(row.school_class_name)}</td>
      <td>${escapeHtml(row.group_level_name)}<br><small>${escapeHtml(row.group_level_key)}</small></td>
      <td>${escapeHtml(row.group_moment || '')}</td>
    </tr>
  `).join('');

  els.studentCards.innerHTML = state.filtered.map(row => `
    <article class="student-card">
      <h3>${escapeHtml(row.student_name)}</h3>
      <span class="pill">${escapeHtml(row.group_level_name)} · ${escapeHtml(row.group_level_key)}</span>
      <div class="info-grid">
        <div class="info-block">
          <div class="info-label">School</div>
          <div>${escapeHtml(row.school_name)}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Class</div>
          <div>${escapeHtml(row.school_class_name)}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Group moment</div>
          <div>${escapeHtml(row.group_moment || '—')}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Class moment</div>
          <div>${escapeHtml(row.class_moment || '—')}</div>
        </div>
      </div>
    </article>
  `).join('');
}

function renderSchedule(){
  const days = uniq(state.filtered.map(r => r.group_day_name));
  if (!days.length){
    els.scheduleGrid.innerHTML = '<div class="empty">No schedule items for the current filters.</div>';
    return;
  }

  els.scheduleGrid.innerHTML = days.map(day => {
    const dayRows = state.filtered.filter(r => r.group_day_name === day)
      .sort((a,b) => (a.group_time_hm || '').localeCompare(b.group_time_hm || '') || a.group_level_key.localeCompare(b.group_level_key));
    const grouped = {};
    dayRows.forEach(r => {
      const key = `${r.group_time_hm}|${r.group_level_key}|${r.group_id}`;
      if (!grouped[key]) grouped[key] = { ...r, students: [] };
      grouped[key].students.push(r.student_name);
    });
    const cards = Object.values(grouped).map(slot => `
      <div class="slot-card">
        <strong>${escapeHtml(slot.group_time_hm || '—')}</strong>
        <div class="meta">${escapeHtml(slot.group_level_name)} · ${escapeHtml(slot.group_level_key)}</div>
        <div class="meta">${slot.students.length} student${slot.students.length === 1 ? '' : 's'}</div>
        <div class="stack">${slot.students.slice(0,10).map(name => `<span class="badge">${escapeHtml(name)}</span>`).join('')}</div>
      </div>
    `).join('');
    return `<section class="day-block"><h3>${escapeHtml(day)}</h3><div class="slot-list">${cards}</div></section>`;
  }).join('');
}

function renderSchools(){
  const schools = uniq(state.filtered.map(r => r.school_name));
  if (!schools.length){
    els.schoolBlocks.innerHTML = '<div class="empty">No school/class data for the current filters.</div>';
    return;
  }

  els.schoolBlocks.innerHTML = schools.map(school => {
    const rows = state.filtered.filter(r => r.school_name === school);
    const classes = uniq(rows.map(r => r.school_class_name));
    const classCards = classes.map(className => {
      const classRows = rows.filter(r => r.school_class_name === className);
      const levels = uniq(classRows.map(r => r.group_level_key));
      const moments = uniq(classRows.map(r => r.group_moment));
      return `
        <div class="class-card">
          <strong>${escapeHtml(className)}</strong>
          <div class="meta">${classRows.length} student${classRows.length === 1 ? '' : 's'}</div>
          <div class="stack">${levels.map(level => `<span class="badge">${escapeHtml(level)}</span>`).join('')}</div>
          <div class="stack">${moments.map(moment => `<span class="badge">${escapeHtml(moment)}</span>`).join('')}</div>
        </div>
      `;
    }).join('');
    return `
      <section class="school-block">
        <h3>${escapeHtml(school)}</h3>
        <div class="meta">${classes.length} class${classes.length === 1 ? '' : 'es'}</div>
        <div class="class-list">${classCards}</div>
      </section>
    `;
  }).join('');
}

function renderAbout(summary){
  const lines = [
    `Students in reduced export: ${summary.students}`,
    `Schools in reduced export: ${summary.schools}`,
    `Classes in reduced export: ${summary.classes}`,
    `Groups in reduced export: ${summary.groups}`,
    `Levels in reduced export: ${summary.levels}`,
    `Days present in export: ${summary.days.join(', ') || '—'}`
  ];
  els.aboutList.innerHTML = lines.map(line => `<li>${escapeHtml(line)}</li>`).join('');
}

function renderAll(){
  renderStudents();
  renderSchedule();
  renderSchools();
}

function bindEvents(){
  els.searchInput.addEventListener('input', e => { state.filters.search = e.target.value; applyFilters(); });
  els.schoolFilter.addEventListener('change', e => { state.filters.school = e.target.value; applyFilters(); });
  els.classFilter.addEventListener('change', e => { state.filters.schoolClass = e.target.value; applyFilters(); });
  els.levelFilter.addEventListener('change', e => { state.filters.level = e.target.value; applyFilters(); });
  els.dayFilter.addEventListener('change', e => { state.filters.day = e.target.value; applyFilters(); });
  els.hiddenClassToggle.addEventListener('change', e => { state.filters.includeHidden = e.target.checked; applyFilters(); });
  els.resetFilters.addEventListener('click', () => {
    state.filters = { search:'', school:'', schoolClass:'', level:'', day:'', includeHidden:false };
    els.searchInput.value = '';
    els.schoolFilter.value = '';
    els.classFilter.value = '';
    els.levelFilter.value = '';
    els.dayFilter.value = '';
    els.hiddenClassToggle.checked = false;
    applyFilters();
  });

  els.tabs.forEach(tab => tab.addEventListener('click', () => {
    els.tabs.forEach(t => t.classList.remove('is-active'));
    els.panels.forEach(p => p.classList.remove('is-active'));
    tab.classList.add('is-active');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('is-active');
  }));

  const storedTheme = localStorage.getItem('zwemapp-theme');
  if (storedTheme === 'dark') document.documentElement.classList.add('dark');
  els.themeToggle.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
  els.themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const dark = document.documentElement.classList.contains('dark');
    localStorage.setItem('zwemapp-theme', dark ? 'dark' : 'light');
    els.themeToggle.textContent = dark ? '☀️' : '🌙';
  });
}

async function init(){
  const response = await fetch('./data/zwemapp-view.json');
  const payload = await response.json();
  state.raw = payload.records;
  renderStats(payload.summary);
  renderAbout(payload.summary);

  optionize(els.schoolFilter, uniq(state.raw.map(r => r.school_name)), 'All schools');
  optionize(els.classFilter, uniq(state.raw.map(r => r.school_class_name)), 'All classes');
  optionize(els.levelFilter, uniq(state.raw.map(r => r.group_level_key)), 'All levels');
  optionize(els.dayFilter, uniq(state.raw.map(r => r.group_day_name)), 'All days');

  bindEvents();
  applyFilters();
}

init().catch(err => {
  console.error(err);
  document.body.innerHTML = `<main class="app-shell"><section class="card"><h1>Could not load data</h1><p>${escapeHtml(err.message || String(err))}</p></section></main>`;
});
