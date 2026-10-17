'use strict';

/* ================================================================ Утилиты */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let api = null;

const ICONS = {
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  play: '<path d="M6.5 4.6v14.8a1 1 0 0 0 1.52.85l11.9-7.4a1 1 0 0 0 0-1.7L8.02 3.75A1 1 0 0 0 6.5 4.6Z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="5.5" y="4" width="4.5" height="16" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4.5" height="16" rx="1.2" fill="currentColor" stroke="none"/>',
  stop: '<rect x="5.5" y="5.5" width="13" height="13" rx="2.5" fill="currentColor" stroke="none"/>',
  back5: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><text x="12" y="15.1" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" stroke="none" font-family="Segoe UI">5</text>',
  fwd5: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><text x="12" y="15.1" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" stroke="none" font-family="Segoe UI">5</text>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  folderOpen: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  sliders: '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-14.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  auto: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  keyboard: '<path d="M10 8h.01M12 12h.01M14 8h.01M16 12h.01M18 8h.01M6 8h.01M7 16h10M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>',
  wave: '<path d="M2 10v3M6 6v11M10 3v18M14 8v7M18 5v13M22 10v3"/>',
  library: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
  hp: '<path d="M2 19c4 0 5-11 9-11h11"/><path d="M2 22h20" opacity=".35"/>',
  lp: '<path d="M2 8h11c4 0 5 11 9 11"/><path d="M2 22h20" opacity=".35"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  volume: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
  fade: '<path d="M2 19 8 6h8l6 13"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
};
const svg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
const icon = (name) => `<span class="ico">${svg(name)}</span>`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function fmtDur(s, tenths = false) {
  s = Math.max(0, s || 0);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  const base = (h ? `${h}:${String(m).padStart(2, '0')}` : String(m).padStart(2, '0')) + ':' + String(sec).padStart(2, '0');
  return tenths ? [base, Math.floor((s % 1) * 10)] : base;
}
function fmtSize(b) {
  const u = ['Б', 'КБ', 'МБ', 'ГБ'];
  let i = 0;
  while (b >= 1024 && i < 3) { b /= 1024; i++; }
  return (i ? b.toFixed(1) : b) + ' ' + u[i];
}
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
function dayDiff(ts) {
  const d = new Date(ts * 1000), now = new Date();
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()), b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((b - a) / 86400000);
}
function fmtWhen(ts) {
  const d = new Date(ts * 1000), diff = dayDiff(ts);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (diff === 0) return `Сегодня, ${hm}`;
  if (diff === 1) return `Вчера, ${hm}`;
  const y = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${y}, ${hm}`;
}
function dateGroup(ts) {
  const diff = dayDiff(ts);
  if (diff <= 0) return 'Сегодня';
  if (diff === 1) return 'Вчера';
  if (diff < 7) return 'На этой неделе';
  if (diff < 31) return 'В этом месяце';
  return 'Ранее';
}

/* ================================================================ Состояние */
const BANDS = 48;
const S = {
  files: [], sel: null, query: '', sort: { key: 'date', dir: -1 },
  theme: 'auto', dark: true,
  devices: [], device: '', channels: 1,
  rec: { open: false, writing: false, paused: false, elapsed: 0, monitor: false, sr: 0 },
  play: { playing: false, pos: 0, dur: 0, preview: false, t: 0 },
  playLock: 0, recLock: 0,
  wave: null, waveCache: null,
  live: [],
  levels: [0, 0],
  vu: [{ v: 0, peak: 0, peakT: 0, clipT: 0 }, { v: 0, peak: 0, peakT: 0, clipT: 0 }],
  spec: new Float32Array(BANDS), specTarget: new Float32Array(BANDS), specPeak: new Float32Array(BANDS), hasSignal: false,
  thumbs: new Map(), folderStamp: 0, folder: '',
  filters: {}, filterDefaults: {},
  hoverX: null, fxOpen: false, modal: null, newPath: null,
};

/* ================================================================ Запуск */
let started = false;
async function init() {
  if (started) return;
  started = true;
  api = window.pywebview.api;
  window.onerror = (m, src, line) => api.log(`${m} (строка ${line})`);
  window.addEventListener('unhandledrejection', (e) => api.log(`promise: ${e.reason}`));

  $$('[data-icon]').forEach((el) => { el.innerHTML = svg(el.dataset.icon); });
  const setIco = (sel, name) => { $(sel).innerHTML = icon(name); };
  setIco('#btnKeys', 'keyboard'); setIco('#btnOpenFolder', 'folderOpen');
  setIco('#btnBack', 'back5'); setIco('#btnFwd', 'fwd5'); setIco('#btnStop', 'stop'); setIco('#fxClose', 'x');
  $$('#themeSeg button').forEach((b) => { b.innerHTML = icon({ auto: 'auto', light: 'sun', dark: 'moon' }[b.dataset.v]); });

  const d = await api.init();
  Object.assign(S, {
    devices: d.devices, device: d.device, channels: d.channels, theme: d.theme,
    filters: d.filters, filterDefaults: d.filterDefaults, sort: d.sort || S.sort,
  });
  applyTheme();
  renderMic();
  setSeg($('#chanSeg'), String(S.channels));
  renderSort();
  buildFx();
  bindUI();
  setupCanvases();
  await loadFiles(true);
  updateDeck();
  updateRecUI();
  setTimeout(() => { setSeg($('#chanSeg'), String(S.channels)); setSeg($('#themeSeg'), S.theme); }, 200);
  poll();
  requestAnimationFrame(frame);
}
if (window.pywebview && window.pywebview.api && window.pywebview.api.init) init();
else window.addEventListener('pywebviewready', init);

/* ================================================================ Тема */
const mq = matchMedia('(prefers-color-scheme: dark)');
mq.addEventListener('change', () => { if (S.theme === 'auto') applyTheme(); });
function applyTheme() {
  const dark = S.theme === 'auto' ? mq.matches : S.theme === 'dark';
  S.dark = dark;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  setSeg($('#themeSeg'), S.theme);
  api.title_bar(dark, dark ? '#07090d' : '#e8ecf2', dark ? '#eef1f7' : '#0e1525');
}

function setSeg(seg, value) {
  let on = null;
  $$('button', seg).forEach((b) => { const m = b.dataset.v === value; b.classList.toggle('on', m); if (m) on = b; });
  const thumb = $('.seg-thumb', seg);
  if (on && thumb && on.offsetWidth) {
    thumb.style.width = on.offsetWidth + 'px';
    thumb.style.transform = `translateX(${on.offsetLeft - 3}px)`;
  }
}

/* ================================================================ Связь с Python */
let pollT = 0;
async function poll() {
  try {
    handleState(await api.state());
  } catch (e) { /* окно закрывается */ }
  setTimeout(poll, 40);
}

function handleState(s) {
  const r = s.rec;
  if (performance.now() < S.recLock) Object.assign(r, { writing: S.rec.writing, paused: S.rec.paused, monitor: S.rec.monitor });
  const changed = r.writing !== S.rec.writing || r.paused !== S.rec.paused || r.monitor !== S.rec.monitor || r.open !== S.rec.open;
  S.rec = r;
  S.levels = s.levels;
  if (s.spectrum) { S.specTarget.set(s.spectrum); S.hasSignal = true; } else { S.hasSignal = false; }
  if (r.writing && s.history.length) {
    S.live.push(...s.history);
    if (S.live.length > 30000) S.live.splice(0, S.live.length - 30000);
  }
  const now = performance.now();
  if (now > S.playLock) {
    Object.assign(S.play, s.play);
    S.play.t = now;
  }
  updatePlayingUI();
  if (changed) updateRecUI();
  $('#recTime').textContent = recClock(r.writing ? r.elapsed : 0);
  $('#recBadgeTime').textContent = fmtDur(r.elapsed);
  if (s.folder !== S.folderStamp && !r.writing) { S.folderStamp = s.folder; loadFiles(); }
}

function recClock(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
}

/* ================================================================ Библиотека */
async function loadFiles(first = false) {
  const r = await api.list_files();
  S.files = r.files;
  S.folderStamp = r.stamp;
  S.folder = r.folder;
  $('#folderPath').textContent = '‎' + r.folder + '‎';
  renderList(first);
  if (S.sel && !S.files.some((f) => f.path === S.sel)) deselect();
}

function visibleFiles() {
  const q = S.query.trim().toLowerCase();
  const { key, dir } = S.sort;
  const get = { date: (f) => f.mtime, name: (f) => f.name.toLowerCase(), duration: (f) => f.duration || 0, size: (f) => f.size }[key];
  return S.files
    .filter((f) => !q || f.name.toLowerCase().includes(q))
    .sort((a, b) => { const x = get(a), y = get(b); return (x < y ? -1 : x > y ? 1 : 0) * dir; });
}

function sparkSVG(vals) {
  if (!vals) return '<svg class="spark" viewBox="0 0 56 16"></svg>';
  const n = vals.length;
  let d = '';
  vals.forEach((v, i) => {
    const x = (1 + (i * 54) / (n - 1)).toFixed(1);
    const h = Math.max(1, v * 14);
    d += `M${x} ${(8 - h / 2).toFixed(1)}V${(8 + h / 2).toFixed(1)}`;
  });
  return `<svg class="spark" viewBox="0 0 56 16"><path d="${d}"/></svg>`;
}

const thumbKey = (f) => f.path + '|' + f.mtime;

function renderList(animate = false) {
  const list = $('#list');
  const files = visibleFiles();
  $('#libCount').textContent = S.files.length;
  list.classList.toggle('static', !animate);
  if (!files.length) {
    list.innerHTML = S.files.length
      ? '<div class="list-empty"><b>Ничего не найдено</b>Попробуйте другой запрос</div>'
      : '<div class="list-empty"><b>Здесь пока пусто</b>Нажмите красную кнопку REC внизу,<br>чтобы сделать первую запись</div>';
    return;
  }
  let html = '', group = null, i = 0;
  for (const f of files) {
    if (S.sort.key === 'date') {
      const g = dateGroup(f.mtime);
      if (g !== group) { html += `<div class="group">${g}</div>`; group = g; }
    }
    const cls = ['item'];
    if (f.path === S.sel) cls.push('active');
    if (f.path === S.sel && S.play.playing) cls.push('playing');
    if (f.path === S.newPath) cls.push('new');
    const delay = animate ? `style="animation-delay:${Math.min(i++, 16) * 30}ms"` : '';
    html += `<div class="${cls.join(' ')}" data-path="${esc(f.path)}" ${delay}>
      <div class="item-ico">${icon('wave')}<span class="eq"><i></i><i></i><i></i></span></div>
      <div class="item-body"><div class="item-name">${esc(f.name)}</div><div class="item-meta">${fmtWhen(f.mtime)} · ${fmtSize(f.size)}</div></div>
      <div class="item-side"><div class="item-dur">${f.duration != null ? fmtDur(f.duration) : '—'}</div>${sparkSVG(S.thumbs.get(thumbKey(f)))}</div>
    </div>`;
  }
  S.newPath = null;
  list.innerHTML = html;
  loadThumbs(files);
}

let thumbBusy = false;
async function loadThumbs(files) {
  if (thumbBusy) return;
  thumbBusy = true;
  try {
    for (const f of files) {
      const key = thumbKey(f);
      if (S.thumbs.has(key)) continue;
      const vals = await api.thumb(f.path);
      S.thumbs.set(key, vals);
      const el = itemEl(f.path);
      if (el && vals) $('.spark', el).outerHTML = sparkSVG(vals);
    }
  } finally {
    thumbBusy = false;
  }
}

const itemEl = (path) => $$('#list .item').find((el) => el.dataset.path === path);
const fileByPath = (path) => S.files.find((f) => f.path === path);

function markActive() {
  $$('#list .item').forEach((el) => {
    const on = el.dataset.path === S.sel;
    el.classList.toggle('active', on);
    el.classList.toggle('playing', on && S.play.playing);
  });
  const el = itemEl(S.sel);
  if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function renderSort() {
  $$('#sort button').forEach((b) => {
    const on = b.dataset.k === S.sort.key;
    b.classList.toggle('on', on);
    b.classList.toggle('asc', on && S.sort.dir === 1);
    b.innerHTML = b.textContent.trim() + (on ? icon('chevron') : '');
  });
}

/* ================================================================ Выбор записи */
let selectTimer = null;
async function select(path, { autoplay = false, soon = false } = {}) {
  if (S.fxOpen) await closeFx();
  S.sel = path;
  markActive();
  const f = fileByPath(path);
  $('#trackTitle').textContent = f ? f.name : '—';
  clearTimeout(selectTimer);
  if (soon) {
    selectTimer = setTimeout(() => loadSelected(path, autoplay), 140);
  } else {
    await loadSelected(path, autoplay);
  }
}

async function loadSelected(path, autoplay) {
  const r = await api.load(path);
  if (S.sel !== path) return;
  if (!r || !r.ok) {
    S.wave = null;
    toast('Не удалось открыть запись: ' + (r && r.error), 'err');
    updateDeck();
    return;
  }
  setWave(r);
  if (autoplay) togglePlay();
}

function setWave(r) {
  S.wave = r;
  S.waveCache = null;
  S.play = { playing: r.preview, pos: 0, dur: r.duration, preview: r.preview, t: performance.now() };
  S.playLock = performance.now() + 250;
  updateDeck();
}

function deselect() {
  S.sel = null;
  S.wave = null;
  api.unload();
  markActive();
  updateDeck();
}

function updateDeck() {
  const f = S.sel && fileByPath(S.sel);
  $('#trackTitle').textContent = f ? f.name : 'Нет выбранной записи';
  const meta = $('#trackMeta');
  if (f && S.wave) {
    const chips = [
      `${icon('wave')}${fmtDur(S.wave.duration)}`,
      `${(S.wave.sr / 1000).toFixed(S.wave.sr % 1000 ? 1 : 0)} кГц`,
      S.wave.channels > 1 ? 'Стерео' : 'Моно',
      fmtSize(f.size),
      fmtWhen(f.mtime),
    ];
    meta.innerHTML = chips.map((c, i) => `<span class="chip" style="animation-delay:${i * 40}ms">${c}</span>`).join('')
      + (S.wave.preview ? '<span class="chip warn">Предпрослушивание с эффектами</span>' : '');
    $('#statusRight').textContent = `WAV · 16 бит · ${(S.wave.sr / 1000).toFixed(1)} кГц · ${S.wave.channels > 1 ? 'стерео' : 'моно'}`;
  } else {
    meta.innerHTML = '';
  }
  ['#btnReveal', '#btnCopy', '#btnFx', '#btnRename', '#btnDelete'].forEach((s) => { $(s).disabled = !S.sel; });
  updateEmpty();
}

function updateEmpty() {
  $('#waveEmpty').classList.toggle('hide', !!S.wave || S.rec.writing);
}

/* ================================================================ Воспроизведение */
function curPos(now = performance.now()) {
  const p = S.play;
  let pos = p.pos;
  if (p.playing) pos += (now - p.t) / 1000;
  return clamp(pos, 0, p.dur || 0);
}

async function ensureLoaded() {
  if (S.wave) return true;
  const path = S.sel || (visibleFiles()[0] || {}).path;
  if (!path) return false;
  await select(path);
  return !!S.wave;
}

async function togglePlay() {
  if (S.rec.writing) return;
  if (!(await ensureLoaded())) return;
  const pos = curPos();
  if (S.play.playing) {
    await api.pause();
    S.play.playing = false;
  } else {
    const r = await api.play();
    if (r && !r.ok) { toast(r.error, 'err'); return; }
    S.play.playing = true;
  }
  S.play.pos = pos;
  S.play.t = performance.now();
  S.playLock = performance.now() + 200;
  updatePlayingUI();
}

async function stopPlay() {
  await api.stop();
  Object.assign(S.play, { playing: false, pos: 0, t: performance.now() });
  S.playLock = performance.now() + 200;
  updatePlayingUI();
}

let seekT = 0;
function seekTo(sec, final = true) {
  if (!S.wave) return;
  sec = clamp(sec, 0, S.play.dur);
  S.play.pos = sec;
  S.play.t = performance.now();
  S.playLock = performance.now() + 250;
  const now = performance.now();
  if (final || now - seekT > 60) { seekT = now; api.seek(sec); }
}

let lastPlaying = null;
function updatePlayingUI() {
  const p = S.play.playing;
  if (p === lastPlaying) return;
  lastPlaying = p;
  document.body.classList.toggle('is-playing', p);
  const el = itemEl(S.sel);
  if (el) el.classList.toggle('playing', p);
}

/* ================================================================ Запись */
async function toggleRec() {
  if (S.rec.writing) return stopRec();
  if (S.fxOpen) await closeFx();
  const r = await api.start_record();
  if (!r.ok) { toast(r.error, 'err'); return; }
  S.live = [];
  S.recLock = performance.now() + 300;
  S.rec = { ...S.rec, writing: true, paused: false, open: true, elapsed: 0, sr: r.samplerate };
  S.play.playing = false;
  updatePlayingUI();
  updateRecUI();
  toast(`Запись началась · ${r.device}`, 'rec');
  if (r.monoFallback) toast('Микрофон монофонический — запись идёт в моно', 'info');
}

async function stopRec() {
  const r = await api.stop_record();
  S.recLock = performance.now() + 300;
  S.rec = { ...S.rec, writing: false, paused: false };
  updateRecUI();
  if (r.error) toast(r.error, 'err');
  if (r.path) {
    S.query = '';
    $('#search').value = '';
    S.newPath = r.path;
    await loadFiles();
    await select(r.path);
    toast('Запись сохранена', 'ok');
  } else {
    toast('Запись пустая — файл не сохранён', 'info');
  }
}

async function toggleRecPause() {
  if (!S.rec.writing) return;
  S.rec.paused = await api.pause_record(!S.rec.paused);
  S.recLock = performance.now() + 300;
  updateRecUI();
}

async function toggleMonitor() {
  if (S.rec.writing) return;
  const r = await api.set_monitor(!S.rec.monitor);
  if (!r.ok) toast(r.error, 'err');
  S.rec.monitor = r.ok ? !S.rec.monitor : false;
  S.recLock = performance.now() + 300;
  updateRecUI();
}

let wasWriting = false;
function updateRecUI() {
  const r = S.rec;
  const prevWriting = wasWriting;
  wasWriting = r.writing;
  document.body.classList.toggle('is-rec', r.writing);
  document.body.classList.toggle('is-paused', r.writing && r.paused);
  const pb = $('#btnRecPause');
  pb.disabled = !r.writing;
  pb.innerHTML = r.paused ? icon('play') + 'Продолжить' : icon('pause') + 'Пауза';
  $('#btnMonitor').classList.toggle('on', r.monitor || r.writing);
  $('#btnMonitor').disabled = r.writing;
  $('#micBtn').disabled = r.writing;
  $$('#chanSeg button').forEach((b) => { b.disabled = r.writing; });
  const sr = r.sr ? ` · ${(r.sr / 1000).toFixed(1)} кГц` : '';
  $('#recState').textContent = r.writing ? (r.paused ? 'Пауза — нажмите «Продолжить»' : 'Идёт запись' + sr)
    : r.monitor ? 'Тест входа — говорите в микрофон' : 'Готов к записи';
  if (r.writing) {
    $('#statusRight').textContent = `REC · WAV 16 бит${sr}`;
    $('#trackTitle').textContent = r.paused ? 'Запись на паузе' : 'Идёт запись…';
    $('#trackMeta').innerHTML = [`${icon('mic')}${esc(S.device)}`, sr.replace(' · ', '') || '', S.channels > 1 ? 'Стерео' : 'Моно', 'WAV 16 бит']
      .filter(Boolean).map((c) => `<span class="chip">${c}</span>`).join('');
  } else if (prevWriting) {
    updateDeck();
  }
  setStatus(r.writing ? `Запись: ${S.device}` : 'Готово');
  updateEmpty();
}

/* ================================================================ Микрофон */
function renderMic() {
  $('#micName').textContent = S.device;
  $('#micMenu').innerHTML = S.devices.map((d) =>
    `<button class="menu-item ${d === S.device ? 'sel' : ''}" data-dev="${esc(d)}">${icon(d === S.device ? 'check' : 'mic')}<span class="menu-text">${esc(d)}</span></button>`
  ).join('') + `<div class="menu-sep"></div><button class="menu-item" data-refresh>${icon('refresh')}<span class="menu-text">Обновить список устройств</span></button>`;
}

async function chooseMic(name) {
  S.device = name;
  renderMic();
  const r = await api.set_device(name);
  if (r && !r.ok) toast(r.error, 'err');
  toast(`Источник: ${name}`, 'info');
}

async function refreshMics() {
  const r = await api.refresh_devices();
  S.devices = r.devices;
  S.device = r.device;
  renderMic();
  toast(`Найдено устройств: ${r.devices.length - 1}`, 'info');
}

/* ================================================================ Действия с файлами */
function needSel() {
  if (!S.sel) toast('Сначала выберите запись в библиотеке', 'info');
  return S.sel;
}
async function reveal() { if (needSel()) await api.reveal(S.sel); }
async function copyFile() {
  if (!needSel()) return;
  const r = await api.copy_file(S.sel);
  r.ok ? toast('Файл скопирован — вставьте его через Ctrl+V в мессенджер, письмо или папку', 'ok') : toast(r.error, 'err');
}
async function copyPath() {
  if (!needSel()) return;
  const r = await api.copy_path(S.sel);
  r.ok ? toast('Путь к файлу скопирован', 'ok') : toast(r.error, 'err');
}
async function renameSel() {
  if (!needSel() || S.rec.writing) return;
  const f = fileByPath(S.sel);
  const name = await modal({ icon: 'pencil', title: 'Переименовать запись', input: f.name, ok: 'Сохранить' });
  if (name == null || name.trim() === f.name) return;
  const r = await api.rename(S.sel, name);
  if (!r.ok) { toast(r.error, 'err'); return; }
  S.sel = r.path;
  await loadFiles();
  markActive();
  updateDeck();
  toast('Переименовано', 'ok');
}
async function deleteSel() {
  if (!needSel() || S.rec.writing) return;
  const f = fileByPath(S.sel);
  const ok = await modal({ icon: 'trash', title: 'Удалить запись?', text: `«${f.name}» будет перемещена в Корзину — её можно будет восстановить.`, ok: 'Удалить', danger: true });
  if (!ok) return;
  const files = visibleFiles();
  const idx = files.findIndex((x) => x.path === S.sel);
  const next = files[idx + 1] || files[idx - 1];
  const r = await api.delete(S.sel);
  if (!r.ok) { toast(r.error, 'err'); return; }
  S.sel = null; S.wave = null;
  await loadFiles();
  if (next) await select(next.path); else updateDeck();
  toast('Запись перемещена в Корзину', 'ok');
}
async function chooseFolder() {
  if (S.rec.writing) return;
  const folder = await api.choose_folder();
  if (!folder) return;
  S.sel = null; S.wave = null;
  updateDeck();
  await loadFiles(true);
  toast('Папка для записей изменена', 'ok');
}

/* ================================================================ Рэк эффектов */
const FX = [
  { key: 'trim', name: 'Обрезка тишины', desc: 'Срезает тишину в начале и в конце', icon: 'scissors', short: 'TRIM',
    param: 'trim_db', min: -70, max: -20, round: 1, fmt: (v) => `${v} дБ` },
  { key: 'highpass', name: 'Срез низов', desc: 'Убирает гул, вибрации и стук', icon: 'hp', short: 'HPF',
    param: 'highpass_hz', min: 20, max: 500, log: true, round: 1, fmt: (v) => `${v} Гц` },
  { key: 'lowpass', name: 'Срез верхов', desc: 'Убирает шипение и свист', icon: 'lp', short: 'LPF',
    param: 'lowpass_hz', min: 1000, max: 20000, log: true, round: 50, fmt: (v) => `${(v / 1000).toFixed(1)} кГц` },
  { key: 'denoise', name: 'Шумоподавление', desc: 'Убирает ровный фон: вентилятор, улицу', icon: 'sparkles', short: 'DENOISE',
    param: 'denoise_strength', min: 10, max: 100, round: 1, fmt: (v) => `${v} %` },
  { key: 'gain', name: 'Усиление', desc: 'Сделать громче или тише', icon: 'volume', short: 'GAIN',
    param: 'gain_db', min: -20, max: 30, round: 0.5, fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} дБ` },
  { key: 'fade', name: 'Фейды', desc: 'Плавное появление и затухание', icon: 'fade', short: 'FADE',
    param: 'fade_ms', min: 50, max: 5000, log: true, round: 10, fmt: (v) => (v >= 1000 ? `${(v / 1000).toFixed(2)} с` : `${v} мс`) },
  { key: 'normalize', name: 'Нормализация', desc: 'Громко, но без перегруза', icon: 'activity', short: 'NORM',
    param: 'normalize_db', min: -12, max: 0, round: 0.5, fmt: (v) => `${v.toFixed(1)} дБ` },
];

