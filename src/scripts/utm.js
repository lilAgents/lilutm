// lilUTM — build clean UTM campaign URLs, live, fully client-side.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- theme (matches lilSchema) ---------- */
const MOON_SVG = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
const SUN_SVG = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4l1.4-1.4M18 6l1.4-1.4"/></g></svg>';

function setThemeIcon(btn, theme) {
  if (theme === 'dark') {
    btn.innerHTML = SUN_SVG;
    btn.setAttribute('aria-label', 'Switch to light mode');
  } else {
    btn.innerHTML = MOON_SVG;
    btn.setAttribute('aria-label', 'Switch to dark mode');
  }
}

function initTheme() {
  const btn = $('#ui-theme-btn');
  const current = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  setThemeIcon(btn, current());
  btn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('lilutm-theme', next); } catch (e) {}
    setThemeIcon(btn, next);
  });
}

/* ---------- UTM builder ---------- */
const PARAMS = [
  { id: 'f-source', key: 'utm_source' },
  { id: 'f-medium', key: 'utm_medium' },
  { id: 'f-campaign', key: 'utm_campaign' },
  { id: 'f-term', key: 'utm_term' },
  { id: 'f-content', key: 'utm_content' },
];

let built = '';

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildUrl() {
  const raw = $('#f-url').value.trim();
  const status = $('#status');
  const out = $('#out-url');
  const copy = $('#copy-btn');
  const params = $('#params');

  const blank = () => {
    built = '';
    out.textContent = '';
    out.removeAttribute('href');
    params.innerHTML = '';
    copy.disabled = true;
  };

  if (!raw) {
    blank();
    status.textContent = 'Enter a website URL';
    status.className = 'badge badge--muted';
    return;
  }

  let u;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
  } catch {
    blank();
    status.textContent = "That URL doesn't look valid";
    status.className = 'badge badge--bad';
    return;
  }

  const set = [];
  for (const p of PARAMS) {
    const v = $('#' + p.id).value.trim();
    if (v) {
      u.searchParams.set(p.key, v);
      set.push([p.key, v]);
    } else {
      u.searchParams.delete(p.key);
    }
  }

  built = u.toString();
  out.textContent = built;
  out.href = built;
  copy.disabled = false;
  params.innerHTML = set
    .map(([k, v]) => `<div class="param"><span class="param__k">${k}</span><span class="param__v">${escapeHtml(v)}</span></div>`)
    .join('');

  const core = ['utm_source', 'utm_medium', 'utm_campaign'].every((k) => u.searchParams.get(k));
  if (core) {
    status.textContent = 'Ready to track';
    status.className = 'badge badge--ok';
  } else {
    status.textContent = 'Tip: add source, medium & campaign';
    status.className = 'badge badge--muted';
  }
}

function initUtm() {
  initTheme();
  ['f-url', 'f-source', 'f-medium', 'f-campaign', 'f-term', 'f-content'].forEach((id) =>
    $('#' + id).addEventListener('input', buildUrl));
  $$('#presets .chip').forEach((c) =>
    c.addEventListener('click', () => {
      $('#f-source').value = c.dataset.src;
      $('#f-medium').value = c.dataset.med;
      buildUrl();
    }));
  $('#copy-btn').addEventListener('click', async () => {
    if (!built) return;
    try {
      await navigator.clipboard.writeText(built);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = built;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    const b = $('#copy-btn');
    const o = b.textContent;
    b.textContent = 'Copied!';
    setTimeout(() => { b.textContent = o; }, 1400);
  });
  buildUrl();
}

export { initUtm };
