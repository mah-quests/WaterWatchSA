/**
 * WaterWatch SA — Shared API Client
 *
 * All frontend pages import this file to talk to the backend.
 * Usage:
 *   const outages = await api.outages.list({ status: 'reported' });
 *   const user    = await api.auth.login({ email, password });
 *
 * Token storage is handled here — pages don't touch localStorage directly.
 */

const API_BASE = window.WATERWATCH_API_BASE || 'http://localhost:3000/api';

/* ── Internal helpers ─────────────────────────────────────────────────────── */

function getToken() {
  return localStorage.getItem('ww_token');
}

function setToken(token) {
  if (token) localStorage.setItem('ww_token', token);
  else        localStorage.removeItem('ww_token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('ww_user') || 'null');
  } catch {
    return null;
  }
}

function setUser(user) {
  if (user) localStorage.setItem('ww_user', JSON.stringify(user));
  else       localStorage.removeItem('ww_user');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return data;
}

const get    = (path)        => request('GET',    path);
const post   = (path, body)  => request('POST',   path, body);
const put    = (path, body)  => request('PUT',    path, body);
const patch  = (path, body)  => request('PATCH',  path, body);
const del    = (path)        => request('DELETE', path);

/* ── Auth ─────────────────────────────────────────────────────────────────── */

const auth = {
  async register(payload) {
    const data = await post('/auth/register', payload);
    setToken(data.token);
    setUser(data.user);
    return data;
  },

  async login(email, password) {
    const data = await post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    return data;
  },

  async me() {
    return get('/auth/me');
  },

  logout() {
    setToken(null);
    setUser(null);
    window.location.href = '/login.html';
  },

  isAuthenticated() {
    return !!getToken();
  },

  currentUser() {
    return getUser();
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },
};

/* ── Outages ──────────────────────────────────────────────────────────────── */

const outages = {
  list(filters = {}) {
    const qs = new URLSearchParams(filters).toString();
    return get(`/outages${qs ? '?' + qs : ''}`);
  },

  get(id) {
    return get(`/outages/${id}`);
  },

  create(payload) {
    return post('/outages', payload);
  },

  updateStatus(id, status, note) {
    return patch(`/outages/${id}/status`, { status, note });
  },

  getUpdates(id) {
    return get(`/outages/${id}/updates`);
  },

  addUpdate(id, message) {
    return post(`/outages/${id}/updates`, { message });
  },
};

/* ── Water quality ────────────────────────────────────────────────────────── */

const waterQuality = {
  list(filters = {}) {
    const qs = new URLSearchParams(filters).toString();
    return get(`/water-quality${qs ? '?' + qs : ''}`);
  },

  latest() {
    return get('/water-quality/latest');
  },

  create(payload) {
    return post('/water-quality', payload);
  },
};

/* ── Municipalities ───────────────────────────────────────────────────────── */

const municipalities = {
  list(province) {
    return get(`/municipalities${province ? '?province=' + encodeURIComponent(province) : ''}`);
  },
};

/* ── UI helpers (nav, toast) ──────────────────────────────────────────────── */

const ui = {
  /** Call in every page's <script> to render the nav auth state */
  initNav() {
    const userEl   = document.getElementById('nav-user');
    const loginEl  = document.getElementById('nav-login');
    const logoutEl = document.getElementById('nav-logout');
    const user     = auth.currentUser();

    if (user) {
      if (userEl)   { userEl.textContent = user.firstName; userEl.classList.remove('hidden'); }
      if (logoutEl) logoutEl.classList.remove('hidden');
      if (loginEl)  loginEl.classList.add('hidden');
    } else {
      if (userEl)   userEl.classList.add('hidden');
      if (logoutEl) logoutEl.classList.add('hidden');
      if (loginEl)  loginEl.classList.remove('hidden');
    }

    if (logoutEl) {
      logoutEl.addEventListener('click', (e) => { e.preventDefault(); auth.logout(); });
    }

    /* Mobile hamburger */
    const toggle = document.getElementById('nav-toggle');
    const links  = document.getElementById('nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => links.classList.toggle('open'));
    }

    /* Active link highlight */
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.ww-nav__links a').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href.endsWith(current)) a.classList.add('active');
    });
  },

  /** Show a floating toast message */
  toast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('ww-toasts');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ww-toasts';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.textContent = message;
    container.appendChild(t);

    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity .3s';
      setTimeout(() => t.remove(), 300);
    }, duration);
  },

  /** Set an inline alert element (must have .alert class in HTML) */
  setAlert(el, message, type) {
    if (!el) return;
    el.className = `alert alert--${type} visible`;
    el.textContent = message;
  },

  clearAlert(el) {
    if (!el) return;
    el.className = 'alert';
    el.textContent = '';
  },

  /** Format a UTC date string to SA-friendly display */
  formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-ZA', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  },

  /** Pretty status label */
  statusLabel(status) {
    const map = {
      reported:      'Reported',
      investigating: 'Investigating',
      in_progress:   'In Progress',
      resolved:      'Resolved',
    };
    return map[status] || status;
  },

  severityLabel(s) {
    return { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }[s] || s;
  },

  qualityLabel(s) {
    return { normal: 'Normal', caution: 'Caution', unsafe: 'Unsafe', no_supply: 'No Supply' }[s] || s;
  },
};

/* ── Export (also available as window.api for plain-HTML pages) ─────────────  */

window.api = { auth, outages, waterQuality, municipalities, ui, getToken, getUser };
