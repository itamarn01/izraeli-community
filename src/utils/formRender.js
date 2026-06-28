// Shared helpers for rendering a form template's body with user-filled values.
// The admin writes bodyHtml containing {{key}} placeholders; here we substitute
// each placeholder with the matching value (always HTML-escaped to prevent XSS).

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatValue(field, raw) {
  if (field.type === 'date' && raw) {
    const d = new Date(raw);
    if (!isNaN(d)) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}/${d.getFullYear()}`;
    }
  }
  return String(raw);
}

// mode: 'fill'     → empty fields shown as underline blanks (user filling / final PDF)
//       'template' → empty fields shown as a labeled chip (admin live preview)
export function renderFormBody(bodyHtml, fields = [], values = {}, mode = 'fill') {
  let html = bodyHtml || '';
  (fields || []).forEach((f) => {
    const token = `{{${f.key}}}`;
    const raw = values[f.key];
    let replacement;
    if (raw != null && String(raw).trim() !== '') {
      replacement = `<span class="form-val">${escapeHtml(formatValue(f, raw))}</span>`;
    } else if (mode === 'template') {
      replacement = `<span class="form-ph">${escapeHtml(f.label)}</span>`;
    } else {
      replacement = `<span class="form-blank">＿＿＿＿＿</span>`;
    }
    html = html.split(token).join(replacement);
  });
  // Any leftover tokens (e.g. field deleted after authoring) → blank.
  html = html.replace(/\{\{[^}]+\}\}/g, '<span class="form-blank">＿＿＿＿＿</span>');
  return html;
}

// Validate required fields are filled. Returns array of missing labels.
export function missingRequired(fields = [], values = {}) {
  return (fields || [])
    .filter((f) => f.required && (values[f.key] == null || String(values[f.key]).trim() === ''))
    .map((f) => f.label);
}
