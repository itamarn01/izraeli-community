import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FileText, X, Download, Eye, Loader2 } from 'lucide-react';
import api from '../api/client';
import { SkeletonGrid } from '../components/skeletons/Skeletons.jsx';
import { formatDate } from '../utils/format.js';
import { missingRequired } from '../utils/formRender.js';
import FormDocument from '../components/forms/FormDocument.jsx';
import SignaturePad from '../components/common/SignaturePad.jsx';

export default function FormsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('form');
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/forms')
      .then(({ data }) => setForms(data.forms))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!highlightId || loading) return;
    api.get(`/forms/${highlightId}`)
      .then(({ data }) => { setSelected(data.form); setSearchParams({}, { replace: true }); })
      .catch(() => {});
  }, [highlightId, loading]);

  const openForm = async (f) => {
    try {
      const { data } = await api.get(`/forms/${f._id}`);
      setSelected(data.form);
    } catch {
      toast.error('שגיאה בטעינת הטופס');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">טפסים</h1>
        <p className="text-sm text-ink-500 mt-1">בחרו טופס, מלאו את הפרטים, צפו בתצוגה מקדימה והורידו כ-PDF.</p>
      </header>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : forms.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">אין טפסים זמינים כרגע.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((f, i) => (
            <motion.button
              key={f._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 5) * 0.04 }}
              onClick={() => openForm(f)}
              className="card p-5 text-right hover:shadow-soft transition group"
            >
              <div className="h-11 w-11 rounded-xl bg-accent-50 text-accent-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <FileText className="h-5.5 w-5.5" />
              </div>
              <h3 className="font-bold text-ink leading-snug line-clamp-2">{f.title}</h3>
              {f.description && <p className="mt-1.5 text-sm text-ink-500 line-clamp-2">{f.description}</p>}
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                <Eye className="h-3.5 w-3.5" />
                מילוי וצפייה
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && <FormFillModal form={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  if (field.type === 'select') {
    return (
      <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{field.placeholder || 'בחרו…'}</option>
        {(field.options || []).map((o, i) => <option key={i} value={o}>{o}</option>)}
      </select>
    );
  }
  if (field.type === 'date') {
    return <input type="date" className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
  }
  return <input className="input" placeholder={field.placeholder || ''} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
}

function FormFillModal({ form, onClose }) {
  const [values, setValues] = useState({});
  const [userSignature, setUserSignature] = useState('');
  const [generating, setGenerating] = useState(false);
  const pdfRef = useRef(null);

  const set = (key, v) => setValues((s) => ({ ...s, [key]: v }));

  const downloadPdf = async () => {
    const missing = missingRequired(form.fields, values);
    if (missing.length) {
      toast.error(`יש למלא: ${missing.join(', ')}`);
      return;
    }
    if (form.requireUserSignature && !userSignature) {
      toast.error('יש להוסיף חתימה');
      return;
    }
    setGenerating(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${form.title || 'טופס'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(pdfRef.current)
        .save();
      toast.success('ה-PDF הורד');
      api.post(`/forms/${form._id}/submit`, { values }).catch(() => {});
    } catch (err) {
      toast.error('שגיאה ביצירת ה-PDF');
    } finally {
      setGenerating(false);
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
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="card w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 text-accent shrink-0" />
            <h3 className="font-bold text-ink truncate">{form.title}</h3>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2">
          {/* Fill panel */}
          <div className="p-5 space-y-4 lg:border-l border-ink-100">
            {form.description && <p className="text-sm text-ink-500">{form.description}</p>}

            {form.fields?.length === 0 && (
              <p className="text-sm text-ink-400">לטופס זה אין שדות למילוי — ניתן להוריד ישירות.</p>
            )}

            {form.fields?.map((f) => (
              <div key={f.key}>
                <label className="label">
                  {f.label}
                  {f.required && <span className="text-accent"> *</span>}
                </label>
                <FieldInput field={f} value={values[f.key]} onChange={(v) => set(f.key, v)} />
              </div>
            ))}

            {form.requireUserSignature && (
              <div>
                <label className="label">{form.signatureLabel || 'חתימה'} <span className="text-accent">*</span></label>
                <SignaturePad onChange={setUserSignature} />
              </div>
            )}

            <button onClick={downloadPdf} disabled={generating} className="btn-primary w-full disabled:opacity-60">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {generating ? 'מייצר PDF…' : 'הורדת PDF'}
            </button>
          </div>

          {/* Preview panel */}
          <div className="bg-ink-50/50 p-4 sm:p-5">
            <div className="text-xs font-semibold text-ink-400 mb-2 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              תצוגה מקדימה
            </div>
            <div className="rounded-xl overflow-hidden shadow-card bg-white">
              <FormDocument form={form} values={values} userSignature={userSignature} mode="fill" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Off-screen full-width node for clean A4 PDF capture */}
      <div style={{ position: 'fixed', left: -10000, top: 0, width: 794, pointerEvents: 'none' }} aria-hidden>
        <FormDocument innerRef={pdfRef} form={form} values={values} userSignature={userSignature} mode="fill" />
      </div>
    </motion.div>
  );
}