const KNOB_R = 31, KNOB_C = 37;
function arcPath(t) {
  const a0 = -135, a1 = -135 + 270 * t;
  const pt = (a) => { const r = (a * Math.PI) / 180; return [KNOB_C + KNOB_R * Math.sin(r), KNOB_C - KNOB_R * Math.cos(r)]; };
  const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${KNOB_R} ${KNOB_R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}
const toT = (fx, v) => clamp(fx.log ? Math.log(v / fx.min) / Math.log(fx.max / fx.min) : (v - fx.min) / (fx.max - fx.min), 0, 1);
const fromT = (fx, t) => {
  t = clamp(t, 0, 1);
  const v = fx.log ? fx.min * Math.pow(fx.max / fx.min, t) : fx.min + (fx.max - fx.min) * t;
  return clamp(Math.round(v / fx.round) * fx.round, fx.min, fx.max);
};

function buildFx() {
  document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute"><defs>
    <linearGradient id="knobGrad" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#22d3ee"/><stop offset=".6" stop-color="#a78bfa"/><stop offset="1" stop-color="#f472b6"/></linearGradient></defs></svg>`);
  $('#fxGrid').innerHTML = FX.map((fx, i) => `
    <div class="fx" data-key="${fx.key}" style="animation-delay:${i * 40}ms">
      <div class="fx-head"><span class="fx-ico">${icon(fx.icon)}</span><span class="fx-name">${fx.name}</span></div>
      <div class="fx-desc">${fx.desc}</div>
      <button class="fx-switch" title="Включить / выключить"></button>
      <div class="knob-wrap">
        <div class="knob" title="Захватите и вращайте по кругу · колесо мыши тоже крутит · Shift — точнее · двойной клик — по умолчанию">
          <svg viewBox="0 0 74 74"><path class="k-track" d="${arcPath(1)}"/><path class="k-val" stroke="url(#knobGrad)" d=""/></svg>
          <div class="knob-face"></div><div class="knob-dot"></div>
        </div>
        <div class="knob-value"></div>
      </div>
    </div>`).join('');

  $$('#fxGrid .fx').forEach((el) => {
    const fx = FX.find((x) => x.key === el.dataset.key);
    const knob = $('.knob', el);
    $('.fx-switch', el).addEventListener('click', () => { S.filters[fx.key] = !S.filters[fx.key]; renderFx(); });
    // Ручку вращают как настоящую: захватили и ведём мышь по кругу вокруг центра.
    // Считается поворот относительно прошлого положения курсора, поэтому значение не прыгает при захвате.
    let dragging = false, lastAngle = 0, dragT = 0;
    const angleAt = (e) => {
      const r = knob.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      return { a: (Math.atan2(dx, -dy) * 180) / Math.PI, dist: Math.hypot(dx, dy) };
    };
    knob.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastAngle = angleAt(e).a;
      dragT = toT(fx, S.filters[fx.param]);
      knob.classList.add('turning');
      try { knob.setPointerCapture(e.pointerId); } catch (err) { /* без захвата тоже работает */ }
    });
    knob.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const { a, dist } = angleAt(e);
      if (dist < 6) return;  // у самого центра угол скачет — пропускаем
      let delta = a - lastAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      lastAngle = a;
      dragT = clamp(dragT + (delta / 270) * (e.shiftKey ? 0.25 : 1), 0, 1);
      setParam(fx, fromT(fx, dragT));
    });
    const release = () => { dragging = false; knob.classList.remove('turning'); };
    knob.addEventListener('pointerup', release);
    knob.addEventListener('pointercancel', release);
    knob.addEventListener('wheel', (e) => {
      e.preventDefault();
      const t = toT(fx, S.filters[fx.param]) + (e.deltaY < 0 ? 1 : -1) * (e.shiftKey ? 0.005 : 0.025);
      setParam(fx, fromT(fx, t));
    }, { passive: false });
    knob.addEventListener('dblclick', () => setParam(fx, S.filterDefaults[fx.param]));
  });
  renderFx();
}

