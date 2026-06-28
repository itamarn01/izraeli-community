import { useRef, useEffect, useState } from 'react';
import {
  Bold, Italic, Underline, AlignRight, AlignCenter, AlignLeft,
  List, Heading, Plus, ChevronDown,
} from 'lucide-react';
import { escapeHtml } from '../../utils/formRender.js';

// Editable token chip representing a {{key}} placeholder.
function tokenSpan(key, label) {
  return `<span class="fld-token" contenteditable="false" data-key="${escapeHtml(key)}" style="background:#eef2ff;color:#4338ca;border-radius:6px;padding:1px 7px;font-size:0.85em;font-weight:700;margin:0 1px;white-space:nowrap;">${escapeHtml(label || key)}</span>`;
}

// {{key}} in stored HTML → visual chips for editing.
function hydrate(html, fields) {
  let out = html || '';
  (fields || []).forEach((f) => {
    out = out.split(`{{${f.key}}}`).join(tokenSpan(f.key, f.label));
  });
  out = out.replace(/\{\{([^}]+)\}\}/g, (m, k) => tokenSpan(k, k));
  return out;
}

// Editor DOM → stored HTML with {{key}} placeholders.
function serialize(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll('span.fld-token').forEach((s) => {
    s.replaceWith(document.createTextNode(`{{${s.getAttribute('data-key')}}}`));
  });
  return clone.innerHTML;
}

function ToolBtn({ onClick, title, children, active }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
        active ? 'bg-accent text-white' : 'text-ink-500 hover:bg-ink-100'
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, fields = [], onChange, placeholder = 'כתבו כאן את גוף המכתב…' }) {
  const ref = useRef(null);
  const savedRange = useRef(null);
  const initialized = useRef(false);
  const [fieldMenu, setFieldMenu] = useState(false);

  // Initialize once from value.
  useEffect(() => {
    if (ref.current && !initialized.current) {
      ref.current.innerHTML = hydrate(value || '', fields);
      initialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep token labels in sync when a field is renamed (without re-rendering the whole body).
  useEffect(() => {
    if (!ref.current || !initialized.current) return;
    ref.current.querySelectorAll('span.fld-token').forEach((s) => {
      const f = fields.find((ff) => ff.key === s.getAttribute('data-key'));
      if (f && s.textContent !== f.label) s.textContent = f.label;
    });
  }, [fields]);

  const emit = () => onChange(serialize(ref.current));

  const saveSel = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current && ref.current.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSel = () => {
    ref.current.focus();
    if (savedRange.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (cmd, val) => {
    restoreSel();
    document.execCommand(cmd, false, val);
    saveSel();
    emit();
  };

  const insertField = (f) => {
    restoreSel();
    document.execCommand('insertHTML', false, tokenSpan(f.key, f.label) + '&nbsp;');
    saveSel();
    emit();
    setFieldMenu(false);
  };

  return (
    <div className="rounded-xl border border-ink-200 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-ink-100 bg-ink-50/60 p-1.5">
        <ToolBtn title="מודגש" onClick={() => exec('bold')}><Bold className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="נטוי" onClick={() => exec('italic')}><Italic className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="קו תחתון" onClick={() => exec('underline')}><Underline className="h-4 w-4" /></ToolBtn>
        <div className="w-px h-5 bg-ink-200 mx-1" />
        <ToolBtn title="כותרת" onClick={() => exec('formatBlock', '<h3>')}><Heading className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="רשימה" onClick={() => exec('insertUnorderedList')}><List className="h-4 w-4" /></ToolBtn>
        <div className="w-px h-5 bg-ink-200 mx-1" />
        <ToolBtn title="יישור לימין" onClick={() => exec('justifyRight')}><AlignRight className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="מרכוז" onClick={() => exec('justifyCenter')}><AlignCenter className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="יישור לשמאל" onClick={() => exec('justifyLeft')}><AlignLeft className="h-4 w-4" /></ToolBtn>
        <div className="w-px h-5 bg-ink-200 mx-1" />
        <select
          title="גודל טקסט"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => { exec('fontSize', e.target.value); e.target.selectedIndex = 0; }}
          className="h-8 rounded-lg border border-ink-200 bg-white text-xs text-ink-600 px-1.5"
          defaultValue=""
        >
          <option value="" disabled>גודל</option>
          <option value="2">קטן</option>
          <option value="3">רגיל</option>
          <option value="5">גדול</option>
          <option value="6">ענק</option>
        </select>

        {/* Insert field */}
        <div className="relative mr-auto">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setFieldMenu((o) => !o)}
            className="h-8 inline-flex items-center gap-1 rounded-lg bg-accent-50 text-accent-700 px-2.5 text-xs font-semibold hover:bg-accent-100 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            הוספת שדה
            <ChevronDown className="h-3 w-3" />
          </button>
          {fieldMenu && (
            <div className="absolute left-0 top-full mt-1 w-52 max-h-60 overflow-y-auto card shadow-card z-30 p-1">
              {fields.length === 0 ? (
                <div className="px-3 py-2 text-xs text-ink-400">הגדירו שדות תחילה ←</div>
              ) : (
                fields.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertField(f)}
                    className="w-full text-right px-3 py-2 rounded-lg text-sm text-ink hover:bg-ink-50 flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{f.label}</span>
                    <span className="text-[10px] text-ink-400 shrink-0">
                      {f.type === 'date' ? 'תאריך' : f.type === 'select' ? 'בחירה' : 'טקסט'}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div
        ref={ref}
        className="rte px-4 py-3 text-sm text-ink"
        contentEditable
        dir="rtl"
        data-placeholder={placeholder}
        onInput={emit}
        onKeyUp={saveSel}
        onMouseUp={saveSel}
        onBlur={saveSel}
        suppressContentEditableWarning
      />
    </div>
  );
}
