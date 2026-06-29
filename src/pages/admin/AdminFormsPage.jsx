import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FileText, Plus, Pencil, Trash2, Eye, EyeOff, X, GripVertical,
  Settings2, ImagePlus, Loader2, Search, Palette, ClipboardList,
} from 'lucide-react';

const THEMES = [
  { id: 'official', label: 'רשמי' },
  { id: 'modern',   label: 'מודרני' },
  { id: 'classic',  label: 'קלאסי' },
];

const COLORS = [
  { id: 'olive',    label: 'זית',   hex: '#6B7D5F' },
  { id: 'blue',     label: 'כחול',  hex: '#1E40AF' },
  { id: 'bordeaux', label: 'בורדו', hex: '#881337' },
  { id: 'charcoal', label: 'פחם',   hex: '#374151' },
  { id: 'forest',   label: 'יער',   hex: '#14532D' },
];
import adminApi from '../../api/adminClient';
import FormDocument from '../../components/forms/FormDocument.jsx';
import RichTextEditor from '../../components/common/RichTextEditor.jsx';

const TYPE_LABELS = { text: 'טקסט קצר', date: 'תאריך', select: 'בחירה מרשימה' };

export default function AdminFormsPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [orgs, setOrgs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [viewingSubmissions, setViewingSubmissions] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (q) params.set('q', q);
      const { data } = await adminApi.get(`/forms?${params}`);
      setForms(data.forms);
    } catch {
      toast.error('שגיאה בטעינת הטפסים');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);
  useEffect(() => {
    adminApi.get('/organizations?limit=100').then(({ data }) => setOrgs(data.organizations)).catch(() => {});
  }, []);

  const togglePublish = async (f) => {
    try {
      const { data } = await adminApi.post(`/forms/${f._id}/toggle-publish`);
      setForms((list) => list.map((x) => (x._id === f._id ? { ...x, isPublished: data.form.isPublished } : x)));
    } catch {
      toast.error('שגיאה');
    }
  };

  const remove = async (f) => {
    if (!confirm(`למחוק את הטופס "${f.title}"?`)) return;
    try {
      await adminApi.delete(`/forms/${f._id}`);
      setForms((list) => list.filter((x) => x._id !== f._id));
      toast.success('הטופס נמחק');
    } catch {
      toast.error('שגיאה במחיקה');
    }
  };

  const openEdit = async (f) => {
    try {
      const { data } = await adminApi.get(`/forms/${f._id}`);
      setEditing(data.form);
    } catch {
      toast.error('שגיאה בטעינה');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">טפסים</h1>
          <p className="text-sm text-ink-500 mt-1">צרו תבניות מכתבים שחברי הקהילה ימלאו ויורידו כ-PDF.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          טופס חדש
        </button>
      </header>

      <div className="card p-3">
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pr-10 !py-2" placeholder="חיפוש טופס…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-ink-400">טוען…</div>
      ) : forms.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">אין טפסים. צרו טופס חדש להתחלה.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((f) => (
            <div key={f._id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="h-10 w-10 rounded-xl bg-accent-50 text-accent-700 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${f.isPublished ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
                  {f.isPublished ? 'מפורסם' : 'טיוטה'}
                </span>
              </div>
              <h3 className="font-bold text-ink mt-3 leading-snug line-clamp-2">{f.title}</h3>
              {f.description && <p className="text-sm text-ink-500 mt-1 line-clamp-2">{f.description}</p>}
              <div className="flex items-center gap-2 mt-2 text-xs text-ink-400 flex-wrap">
                {f.organization?.name && <span className="chip text-[10px]">{f.organization.name}</span>}
                <span>{f.fields?.length || 0} שדות</span>
              </div>
              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-ink-100">
                <button onClick={() => openEdit(f)} className="flex-1 btn-outline !py-1.5 text-xs">
                  <Pencil className="h-3.5 w-3.5" /> עריכה
                </button>
                <button onClick={() => setViewingSubmissions(f)} title="הגשות" className="h-8 w-8 rounded-lg bg-ink-50 hover:bg-ink-100 flex items-center justify-center text-ink-600">
                  <ClipboardList className="h-4 w-4" />
                </button>
                <button onClick={() => togglePublish(f)} title={f.isPublished ? 'הסתרה' : 'פרסום'} className="h-8 w-8 rounded-lg bg-ink-50 hover:bg-ink-100 flex items-center justify-center text-ink-500">
                  {f.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={() => remove(f)} title="מחיקה" className="h-8 w-8 rounded-lg bg-accent-50 hover:bg-accent-100 flex items-center justify-center text-accent-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(creating || editing) && (
          <FormEditorModal
            initial={editing}
            orgs={orgs}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSaved={() => { setCreating(false); setEditing(null); load(); }}
          />
        )}
        {viewingSubmissions && (
          <SubmissionsModal
            form={viewingSubmissions}
            onClose={() => setViewingSubmissions(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SubmissionsModal({ form, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get(`/forms/${form._id}/submissions`)
      .then(({ data: d }) => setData(d))
      .catch(() => toast.error('שגיאה בטעינת ההגשות'))
      .finally(() => setLoading(false));
  }, [form._id]);

  const fields = data?.form?.fields || form.fields || [];
  const submissions = data?.submissions || [];

  const fmt = (iso) => new Date(iso).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-ink/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="card w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-ink flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-accent" />
              הגשות — {form.title}
            </h3>
            {!loading && <p className="text-xs text-ink-400 mt-0.5">{submissions.length} הגשות</p>}
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-center py-10 text-ink-400">טוען…</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-10 text-ink-400">אין הגשות עדיין.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-ink-50 text-ink-600 text-xs">
                    <th className="px-3 py-2 font-semibold border-b border-ink-200 whitespace-nowrap">תאריך</th>
                    <th className="px-3 py-2 font-semibold border-b border-ink-200 whitespace-nowrap">שם</th>
                    <th className="px-3 py-2 font-semibold border-b border-ink-200 whitespace-nowrap">מייל</th>
                    {fields.map((f) => (
                      <th key={f.key} className="px-3 py-2 font-semibold border-b border-ink-200 whitespace-nowrap">{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s._id} className="border-b border-ink-100 hover:bg-ink-50/50">
                      <td className="px-3 py-2 text-ink-500 whitespace-nowrap text-xs">{fmt(s.createdAt)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() : '—'}
                      </td>
                      <td className="px-3 py-2 text-ink-500 whitespace-nowrap text-xs">{s.user?.email || '—'}</td>
                      {fields.map((f) => (
                        <td key={f.key} className="px-3 py-2 max-w-[200px] truncate" title={s.values?.[f.key] || ''}>
                          {s.values?.[f.key] || <span className="text-ink-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function FieldRow({ field, onChange, onRemove }) {
  const set = (k, v) => onChange({ ...field, [k]: v });
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-3 space-y-2">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-ink-300 shrink-0" />
        <input
          className="input !py-1.5 flex-1"
          placeholder="תווית השדה (למשל: שם מלא)"
          value={field.label}
          onChange={(e) => set('label', e.target.value)}
        />
        <button type="button" onClick={onRemove} className="h-8 w-8 rounded-lg bg-accent-50 text-accent-700 hover:bg-accent-100 flex items-center justify-center shrink-0">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 flex-wrap pr-6">
        <select className="input !py-1.5 !w-auto text-sm" value={field.type} onChange={(e) => set('type', e.target.value)}>
          <option value="text">טקסט קצר</option>
          <option value="date">תאריך</option>
          <option value="select">בחירה מרשימה</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-ink-600 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 accent-accent" checked={!!field.required} onChange={(e) => set('required', e.target.checked)} />
          חובה
        </label>
      </div>
      {field.type === 'select' && (
        <div className="pr-6">
          <input
            className="input !py-1.5 text-sm"
            placeholder="אפשרויות מופרדות בפסיק: אופציה 1, אופציה 2"
            value={(field.options || []).join(', ')}
            onChange={(e) => set('options', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          />
        </div>
      )}
    </div>
  );
}

function FormEditorModal({ initial, orgs, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    bodyHtml: initial?.bodyHtml || '',
    fields: initial?.fields || [],
    fieldSeq: initial?.fieldSeq || (initial?.fields?.length || 0),
    requireUserSignature: initial?.requireUserSignature || false,
    signatureLabel: initial?.signatureLabel || 'חתימת הממלא/ת',
    adminSignatureUrl: initial?.adminSignatureUrl || '',
    adminSignatureLabel: initial?.adminSignatureLabel || '',
    isPublished: initial?.isPublished || false,
    organization: initial?.organization?._id || initial?.organization || (orgs[0]?._id || ''),
    theme: initial?.theme || 'official',
    colorKey: initial?.colorKey || 'olive',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addField = () => {
    const seq = form.fieldSeq + 1;
    set('fieldSeq', seq);
    set('fields', [...form.fields, { key: `field_${seq}`, label: '', type: 'text', required: false, options: [] }]);
  };
  const updateField = (i, next) => set('fields', form.fields.map((f, idx) => (idx === i ? next : f)));
  const removeField = (i) => set('fields', form.fields.filter((_, idx) => idx !== i));

  const handleSig = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('יש להעלות קובץ תמונה'); return; }
    setUploadingSig(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await adminApi.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('adminSignatureUrl', data.url);
    } catch {
      toast.error('שגיאה בהעלאת החתימה');
    } finally {
      setUploadingSig(false);
      e.target.value = '';
    }
  };

  const submit = async (publish) => {
    if (!form.title.trim()) { toast.error('יש להזין כותרת'); return; }
    if (!form.organization) { toast.error('יש לבחור ארגון'); return; }
    if (form.fields.some((f) => !f.label.trim())) { toast.error('לכל שדה חובה תווית'); return; }
    setLoading(true);
    try {
      const payload = { ...form, isPublished: publish !== undefined ? publish : form.isPublished };
      if (initial?._id) await adminApi.patch(`/forms/${initial._id}`, payload);
      else await adminApi.post('/forms', payload);
      toast.success(initial?._id ? 'הטופס עודכן' : 'הטופס נוצר');
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשמירה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-ink/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="card w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center justify-between z-10 shrink-0">
          <h3 className="font-bold text-ink">{initial?._id ? 'עריכת טופס' : 'טופס חדש'}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2">
          {/* Editor panel */}
          <div className="p-5 space-y-5 lg:border-l border-ink-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">כותרת הטופס</label>
                <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} />
              </div>
              <div>
                <label className="label">ארגון</label>
                <select className="input" value={form.organization} onChange={(e) => set('organization', e.target.value)}>
                  <option value="">בחרו ארגון</option>
                  {orgs.map((o) => <option key={o._id} value={o._id}>{o.name} ({o.code})</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">תיאור קצר (יוצג ברשימה)</label>
              <input className="input" value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>

            {/* Fields */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label !mb-0">שדות למילוי</label>
                <button type="button" onClick={addField} className="btn-outline !py-1 !px-2.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> שדה
                </button>
              </div>
              <p className="text-xs text-ink-400 mb-2">הוסיפו שדות ואז שבצו אותם בגוף המכתב דרך כפתור "הוספת שדה" בעורך.</p>
              <div className="space-y-2">
                {form.fields.length === 0 && <p className="text-sm text-ink-400 bg-ink-50 rounded-lg p-3">אין שדות עדיין.</p>}
                {form.fields.map((f, i) => (
                  <FieldRow key={f.key} field={f} onChange={(next) => updateField(i, next)} onRemove={() => removeField(i)} />
                ))}
              </div>
            </div>

            {/* Body editor */}
            <div>
              <label className="label">גוף המכתב</label>
              <RichTextEditor value={form.bodyHtml} fields={form.fields} onChange={(html) => set('bodyHtml', html)} />
            </div>

            {/* Document design */}
            <div className="rounded-xl border border-ink-200 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-ink">
                <Palette className="h-4 w-4 text-accent" /> עיצוב המסמך
              </div>
              <div>
                <label className="label text-xs !mb-1.5">סגנון</label>
                <div className="flex gap-2 flex-wrap">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set('theme', t.id)}
                      className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition ${
                        form.theme === t.id
                          ? 'border-accent bg-accent text-white'
                          : 'border-ink-200 text-ink-600 hover:border-ink-400 bg-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label text-xs !mb-1.5">ערכת צבעים</label>
                <div className="flex gap-2.5 flex-wrap items-center">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      title={c.label}
                      onClick={() => set('colorKey', c.id)}
                      style={{ background: c.hex }}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        form.colorKey === c.id
                          ? 'border-ink scale-125 shadow-md'
                          : 'border-transparent hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Signature settings */}
            <div className="rounded-xl border border-ink-200 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-ink">
                <Settings2 className="h-4 w-4 text-accent" /> הגדרות חתימה
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 accent-accent" checked={form.requireUserSignature} onChange={(e) => set('requireUserSignature', e.target.checked)} />
                <span className="text-sm text-ink-700">דרוש חתימה מהממלא/ת</span>
              </label>
              {form.requireUserSignature && (
                <input className="input !py-1.5 text-sm" placeholder="תווית מתחת לחתימה" value={form.signatureLabel} onChange={(e) => set('signatureLabel', e.target.value)} />
              )}
              <div className="border-t border-ink-100 pt-3">
                <label className="label text-xs">חתימת/חותמת הנהלה קבועה (אופציונלי)</label>
                <div className="flex items-center gap-3">
                  <label className={`btn-outline !py-1.5 text-xs cursor-pointer ${uploadingSig ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploadingSig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                    העלאת תמונה
                    <input type="file" accept="image/*" className="hidden" onChange={handleSig} />
                  </label>
                  {form.adminSignatureUrl && (
                    <div className="flex items-center gap-2">
                      <img src={form.adminSignatureUrl} alt="חתימה" className="h-10 border border-ink-200 rounded bg-white" />
                      <button type="button" onClick={() => set('adminSignatureUrl', '')} className="text-xs text-accent hover:underline">הסרה</button>
                    </div>
                  )}
                </div>
                {form.adminSignatureUrl && (
                  <input className="input !py-1.5 text-sm mt-2" placeholder="שם/תפקיד מתחת לחתימת ההנהלה" value={form.adminSignatureLabel} onChange={(e) => set('adminSignatureLabel', e.target.value)} />
                )}
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-ink-50/50 p-4 sm:p-5">
            <div className="text-xs font-semibold text-ink-400 mb-2 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> תצוגה מקדימה
            </div>
            <div className="rounded-xl overflow-hidden shadow-card bg-white">
              <FormDocument form={form} values={{}} mode="template" />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-ink-100 px-5 py-3 flex items-center justify-end gap-2 shrink-0">
          <button onClick={() => submit(false)} disabled={loading} className="btn-outline">
            שמירת טיוטה
          </button>
          <button onClick={() => submit(true)} disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            שמירה ופרסום
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