function setParam(fx, v) {
  S.filters[fx.param] = v;
  S.filters[fx.key] = true;   // покрутили ручку — эффект включается
  renderFx();
}

function renderFx() {
  for (const fx of FX) {
    const el = $(`#fxGrid .fx[data-key="${fx.key}"]`);
    const v = S.filters[fx.param];
    const t = toT(fx, v);
    el.classList.toggle('on', !!S.filters[fx.key]);
    $('.k-val', el).setAttribute('d', t > 0.004 ? arcPath(t) : '');
    $('.knob-dot', el).style.transform = `rotate(${-135 + 270 * t}deg)`;
    $('.knob-value', el).textContent = fx.fmt(v);
  }
  $('#fxChain').innerHTML = FX.map((fx, i) => `${i ? '<span class="chain-link"></span>' : ''}<span class="chain-node ${S.filters[fx.key] ? 'on' : ''}">${fx.short}</span>`).join('');
}

async function openFx() {
  if (!needSel() || S.rec.writing) return;
  if (!S.wave) await ensureLoaded();
  $('#fxFile').textContent = fileByPath(S.sel)?.name || '';
  renderFx();
  $('#fxDrawer').classList.add('open');
  $('#fxBack').classList.add('open');
  S.fxOpen = true;
}

async function closeFx() {
  if (!S.fxOpen) return;
  S.fxOpen = false;
  $('#fxDrawer').classList.remove('open');
  $('#fxBack').classList.remove('open');
  if (S.play.preview) {
    const r = await api.end_preview();
    if (r && r.ok) setWave(r);
  }
}

