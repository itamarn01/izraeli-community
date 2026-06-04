import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Phone, MapPin, Calendar, Heart, Briefcase, Baby, FileText, Upload,
  ShieldCheck, Pencil, Check, X, Plus, Trash2, AlertCircle, GraduationCap, Users, Camera,
  Lock, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client';
import {
  GENDER_LABELS, MARITAL_LABELS, EMPLOYMENT_LABELS, STUDENT_LEVEL_LABELS, formatDate,
} from '../utils/format.js';

const AVATAR_COLORS = ['#E74C3C','#9B59B6','#2980B9','#27AE60','#E67E22','#1ABC9C','#E91E63','#607D8B'];
function getUserColor(id) {
  let hash = 0;
  const str = String(id || '');
  for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); hash |= 0; }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const GENDERS = [
  { v: 'male', label: 'זכר' }, { v: 'female', label: 'נקבה' }, { v: 'other', label: 'אחר' },
];
const MARITAL = [
  { v: 'single', label: 'רווק/ה' }, { v: 'married', label: 'נשוי/אה' },
  { v: 'common_law', label: 'ידוע/ה בציבור' }, { v: 'in_relationship', label: 'בזוגיות' },
  { v: 'divorced', label: 'גרוש/ה' }, { v: 'other', label: 'אחר' },
];
const EMPLOYMENT = [
  { v: 'employee', label: 'שכיר/ה' }, { v: 'self_employed', label: 'עצמאי/ת' },
  { v: 'combined', label: 'משולב' }, { v: 'not_working', label: 'לא עובד/ת' },
  { v: 'student', label: 'סטודנט/ית' },
];
const STUDENT_LEVELS = [
  { v: 'bachelors', label: 'תואר ראשון' },
  { v: 'masters', label: 'תואר שני' },
  { v: 'doctorate', label: 'דוקטורט' },
  { v: 'other', label: 'אחר' },
];
const GEDUDIM = [
  'משמר העמקים', 'אבישי', 'הכרמל', 'אבשלום', 'חרב שאול', 'מטה',
];

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-1.5 text-sm font-medium transition ${
        active ? 'border-accent bg-accent-50 text-accent-700' : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300'
      }`}
    >
      {children}
    </button>
  );
}

export default function ProfilePage() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Email change flow
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailStep, setEmailStep] = useState(1);
  const [emailLoading, setEmailLoading] = useState(false);
  const otpRefs = useRef([]);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  const p = user?.profile || {};
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');

  const makeForm = (pf = p) => ({
    firstName: pf.firstName || '',
    lastName: pf.lastName || '',
    phone: pf.phone || '',
    address: {
      city: pf.address?.city || '',
      street: pf.address?.street || '',
      houseNumber: pf.address?.houseNumber || '',
      apartment: pf.address?.apartment || '',
    },
    dateOfBirth: pf.dateOfBirth ? new Date(pf.dateOfBirth).toISOString().slice(0, 10) : '',
    gender: pf.gender || '',
    maritalStatus: pf.maritalStatus || '',
    gedud: pf.gedud || '',
    employmentStatus: pf.employmentStatus || '',
    studentLevel: pf.studentLevel || '',
    selfEmployedBusiness: pf.selfEmployedBusiness || '',
    children: pf.children?.map((c) => ({
      name: c.name,
      dateOfBirth: c.dateOfBirth ? new Date(c.dateOfBirth).toISOString().slice(0, 10) : '',
    })) || [],
  });

  const [form, setForm] = useState(() => makeForm());

  const cancelEdit = () => { setForm(makeForm(user?.profile || {})); setEditing(false); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        studentLevel: form.employmentStatus === 'student' ? form.studentLevel || undefined : null,
        selfEmployedBusiness: (form.employmentStatus === 'self_employed' || form.employmentStatus === 'combined') ? form.selfEmployedBusiness : '',
      };
      await api.patch('/users/me/profile', payload);
      await refresh();
      toast.success('הפרופיל עודכן');
      setEditing(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const onUploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('קובץ גדול מדי — עד 5MB'); return; }
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refresh();
      toast.success('תמונת הפרופיל עודכנה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בהעלאה');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const onUploadCV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('קובץ גדול מדי — עד 5MB'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('cv', file);
      await api.post('/users/me/cv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refresh();
      toast.success('קורות החיים עודכנו');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בהעלאה');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const requestEmailChange = async () => {
    setEmailLoading(true);
    try {
      await api.post('/users/me/change-email', { newEmail });
      setEmailStep(2);
      toast.success(`נשלח קוד אל ${newEmail}`);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    } finally {
      setEmailLoading(false);
    }
  };

  const setOtpDigit = (idx, val) => {
    const v = val.replace(/\D/g, '').slice(0, 1);
    const next = [...otpDigits];
    next[idx] = v;
    setOtpDigits(next);
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const onOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const verifyEmailChange = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== 6) { toast.error('קוד לא שלם'); return; }
    setEmailLoading(true);
    try {
      await api.post('/users/me/verify-email', { otp });
      await refresh();
      toast.success('כתובת המייל עודכנה');
      setShowEmailModal(false);
      setNewEmail('');
      setOtpDigits(['', '', '', '', '', '']);
      setEmailStep(1);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'קוד שגוי');
    } finally {
      setEmailLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error('הסיסמאות אינן תואמות'); return; }
    if (pwForm.next.length < 8) { toast.error('הסיסמה החדשה חייבת להכיל לפחות 8 תווים'); return; }
    setPwLoading(true);
    try {
      await api.post('/users/me/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      toast.success('הסיסמה עודכנה בהצלחה');
      setShowPasswordModal(false);
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'מחיקה') { toast.error('יש להקליד "מחיקה" לאישור'); return; }
    setDeleteLoading(true);
    try {
      await api.delete('/users/me');
      toast.success('החשבון נמחק');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה במחיקה');
      setDeleteLoading(false);
    }
  };

  if (!user) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setAddr = (k, v) => setForm((f) => ({ ...f, address: { ...f.address, [k]: v } }));
  const addChild = () => set('children', [...form.children, { name: '', dateOfBirth: '' }]);
  const updateChild = (i, k, v) => set('children', form.children.map((c, idx) => idx === i ? { ...c, [k]: v } : c));
  const removeChild = (i) => set('children', form.children.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">הפרופיל שלי</h1>
          <p className="text-sm text-ink-400 mt-1">פרטי חשבון ושאלון אישי</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-outline">
            <Pencil className="h-4 w-4" />
            עריכה
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={cancelEdit} className="btn-outline" disabled={saving}>
              <X className="h-4 w-4" />
              ביטול
            </button>
            <button onClick={save} className="btn-primary" disabled={saving}>
              <Check className="h-4 w-4" />
              {saving ? 'שומר…' : 'שמירה'}
            </button>
          </div>
        )}
      </header>

      {/* Avatar + email */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <label
            className="relative h-20 w-20 rounded-full shrink-0 cursor-pointer group"
            title="לחצו להעלאת תמונת פרופיל"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="תמונת פרופיל" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div
                className="h-20 w-20 rounded-full text-white flex items-center justify-center text-3xl font-bold"
                style={{ backgroundColor: getUserColor(user._id) }}
              >
                {(p.firstName?.[0] || user.email[0]).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-ink/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              {avatarUploading ? (
                <span className="text-white text-xs">מעלה…</span>
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onUploadAvatar}
              disabled={avatarUploading}
            />
          </label>
          <div className="flex-1">
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input text-lg font-bold"
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  placeholder="שם פרטי"
                />
                <input
                  className="input text-lg font-bold"
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  placeholder="שם משפחה"
                />
              </div>
            ) : (
              <h2 className="text-xl font-bold text-ink">{fullName || user.email}</h2>
            )}
            <div className="flex items-center gap-2 mt-2 text-sm text-ink-400 flex-wrap">
              <Mail className="h-3.5 w-3.5" />
              <span dir="ltr">{user.email}</span>
              {user.isEmailVerified && (
                <span className="chip-accent">
                  <ShieldCheck className="h-3 w-3" />
                  מאומת
                </span>
              )}
              <button
                onClick={() => setShowEmailModal(true)}
                className="text-xs text-accent hover:underline font-semibold"
              >
                שינוי מייל
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Personal details */}
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-ink border-b border-ink-100 pb-2">פרטים אישיים</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {editing ? (
            <>
              <EditField label="טלפון" icon={Phone}>
                <input dir="ltr" className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="050-0000000" />
              </EditField>
              <EditField label="תאריך לידה" icon={Calendar}>
                <input type="date" className="input" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
              </EditField>
              <EditField label="עיר" icon={MapPin}>
                <input className="input" value={form.address.city} onChange={(e) => setAddr('city', e.target.value)} />
              </EditField>
              <EditField label="רחוב" icon={MapPin}>
                <input className="input" value={form.address.street} onChange={(e) => setAddr('street', e.target.value)} />
              </EditField>
              <EditField label="מספר בית" icon={MapPin}>
                <input className="input" value={form.address.houseNumber} onChange={(e) => setAddr('houseNumber', e.target.value)} placeholder="לא חובה" />
              </EditField>
              <EditField label="דירה" icon={MapPin}>
                <input className="input" value={form.address.apartment} onChange={(e) => setAddr('apartment', e.target.value)} placeholder="לא חובה" />
              </EditField>
            </>
          ) : (
            <>
              <Field icon={Phone} label="טלפון" value={p.phone} />
              <Field icon={Calendar} label="תאריך לידה" value={formatDate(p.dateOfBirth)} />
              <Field icon={MapPin} label="כתובת" value={
                p.address?.city && p.address?.street
                  ? [p.address.street, p.address.houseNumber, p.address.apartment ? `דירה ${p.address.apartment}` : null, p.address.city].filter(Boolean).join(' ')
                  : ''
              } />
              <Field icon={ShieldCheck} label="מגדר" value={GENDER_LABELS[p.gender]} />
              <Field icon={Users} label="גדוד" value={p.gedud} />
            </>
          )}
        </div>

        {editing && (
          <>
            <div>
              <label className="label">מגדר</label>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((o) => <Pill key={o.v} active={form.gender === o.v} onClick={() => set('gender', o.v)}>{o.label}</Pill>)}
              </div>
            </div>
            <div>
              <label className="label">מצב משפחתי</label>
              <div className="flex flex-wrap gap-2">
                {MARITAL.map((o) => <Pill key={o.v} active={form.maritalStatus === o.v} onClick={() => set('maritalStatus', o.v)}>{o.label}</Pill>)}
              </div>
            </div>
            <div>
              <label className="label">גדוד</label>
              <div className="flex flex-wrap gap-2">
                {GEDUDIM.map((g) => <Pill key={g} active={form.gedud === g} onClick={() => set('gedud', g)}>{g}</Pill>)}
              </div>
            </div>
            <div>
              <label className="label">תעסוקה</label>
              <div className="flex flex-wrap gap-2">
                {EMPLOYMENT.map((o) => <Pill key={o.v} active={form.employmentStatus === o.v} onClick={() => set('employmentStatus', o.v)}>{o.label}</Pill>)}
              </div>
            </div>
            <AnimatePresence>
              {(form.employmentStatus === 'self_employed' || form.employmentStatus === 'combined') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1">
                    <label className="label">שם העסק / תחום עיסוק</label>
                    <input
                      className="input"
                      placeholder="לדוגמה: עורך דין עצמאי, קפה הכהן..."
                      value={form.selfEmployedBusiness}
                      onChange={(e) => set('selfEmployedBusiness', e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
              {form.employmentStatus === 'student' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4 text-muted-700" />
                    <label className="label !mb-0">רמת לימודים</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STUDENT_LEVELS.map((o) => <Pill key={o.v} active={form.studentLevel === o.v} onClick={() => set('studentLevel', o.v)}>{o.label}</Pill>)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {!editing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field icon={Heart} label="מצב משפחתי" value={MARITAL_LABELS[p.maritalStatus]} />
            <Field icon={Briefcase} label="תעסוקה" value={
              p.employmentStatus === 'student' && p.studentLevel
                ? `${EMPLOYMENT_LABELS[p.employmentStatus]} — ${STUDENT_LEVEL_LABELS[p.studentLevel]}`
                : (p.employmentStatus === 'self_employed' || p.employmentStatus === 'combined') && p.selfEmployedBusiness
                  ? `${EMPLOYMENT_LABELS[p.employmentStatus]} — ${p.selfEmployedBusiness}`
                  : EMPLOYMENT_LABELS[p.employmentStatus]
            } />
          </div>
        )}
      </div>

      {/* Children */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ink flex items-center gap-2">
            <Baby className="h-4 w-4 text-muted-700" />
            ילדים
          </h3>
          {editing && (
            <button type="button" onClick={addChild} className="btn-outline !py-1.5 !px-3 text-xs">
              <Plus className="h-3.5 w-3.5" />
              הוספת ילד/ה
            </button>
          )}
        </div>

        {editing ? (
          <>
            {form.children.length === 0 && (
              <p className="text-sm text-ink-400 bg-ink-50 rounded-lg p-3">לא נוספו ילדים.</p>
            )}
            <AnimatePresence>
              {form.children.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-12 gap-2 items-end mb-2 rounded-xl border border-ink-100 bg-canvas p-3">
                    <div className="col-span-6">
                      <label className="label text-xs">שם</label>
                      <input className="input !py-2" value={c.name} onChange={(e) => updateChild(i, 'name', e.target.value)} />
                    </div>
                    <div className="col-span-5">
                      <label className="label text-xs">תאריך לידה</label>
                      <input type="date" className="input !py-2" value={c.dateOfBirth} onChange={(e) => updateChild(i, 'dateOfBirth', e.target.value)} />
                    </div>
                    <div className="col-span-1">
                      <button type="button" onClick={() => removeChild(i)} className="h-10 w-10 rounded-lg bg-accent-50 text-accent-700 hover:bg-accent-100 flex items-center justify-center">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        ) : (
          p.children?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {p.children.map((c) => (
                <div key={c._id || c.name} className="rounded-xl bg-canvas border border-ink-100 p-4">
                  <div className="font-semibold text-ink">{c.name}</div>
                  <div className="text-xs text-ink-400 mt-1">{formatDate(c.dateOfBirth)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400">לא הוזנו ילדים.</p>
          )
        )}
      </div>

      {/* CV */}
      <div className="card p-6">
        <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          קורות חיים (עד 5MB)
        </h3>
        {user.cvUrl ? (
          <div className="flex items-center gap-3 rounded-xl bg-olive-50 border border-olive-100 p-3">
            <FileText className="h-5 w-5 text-olive-700" />
            <a href={user.cvUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-olive-700 hover:underline flex-1">
              צפייה בקורות החיים
            </a>
            <label className="btn-outline !py-1.5 !px-3 text-xs cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              החלפה
              <input type="file" accept="application/pdf" className="hidden" onChange={onUploadCV} disabled={uploading} />
            </label>
          </div>
        ) : (
          <label className="flex items-center gap-3 rounded-xl border border-dashed border-ink-200 p-4 cursor-pointer hover:bg-ink-50">
            <Upload className="h-5 w-5 text-ink-400" />
            <span className="text-sm text-ink-500 flex-1">
              {uploading ? 'מעלה…' : 'העלאת קובץ PDF'}
            </span>
            <input type="file" accept="application/pdf" className="hidden" onChange={onUploadCV} disabled={uploading} />
          </label>
        )}
      </div>

      {/* Password change */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ink flex items-center gap-2">
            <Lock className="h-4 w-4 text-accent" />
            שינוי סיסמה
          </h3>
          <button onClick={() => setShowPasswordModal(true)} className="btn-outline !py-1.5 !px-3 text-sm">
            שינוי סיסמה
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border border-red-200">
        <h3 className="font-bold text-red-700 flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4" />
          מחיקת חשבון
        </h3>
        <p className="text-sm text-ink-500 mb-3">מחיקת החשבון היא פעולה בלתי הפיכה. כל הפוסטים, המשרות וההגשות שלך יימחקו לצמיתות.</p>
        <button
          onClick={() => { setDeleteConfirm(''); setShowDeleteModal(true); }}
          className="btn-outline !border-red-300 !text-red-600 hover:!bg-red-50 !py-2"
        >
          <Trash2 className="h-4 w-4" />
          מחיקת חשבון
        </button>
      </div>

      {/* Password change modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              className="card w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-ink-100 flex items-center justify-between">
                <h3 className="font-bold text-ink">שינוי סיסמה</h3>
                <button onClick={() => setShowPasswordModal(false)} className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={changePassword} className="p-5 space-y-4">
                <div>
                  <label className="label">סיסמה נוכחית</label>
                  <input type="password" dir="ltr" className="input" value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label className="label">סיסמה חדשה</label>
                  <input type="password" dir="ltr" className="input" value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} />
                </div>
                <div>
                  <label className="label">אימות סיסמה חדשה</label>
                  <input type="password" dir="ltr" className="input" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={pwLoading}>
                  {pwLoading ? 'מעדכן…' : 'עדכון סיסמה'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete account modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              className="card w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-red-100 flex items-center justify-between bg-red-50 rounded-t-2xl">
                <h3 className="font-bold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  מחיקת חשבון
                </h3>
                <button onClick={() => setShowDeleteModal(false)} className="h-8 w-8 rounded-lg hover:bg-red-100 flex items-center justify-center text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-ink-600">פעולה זו תמחק לצמיתות את החשבון, הפוסטים, המשרות וכל הנתונים הקשורים אליך. <strong>לא ניתן לשחזר.</strong></p>
                <div>
                  <label className="label">להמשך, הקלד/י <strong className="text-red-600">מחיקה</strong></label>
                  <input
                    className="input !border-red-200 focus:!border-red-400 focus:!ring-red-100"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder='הקלד/י "מחיקה"'
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'מחיקה' || deleteLoading}
                  className="w-full rounded-xl bg-red-600 text-white font-semibold py-2.5 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {deleteLoading ? 'מוחק…' : 'מחיקת החשבון לצמיתות'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email change modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50"
            onClick={() => { setShowEmailModal(false); setEmailStep(1); setNewEmail(''); setOtpDigits(['','','','','','']); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="card w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-ink-100 flex items-center justify-between">
                <h3 className="font-bold text-ink">שינוי כתובת מייל</h3>
                <button onClick={() => { setShowEmailModal(false); setEmailStep(1); }} className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {emailStep === 1 ? (
                  <>
                    <div className="rounded-xl bg-accent-50 border border-accent-100 p-3 text-sm text-accent-800 flex gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      קוד אימות יישלח לכתובת החדשה.
                    </div>
                    <div>
                      <label className="label">כתובת מייל חדשה</label>
                      <input
                        type="email"
                        dir="ltr"
                        className="input"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <button onClick={requestEmailChange} className="btn-primary w-full" disabled={emailLoading || !newEmail}>
                      {emailLoading ? 'שולח…' : 'שליחת קוד אימות'}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-ink-500">הזינו את הקוד שנשלח אל <strong dir="ltr">{newEmail}</strong></p>
                    <div className="flex justify-center gap-2" dir="ltr">
                      {otpDigits.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          value={d}
                          onChange={(e) => setOtpDigit(i, e.target.value)}
                          onKeyDown={(e) => onOtpKeyDown(i, e)}
                          inputMode="numeric"
                          maxLength={1}
                          className="h-12 w-11 text-center text-xl font-bold rounded-xl border border-ink-200 bg-white text-ink focus:border-accent focus:ring-2 focus:ring-accent-100 outline-none"
                        />
                      ))}
                    </div>
                    <button onClick={verifyEmailChange} className="btn-primary w-full" disabled={emailLoading}>
                      {emailLoading ? 'מאמת…' : 'אימות ועדכון מייל'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-canvas border border-ink-100 p-4">
      <div className="flex items-center gap-2 text-xs text-ink-400 mb-1">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="font-semibold text-ink">{value || '—'}</div>
    </div>
  );
}

function EditField({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-ink-400" />
        {label}
      </label>
      {children}
    </div>
  );
}
