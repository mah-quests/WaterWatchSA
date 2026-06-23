/* ── WaterWatch SA — Shared JS ──────────────────────── */

/* Utility: toggle aria-invalid + inline error visibility */
function setFieldError(fieldId, errorId, invalid) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(errorId);
  if (!input || !error) return;
  input.setAttribute('aria-invalid', String(invalid));
  error.classList.toggle('visible', invalid);
}

/* Utility: show a toast message */
function showToast(toastEl, type, message) {
  toastEl.className = 'toast ' + type;
  toastEl.textContent = message;
  toastEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