const anyFx = () => FX.some((fx) => S.filters[fx.key]);

async function busy(text, fn) {
  $('#busyText').textContent = text;
  $('#busy').classList.add('open');
  try { return await fn(); } finally { $('#busy').classList.remove('open'); }
}

async function previewFx() {
  if (!anyFx()) { toast('Включите хотя бы один эффект', 'info'); return; }
  const r = await busy('Применяю эффекты…', () => api.preview(S.sel, S.filters));
  if (!r.ok) { toast(r.error, 'err'); return; }
  setWave(r);
  toast('Предпрослушивание: так запись будет звучать после обработки', 'info');
}

async function saveFx(overwrite) {
  if (!anyFx()) { toast('Включите хотя бы один эффект', 'info'); return; }
  if (overwrite) {
    const ok = await modal({ icon: 'alert', title: 'Заменить исходную запись?', text: 'Файл будет перезаписан обработанной версией. Старая версия уйдёт в Корзину.', ok: 'Заменить', danger: true });
    if (!ok) return;
  }
  const r = await busy('Сохраняю…', () => api.save_fx(S.sel, S.filters, overwrite));
  if (!r.ok) { toast(r.error, 'err'); return; }
  S.play.preview = false;
  S.fxOpen = false;
  $('#fxDrawer').classList.remove('open');
  $('#fxBack').classList.remove('open');
  S.newPath = r.path;
  await loadFiles();
  await select(r.path);
  toast(overwrite ? 'Запись заменена обработанной версией' : 'Сохранено как новая запись', 'ok');
}

