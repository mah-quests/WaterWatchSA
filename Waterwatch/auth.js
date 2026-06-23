// WaterWatch SA — Auth utilities (JWT-pattern with localStorage)
// In production this would use real JWTs verified against the Express/PostgreSQL backend.

const Auth = (() => {
  const TOKEN_KEY = 'ww_token';
  const USERS_KEY = 'ww_users';

  // Seed demo accounts on first load
  function _seedUsers() {
    if (localStorage.getItem(USERS_KEY)) return;
    const users = [
      { id: 'u1', name: 'Admin User',        email: 'admin@waterwatch.co.za',     password: 'Admin@123',     role: 'admin',      municipality: null,          verified: true,  createdAt: '2026-01-01' },
      { id: 'u2', name: 'Cape Town Water',   email: 'municipal@capetown.gov.za',  password: 'Muni@123',      role: 'municipal',  municipality: 'Cape Town',   verified: true,  createdAt: '2026-01-05' },
      { id: 'u3', name: 'Thabo Nkosi',       email: 'thabo@gmail.com',            password: 'Citizen@123',   role: 'citizen',    municipality: 'Cape Town',   verified: true,  createdAt: '2026-02-10' },
      { id: 'u4', name: 'Zanele Mokoena',    email: 'zanele@gmail.com',           password: 'Citizen@123',   role: 'citizen',    municipality: 'Johannesburg',verified: false, createdAt: '2026-03-15' },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function _getUsers() {
    _seedUsers();
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  }

  function _saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // Minimal base64 token encoding (simulates JWT payload)
  function _createToken(user) {
    const payload = { id: user.id, name: user.name, email: user.email, role: user.role, municipality: user.municipality, iat: Date.now() };
    return btoa(JSON.stringify(payload));
  }

  function _decodeToken(token) {
    try { return JSON.parse(atob(token)); } catch { return null; }
  }

  function login(email, password) {
    const users = _getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { ok: false, error: 'Invalid email or password.' };
    const token = _createToken(user);
    localStorage.setItem(TOKEN_KEY, token);
    return { ok: true, user };
  }

  function register({ name, email, password, role, municipality }) {
    const users = _getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const newUser = {
      id: 'u' + Date.now(),
      name, email, password, role,
      municipality: municipality || null,
      verified: role === 'citizen', // Citizens auto-verified; municipal accounts need admin approval
      createdAt: new Date().toISOString().split('T')[0],
    };
    users.push(newUser);
    _saveUsers(users);
    if (newUser.verified) {
      const token = _createToken(newUser);
      localStorage.setItem(TOKEN_KEY, token);
    }
    return { ok: true, user: newUser };
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = 'index.html';
  }

  function getSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    return _decodeToken(token);
  }

  function requireAuth(allowedRoles) {
    const session = getSession();
    if (!session) { window.location.href = 'index.html'; return null; }
    if (allowedRoles && !allowedRoles.includes(session.role)) {
      window.location.href = 'dashboard.html';
      return null;
    }
    return session;
  }

  // Admin: user management
  function getAllUsers()          { return _getUsers(); }
  function updateUserRole(id, role) {
    const users = _getUsers();
    const u = users.find(u => u.id === id);
    if (!u) return false;
    u.role = role;
    _saveUsers(users);
    return true;
  }
  function toggleVerified(id) {
    const users = _getUsers();
    const u = users.find(u => u.id === id);
    if (!u) return false;
    u.verified = !u.verified;
    _saveUsers(users);
    return true;
  }
  function deleteUser(id) {
    let users = _getUsers();
    users = users.filter(u => u.id !== id);
    _saveUsers(users);
    return true;
  }

  return { login, register, logout, getSession, requireAuth, getAllUsers, updateUserRole, toggleVerified, deleteUser };
})();
