// WaterWatch SA — shared utilities
// Page-specific logic lives in auth.js and each HTML file's inline script.

// Redirect root to login if not authenticated
if (window.location.pathname.endsWith('script.js') === false) {
  if (typeof Auth !== 'undefined') {
    const s = Auth.getSession();
    if (!s && !window.location.pathname.includes('index.html')) {
      window.location.href = 'index.html';
    }
  }
}