/* ================================================================ Модальные окна, меню, тосты */
function modal({ icon: ic = 'info', title, text = '', html = '', input = null, ok = 'OK', cancel = 'Отмена', danger = false }) {
  return new Promise((resolve) => {
    const m = $('#modal');
    m.className = 'modal' + (danger ? ' danger' : '');
    m.innerHTML = `<h3>${icon(ic)}${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}${html}
      ${input !== null ? '<input id="modalInput" spellcheck="false">' : ''}
      <div class="modal-actions">${cancel ? `<button class="btn ghost" data-r="0">${cancel}</button>` : ''}
      <button class="btn ${danger ? 'danger-solid' : 'primary'}" data-r="1">${ok}</button></div>`;
    const inp = $('#modalInput', m);
    if (inp) inp.value = input;
    $('#modalBack').classList.add('open');
    setTimeout(() => { if (inp) { inp.focus(); inp.select(); } }, 60);
    S.modal = (yes) => {
      $('#modalBack').classList.remove('open');
      S.modal = null;
      resolve(yes ? (inp ? inp.value : true) : null);
    };
    $$('[data-r]', m).forEach((b) => b.addEventListener('click', () => S.modal(b.dataset.r === '1')));
  });
}

function showKeys() {
  const keys = [
    ['Ctrl R', 'Начать / остановить запись'], ['Пробел', 'Проиграть / пауза'], ['← →', 'Перемотка на 5 секунд'],
    ['↑ ↓', 'Предыдущая / следующая запись'], ['Home', 'В начало записи'], ['Ctrl E', 'Показать файл в папке'],
    ['Ctrl C', 'Копировать файл'], ['Ctrl Shift C', 'Копировать путь'], ['Ctrl F', 'Эффекты'],
    ['F2', 'Переименовать'], ['Delete', 'Удалить в Корзину'], ['Ctrl L', 'Поиск'], ['F5', 'Обновить список'],
  ];
  modal({ icon: 'keyboard', title: 'Горячие клавиши', html: `<div class="keys">${keys.map(([k, v]) => `<kbd>${k}</kbd><span>${v}</span>`).join('')}</div>`, ok: 'Понятно', cancel: '' });
}

function showCtx(x, y, path) {
  const playing = S.play.playing && path === S.sel;
  const items = [
    [playing ? 'pause' : 'play', playing ? 'Пауза' : 'Проиграть', 'Пробел', togglePlay],
    ['folderOpen', 'Показать в папке', 'Ctrl E', reveal],
    ['copy', 'Копировать файл', 'Ctrl C', copyFile],
    ['link', 'Копировать путь', 'Ctrl ⇧ C', copyPath],
    null,
    ['sliders', 'Эффекты…', 'Ctrl F', openFx],
    ['pencil', 'Переименовать', 'F2', renameSel],
    null,
    ['trash', 'Удалить в Корзину', 'Del', deleteSel, 'danger'],
  ];
  const ctx = $('#ctx');
  ctx.innerHTML = items.map((it, i) => it
    ? `<button class="menu-item ${it[4] || ''}" data-i="${i}">${icon(it[0])}<span class="menu-text">${it[1]}</span><kbd>${it[2]}</kbd></button>`
    : '<div class="menu-sep"></div>').join('');
  $$('[data-i]', ctx).forEach((b) => b.addEventListener('click', () => { hideCtx(); items[b.dataset.i][3](); }));
  ctx.style.left = '0px'; ctx.style.top = '0px';
  ctx.classList.add('open');
  const w = ctx.offsetWidth, h = ctx.offsetHeight;
  ctx.style.left = Math.min(x, innerWidth - w - 8) + 'px';
  ctx.style.top = Math.min(y, innerHeight - h - 8) + 'px';
}
const hideCtx = () => $('#ctx').classList.remove('open');

function toast(text, kind = 'info') {
  const ic = { ok: 'check', err: 'alert', rec: 'mic', info: 'info' }[kind] || 'info';
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `<span class="t-ico">${icon(ic)}</span><span>${esc(text)}</span>`;
  const box = $('#toasts');
  box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, kind === 'err' ? 5000 : 3000);
}

let statusTimer = null;
function setStatus(text) {
  const el = $('#status');
  el.textContent = text;
  el.classList.add('flash');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => el.classList.remove('flash'), 800);
}

