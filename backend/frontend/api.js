// ─────────────────────────────────────────────────────────
// api.js — ReFind frontend API helper
// All pages import this to talk to the backend
// ─────────────────────────────────────────────────────────

const API_BASE = '/api';

// ── Auth helpers ──────────────────────────────────────────

function getToken() {
  return localStorage.getItem('refind_token');
}

function getUser() {
  const u = localStorage.getItem('refind_user');
  return u ? JSON.parse(u) : null;
}

function saveAuth(token, user) {
  localStorage.setItem('refind_token', token);
  localStorage.setItem('refind_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('refind_token');
  localStorage.removeItem('refind_user');
}

function isLoggedIn() {
  return !!getToken();
}

function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

// ── API fetch wrapper ─────────────────────────────────────

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Don't set Content-Type for FormData (browser sets it automatically with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(API_BASE + endpoint, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// ── Auth API ──────────────────────────────────────────────

async function register(full_name, email, password, phone_number) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ full_name, email, password, phone_number })
  });
  saveAuth(data.token, data.user);
  return data;
}

async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  saveAuth(data.token, data.user);
  return data;
}

function logout() {
  clearAuth();
  window.location.href = 'auth.html';
}

// ── Items API ─────────────────────────────────────────────

async function getItems(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.category_id && filters.category_id !== 'all') params.set('category_id', filters.category_id);
  if (filters.search) params.set('search', filters.search);

  const query = params.toString() ? `?${params}` : '';
  return apiFetch(`/items${query}`);
}

async function getItem(id) {
  return apiFetch(`/items/${id}`);
}

async function postItem(formData) {
  return apiFetch('/items', {
    method: 'POST',
    body: formData // FormData with photo
  });
}

async function updateItemStatus(id, status) {
  return apiFetch(`/items/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

async function deleteItem(id) {
  return apiFetch(`/items/${id}`, { method: 'DELETE' });
}

async function getMyPosts() {
  return apiFetch('/items/user/my-posts');
}

// ── Categories API ────────────────────────────────────────

async function getCategories() {
  return apiFetch('/categories');
}

// ── Navbar update helper ──────────────────────────────────
// Call this on every page to show correct login/logout state

function updateNavbar() {
  const loginBtn = document.getElementById('navLoginBtn');
  const userMenu = document.getElementById('navUserMenu');
  const userNameEl = document.getElementById('navUserName');

  if (!loginBtn) return;

  const user = getUser();

  if (isLoggedIn() && user) {
    loginBtn.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'block';
      if (userNameEl) userNameEl.textContent = user.full_name.split(' ')[0];
    }
  } else {
    loginBtn.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
  }
}

// ── Status badge helper ───────────────────────────────────

function getStatusBadge(status) {
  if (status === 'lost') return `<span class="badge status-lost">LOST</span>`;
  if (status === 'found') return `<span class="badge status-found">FOUND</span>`;
  return `<span class="badge status-resolved">RESOLVED</span>`;
}