/* ================================================================ Обработчики */
function bindUI() {
  // кнопки не забирают фокус — иначе пробел нажимал бы последнюю кнопку
  document.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#ctx')) hideCtx();
    if (!e.target.closest('#micDrop')) $('#micDrop').classList.remove('open');
  });

  $('#themeSeg').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    S.theme = b.dataset.v; applyTheme(); api.set_pref('theme', S.theme);
  });
  $('#chanSeg').addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    S.channels = Number(b.dataset.v); setSeg($('#chanSeg'), b.dataset.v);
    const r = await api.set_channels(S.channels);
    if (r && !r.ok) toast(r.error, 'err');
  });
  $('#btnKeys').addEventListener('click', showKeys);
  $('#btnOpenFolder').addEventListener('click', () => api.open_folder());
  $('#btnFolder').addEventListener('click', chooseFolder);

  $('#search').addEventListener('input', (e) => { S.query = e.target.value; renderList(false); });
  $('#sort').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const k = b.dataset.k;
    S.sort = S.sort.key === k ? { key: k, dir: -S.sort.dir } : { key: k, dir: k === 'name' ? 1 : -1 };
    renderSort(); renderList(false); api.set_pref('sort', S.sort);
  });

  const list = $('#list');
  list.addEventListener('click', (e) => { const it = e.target.closest('.item'); if (it && it.dataset.path !== S.sel) select(it.dataset.path); });
  list.addEventListener('dblclick', async (e) => {
    const it = e.target.closest('.item'); if (!it) return;
    if (it.dataset.path !== S.sel) await select(it.dataset.path);
    if (!S.play.playing) togglePlay();
  });
  list.addEventListener('contextmenu', async (e) => {
    const it = e.target.closest('.item'); if (!it) return;
    if (it.dataset.path !== S.sel) select(it.dataset.path);
    showCtx(e.clientX, e.clientY, it.dataset.path);
  });

  $('#btnPlay').addEventListener('click', togglePlay);
  $('#btnStop').addEventListener('click', stopPlay);
  $('#btnBack').addEventListener('click', () => seekTo(curPos() - 5));
  $('#btnFwd').addEventListener('click', () => seekTo(curPos() + 5));
  $('#btnReveal').addEventListener('click', reveal);
  $('#btnCopy').addEventListener('click', copyFile);
  $('#btnFx').addEventListener('click', openFx);
  $('#btnRename').addEventListener('click', renameSel);
  $('#btnDelete').addEventListener('click', deleteSel);

  $('#btnRec').addEventListener('click', toggleRec);
  $('#btnRecPause').addEventListener('click', toggleRecPause);
  $('#btnMonitor').addEventListener('click', toggleMonitor);
  $('#micBtn').addEventListener('click', () => $('#micDrop').classList.toggle('open'));
  $('#micMenu').addEventListener('click', (e) => {
    const b = e.target.closest('.menu-item'); if (!b) return;
    $('#micDrop').classList.remove('open');
    if (b.hasAttribute('data-refresh')) refreshMics(); else chooseMic(b.dataset.dev);
  });

  $('#fxClose').addEventListener('click', closeFx);
  $('#fxBack').addEventListener('click', closeFx);
  $('#fxReset').addEventListener('click', () => { S.filters = { ...S.filterDefaults }; renderFx(); });
  $('#fxPreview').addEventListener('click', previewFx);
  $('#fxSave').addEventListener('click', () => saveFx(false));
  $('#fxReplace').addEventListener('click', () => saveFx(true));
  $('#modalBack').addEventListener('mousedown', (e) => { if (e.target.id === 'modalBack' && S.modal) S.modal(false); });

  // волна: наведение и перемотка
  const ws = $('#waveScreen');
  let dragging = false;
  const xToSec = (x) => (x / ws.clientWidth) * (S.play.dur || 0);
  ws.addEventListener('pointermove', (e) => {
    const x = e.offsetX;
    S.hoverX = x;
    const ht = $('#hoverTime');
    if (S.wave && !S.rec.writing) {
      ht.textContent = fmtDur(xToSec(x));
      ht.style.left = clamp(x, 26, ws.clientWidth - 26) + 'px';
      ht.classList.add('show');
    } else ht.classList.remove('show');
    if (dragging) seekTo(xToSec(x), false);
  });
  ws.addEventListener('pointerleave', () => { S.hoverX = null; $('#hoverTime').classList.remove('show'); });
  ws.addEventListener('pointerdown', (e) => {
    if (!S.wave || S.rec.writing) return;
    dragging = true; ws.setPointerCapture(e.pointerId); seekTo(xToSec(e.offsetX), false);
  });
  ws.addEventListener('pointerup', (e) => { if (dragging) { dragging = false; seekTo(xToSec(e.offsetX), true); } });

  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', () => { setSeg($('#chanSeg'), String(S.channels)); setSeg($('#themeSeg'), S.theme); });
}

function moveSel(delta) {
  const files = visibleFiles();
  if (!files.length) return;
  let i = files.findIndex((f) => f.path === S.sel);
  i = i < 0 ? 0 : clamp(i + delta, 0, files.length - 1);
  if (files[i].path !== S.sel) select(files[i].path, { soon: true });
}

function onKey(e) {
  const typing = e.target.matches('input, textarea');
  if (S.modal) {
    if (e.key === 'Escape') S.modal(false);
    if (e.key === 'Enter') { e.preventDefault(); S.modal(true); }
    return;
  }
  if (e.key === 'F5') { e.preventDefault(); loadFiles(); return; }
  if (e.ctrlKey && !e.altKey) {
    const handlers = {
      KeyR: toggleRec, KeyE: reveal, KeyF: openFx,
      KeyL: () => { $('#search').focus(); $('#search').select(); },
    };
    if (handlers[e.code]) { e.preventDefault(); handlers[e.code](); return; }
    if (e.code === 'KeyC' && !(typing && e.target.selectionStart !== e.target.selectionEnd)) {
      e.preventDefault(); e.shiftKey ? copyPath() : copyFile(); return;
    }
    if (['KeyP', 'KeyS', 'KeyU', 'KeyG', 'KeyJ', 'KeyH', 'KeyN', 'Equal', 'Minus', 'Digit0'].includes(e.code)) e.preventDefault();
    return;
  }
  if (e.key === 'Escape') {
    hideCtx(); $('#micDrop').classList.remove('open');
    if (S.fxOpen) closeFx();
    if (typing) e.target.blur();
    return;
  }
  if (typing) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); e.target.blur(); moveSel(e.key === 'Enter' ? 0 : 1); }
    return;
  }
  const k = {
    ' ': togglePlay, Enter: togglePlay,
    ArrowLeft: () => seekTo(curPos() - 5), ArrowRight: () => seekTo(curPos() + 5),
    ArrowUp: () => moveSel(-1), ArrowDown: () => moveSel(1),
    Home: () => seekTo(0), Delete: deleteSel, F2: renameSel,
  }[e.key];
  if (k) { e.preventDefault(); k(); }
}

/* ================================================================ Отрисовка */
// Цвета экранов: в тёмной теме — неон на чёрном, в светлой — насыщенные цвета на светлом
const PAL = {
  dark: {
    cyan: '#22d3ee', indigo: '#818cf8', violet: '#a78bfa', pink: '#f472b6', amber: '#fbbf24', red: '#ff3b5c', redRgb: '255,59,92',
    dim: 'rgba(165,185,215,.26)', rulerBg: 'rgba(200,225,255,.04)', tickMajor: 'rgba(200,225,255,.35)', tickMinor: 'rgba(200,225,255,.15)',
    text: 'rgba(200,225,255,.55)', label: 'rgba(200,225,255,.45)', scale: 'rgba(200,225,255,.35)', axis: 'rgba(255,255,255,.06)',
    hover: 'rgba(255,255,255,.35)', glowCyan: 'rgba(34,211,238,.55)', glowAmber: 'rgba(251,191,36,.6)', cyan0: 'rgba(34,211,238,0)',
    headCyan: 'rgba(34,211,238,.18)', headAmber: 'rgba(251,191,36,.18)', head: '#ffffff',
    pink0: 'rgba(244,114,182,0)', pinkMid: 'rgba(244,114,182,.55)', redGlow: 'rgba(255,59,92,.6)',
    vu: [[34, 211, 238], [251, 191, 36], [255, 59, 92]], unlit: 0.09, specGlow: 'rgba(129,140,248,.6)', cap: 'rgba(255,255,255,.75)', blur: 1,
  },
  light: {
    cyan: '#06b6d4', indigo: '#6366f1', violet: '#8b5cf6', pink: '#db2777', amber: '#d97706', red: '#e11d48', redRgb: '225,29,72',
    dim: 'rgba(51,65,85,.2)', rulerBg: 'rgba(15,23,42,.03)', tickMajor: 'rgba(15,23,42,.35)', tickMinor: 'rgba(15,23,42,.15)',
    text: 'rgba(15,23,42,.6)', label: 'rgba(15,23,42,.5)', scale: 'rgba(15,23,42,.42)', axis: 'rgba(15,23,42,.08)',
    hover: 'rgba(15,23,42,.35)', glowCyan: 'rgba(6,182,212,.35)', glowAmber: 'rgba(217,119,6,.35)', cyan0: 'rgba(6,182,212,0)',
    headCyan: 'rgba(6,182,212,.12)', headAmber: 'rgba(217,119,6,.12)', head: '#0e1525',
    pink0: 'rgba(219,39,119,0)', pinkMid: 'rgba(219,39,119,.5)', redGlow: 'rgba(225,29,72,.35)',
    vu: [[8, 145, 178], [217, 119, 6], [225, 29, 72]], unlit: 0.12, specGlow: 'rgba(99,102,241,.3)', cap: 'rgba(15,23,42,.55)', blur: 0.6,
  },
};
let K = PAL.dark;

const C = { wave: null, vu: null, spec: null };
let DPR = 1;
function setupCanvases() {
  for (const [key, id] of [['wave', 'wave'], ['vu', 'vu'], ['spec', 'spectrum']]) {
    const cv = document.getElementById(id);
    C[key] = { cv, ctx: cv.getContext('2d') };
    new ResizeObserver(() => {
      DPR = window.devicePixelRatio || 1;
      cv.width = Math.max(1, Math.round(cv.clientWidth * DPR));
      cv.height = Math.max(1, Math.round(cv.clientHeight * DPR));
      if (key === 'wave') S.waveCache = null;
    }).observe(cv);
  }
}

let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  K = S.dark ? PAL.dark : PAL.light;
  try {
    drawWave(now);
    drawVU(dt, now);
    drawSpectrum(dt, now);
    updateTimecode(now);
  } catch (err) {
    api.log('draw: ' + err);
  }
  requestAnimationFrame(frame);
}

let tcLast = '';
function updateTimecode(now) {
  let pos, dur, live = S.rec.writing;
  if (live) { pos = S.rec.elapsed; dur = null; } else { pos = curPos(now); dur = S.play.dur; }
  const [base, t] = fmtDur(pos, true);
  const key = `${base}.${t}|${dur}|${live}`;
  if (key === tcLast) return;
  tcLast = key;
  $('#tcPos').innerHTML = `${base}<small>.${t}</small>`;
  $('#tcDur').textContent = live ? '● REC' : `/ ${fmtDur(dur)}`;
  $('#tcPos').style.color = live ? 'var(--rec)' : '';
  $('#tcDur').style.color = live ? 'var(--rec)' : '';
}

function niceStep(dur, width, dpr) {
  const steps = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];
  for (const s of steps) if ((s / dur) * width >= 90 * dpr) return s;
  return 7200;
}

let labelMode = '';
function setWaveLabel(mode) {
  if (mode === labelMode) return;
  labelMode = mode;
  const el = $('#waveLabel');
  el.className = 'screen-label ' + mode;
  el.textContent = { live: '● LIVE', paused: '❚❚ ПАУЗА', preview: 'ПРЕДПРОСЛУШИВАНИЕ', '': '' }[mode];
}

function drawWave(now) {
  const { cv, ctx } = C.wave;
  const W = cv.width, H = cv.height, d = DPR;
  ctx.clearRect(0, 0, W, H);
  if (S.rec.writing) { setWaveLabel(S.rec.paused ? 'paused' : 'live'); return drawLive(ctx, W, H, d, now); }
  if (!S.wave) { setWaveLabel(''); return; }
  setWaveLabel(S.wave.preview ? 'preview' : '');

  const rulerH = 24 * d, top = rulerH + 6 * d, bottom = H - 10 * d;
  const mid = (top + bottom) / 2, amp = (bottom - top) / 2;
  const step = 3 * d, bw = 2 * d;
  const n = Math.max(1, Math.floor(W / step));
  const dur = S.wave.duration || 1;

  // кэш столбиков волны (пересчитывается при смене записи или размера)
  if (!S.waveCache || S.waveCache.n !== n || S.waveCache.H !== H) {
    const hi = S.wave.hi, lo = S.wave.lo, m = hi.length;
    let peak = 0.02;
    for (let i = 0; i < m; i++) peak = Math.max(peak, hi[i], -lo[i]);
    const path = new Path2D();
    for (let i = 0; i < n; i++) {
      const a = Math.floor((i * m) / n), b = Math.max(a + 1, Math.floor(((i + 1) * m) / n));
      let h = -1, l = 1;
      for (let j = a; j < b && j < m; j++) { if (hi[j] > h) h = hi[j]; if (lo[j] < l) l = lo[j]; }
      if (h < l) { h = 0; l = 0; }
      const y0 = mid - (h / peak) * amp, y1 = mid - (l / peak) * amp;
      path.rect(i * step, y0, bw, Math.max(d, y1 - y0));
    }
    S.waveCache = { n, H, path };
  }
  const { path } = S.waveCache;
  const preview = S.wave.preview;
  const px = (curPos(now) / dur) * W;

  // ось времени
  ctx.fillStyle = K.rulerBg;
  ctx.fillRect(0, 0, W, rulerH);
  const tstep = niceStep(dur, W, d);
  ctx.font = `${10 * d}px "Cascadia Mono", Consolas, monospace`;
  ctx.textBaseline = 'middle';
  for (let t = 0; t <= dur + 1e-6; t += tstep / 4) {
    const x = Math.round((t / dur) * W) + 0.5;
    const major = Math.abs(t / tstep - Math.round(t / tstep)) < 1e-6;
    ctx.fillStyle = major ? K.tickMajor : K.tickMinor;
    ctx.fillRect(x, rulerH - (major ? 8 : 4) * d, d, (major ? 8 : 4) * d);
    if (major && x < W - 40 * d) {
      ctx.fillStyle = K.text;
      const label = tstep < 1 ? `${fmtDur(t)}.${Math.round((t % 1) * 10)}` : fmtDur(t);
      ctx.fillText(label, x + 4 * d, rulerH / 2 - 2 * d);
    }
  }
  ctx.fillStyle = K.axis;
  ctx.fillRect(0, mid, W, d);

  // волна: непроигранная часть тусклая, проигранная — градиент
  ctx.fillStyle = K.dim;
  ctx.fill(path);
  const g = ctx.createLinearGradient(0, 0, W, 0);
  if (preview) { g.addColorStop(0, K.amber); g.addColorStop(1, K.pink); }
  else { g.addColorStop(0, K.cyan); g.addColorStop(0.55, K.indigo); g.addColorStop(1, K.pink); }
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, px, H); ctx.clip();
  ctx.fillStyle = g;
  ctx.shadowColor = preview ? K.glowAmber : K.glowCyan;
  ctx.shadowBlur = 10 * d;
  ctx.fill(path);
  ctx.restore();

  // наведение
  if (S.hoverX != null) {
    ctx.fillStyle = K.hover;
    ctx.fillRect(Math.round(S.hoverX * d), rulerH, d, H - rulerH);
  }
  // курсор воспроизведения
  const glow = ctx.createLinearGradient(px - 40 * d, 0, px, 0);
  glow.addColorStop(0, K.cyan0);
  glow.addColorStop(1, preview ? K.headAmber : K.headCyan);
  ctx.fillStyle = glow;
  ctx.fillRect(px - 40 * d, rulerH, 40 * d, H - rulerH);
  ctx.save();
  ctx.shadowColor = preview ? K.amber : K.cyan;
  ctx.shadowBlur = 14 * d;
  ctx.fillStyle = K.head;
  ctx.fillRect(px - d, rulerH, 2 * d, H - rulerH);
  ctx.beginPath();
  ctx.moveTo(px - 6 * d, rulerH); ctx.lineTo(px + 6 * d, rulerH); ctx.lineTo(px, rulerH + 8 * d); ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLive(ctx, W, H, d, now) {
  const step = 3 * d, bw = 2 * d, group = 3;
  const mid = H / 2, amp = H / 2 - 16 * d;
  const headX = W * 0.86;
  const nBars = Math.floor(headX / step);
  const L = S.live;
  const total = Math.floor(L.length / group);
  ctx.fillStyle = K.axis;
  ctx.fillRect(0, mid, W, d);
  const g = ctx.createLinearGradient(0, 0, headX, 0);
  g.addColorStop(0, K.pink0);
  g.addColorStop(0.5, K.pinkMid);
  g.addColorStop(1, K.red);
  ctx.fillStyle = g;
  ctx.save();
  ctx.shadowColor = K.redGlow;
  ctx.shadowBlur = 8 * d;
  ctx.beginPath();
  for (let i = 0; i < nBars; i++) {
    const gi = total - 1 - i;
    if (gi < 0) break;
    let v = 0;
    for (let j = 0; j < group; j++) v = Math.max(v, L[gi * group + j] || 0);
    const h = Math.max(d, Math.pow(v, 0.6) * amp);
    ctx.rect(headX - (i + 1) * step, mid - h, bw, h * 2);
  }
  ctx.fill();
  ctx.restore();
  // головка записи
  const pulse = 0.6 + 0.4 * Math.sin(now / 180);
  ctx.save();
  ctx.shadowColor = K.red;
  ctx.shadowBlur = 18 * d;
  ctx.fillStyle = `rgba(${K.redRgb},${S.rec.paused ? 0.4 : pulse})`;
  ctx.fillRect(headX, 8 * d, 2 * d, H - 16 * d);
  ctx.beginPath();
  ctx.arc(headX + d, 8 * d, 4 * d, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function levelToFrac(v) {
  const db = 20 * Math.log10(Math.max(v, 1e-6));
  return clamp((db + 60) / 60, 0, 1);
}

function drawVU(dt, now) {
  const { cv, ctx } = C.vu;
  const W = cv.width, H = cv.height, d = DPR;
  ctx.clearRect(0, 0, W, H);
  const padX = 34 * d, padR = 52 * d;
  const barH = Math.min(22 * d, (H - 70 * d) / 2);
  const gap = 12 * d;
  const totalH = barH * 2 + gap;
  const top = (H - totalH) / 2 - 4 * d;
  const segs = 30, sw = (W - padX - padR) / segs;

  ctx.font = `700 ${10 * d}px "Cascadia Mono", Consolas, monospace`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = K.label;
  ctx.fillText('LEVEL · dBFS', 12 * d, 16 * d);

  for (let c = 0; c < 2; c++) {
    const m = S.vu[c];
    const target = levelToFrac(S.levels[c] || 0);
    m.v = target > m.v ? target : Math.max(target, m.v - dt * 0.9);
    if (m.v >= m.peak) { m.peak = m.v; m.peakT = now; } else if (now - m.peakT > 1200) m.peak = Math.max(0, m.peak - dt * 0.6);
    if ((S.levels[c] || 0) >= 0.985) m.clipT = now;
    const y = top + c * (barH + gap);
    ctx.fillStyle = K.text;
    ctx.fillText(c ? 'R' : 'L', 14 * d, y + barH / 2);
    const peakSeg = Math.min(segs - 1, Math.floor(m.peak * segs));
    for (let i = 0; i < segs; i++) {
      const f = (i + 0.5) / segs;
      const color = K.vu[f < 0.7 ? 0 : f < 0.9 ? 1 : 2];
      const lit = f <= m.v;
      const x = padX + i * sw;
      if (lit || (i === peakSeg && m.peak > 0.02)) {
        ctx.fillStyle = `rgb(${color})`;
        ctx.shadowColor = `rgba(${color},.8)`;
        ctx.shadowBlur = 8 * d * K.blur;
      } else {
        ctx.fillStyle = `rgba(${color},${K.unlit})`;
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(x, y, sw - 2 * d, barH);
    }
    ctx.shadowBlur = 0;
    const db = 20 * Math.log10(Math.max(S.levels[c] || 0, 1e-6));
    const clip = now - m.clipT < 1500;
    ctx.fillStyle = clip ? K.red : K.text;
    ctx.fillText(clip ? 'CLIP' : db < -59 ? '—' : db.toFixed(0), W - padR + 10 * d, y + barH / 2);
  }
  // шкала
  ctx.fillStyle = K.scale;
  ctx.font = `${9 * d}px "Cascadia Mono", Consolas, monospace`;
  ctx.textAlign = 'center';
  for (const db of [-60, -40, -30, -20, -12, -6, 0]) {
    const x = padX + ((db + 60) / 60) * (W - padX - padR);
    ctx.fillText(String(db), x, top + totalH + 14 * d);
  }
  ctx.textAlign = 'left';
}

function drawSpectrum(dt, now) {
  const { cv, ctx } = C.spec;
  const W = cv.width, H = cv.height, d = DPR;
  ctx.clearRect(0, 0, W, H);
  const padX = 12 * d, bottom = H - 22 * d, top = 28 * d;
  const bw = (W - padX * 2) / BANDS;
  const idle = !S.hasSignal;
  const grad = ctx.createLinearGradient(0, bottom, 0, top);
  grad.addColorStop(0, K.cyan);
  grad.addColorStop(0.55, K.violet);
  grad.addColorStop(1, K.pink);
  ctx.fillStyle = grad;
  ctx.shadowColor = K.specGlow;
  ctx.shadowBlur = 10 * d;
  ctx.beginPath();
  for (let i = 0; i < BANDS; i++) {
    const target = idle ? 0.03 + 0.025 * (1 + Math.sin(now / 700 + i / 3.2)) : S.specTarget[i];
    const k = target > S.spec[i] ? 0.5 : idle ? 0.08 : 0.16;
    S.spec[i] += (target - S.spec[i]) * k;
    S.specPeak[i] = Math.max(S.specPeak[i] - dt * 0.35, S.spec[i]);
    const h = S.spec[i] * (bottom - top);
    ctx.roundRect(padX + i * bw + d, bottom - h, bw - 2.5 * d, h, [2 * d, 2 * d, 0, 0]);
  }
  ctx.fill();
  ctx.shadowBlur = 0;
  // пиковые засечки
  ctx.fillStyle = K.cap;
  for (let i = 0; i < BANDS; i++) {
    if (S.specPeak[i] < 0.08) continue;
    ctx.fillRect(padX + i * bw + d, bottom - S.specPeak[i] * (bottom - top) - 3 * d, bw - 2.5 * d, 2 * d);
  }
  // подписи частот
  ctx.fillStyle = K.scale;
  ctx.font = `${9 * d}px "Cascadia Mono", Consolas, monospace`;
  ctx.textAlign = 'center';
  const fmax = 16000;
  for (const [f, label] of [[50, '50'], [100, '100'], [250, '250'], [500, '500'], [1000, '1k'], [2500, '2.5k'], [5000, '5k'], [10000, '10k']]) {
    const x = padX + (Math.log(f / 30) / Math.log(fmax / 30)) * (W - padX * 2);
    ctx.fillText(label, x, H - 9 * d);
  }
  ctx.textAlign = 'left';
}
