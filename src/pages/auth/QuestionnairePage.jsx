import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowLeft, User, MapPin, Briefcase, Heart, Baby, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthShell from '../../components/common/AuthShell.jsx';

const initial = {
  firstName: '',
  lastName: '',
  phone: '',
  address: { city: '', street: '', houseNumber: '', apartment: '' },
  dateOfBirth: '',
  gender: '',
  maritalStatus: '',
  gedud: '',
  employmentStatuses: [],
  studentLevel: '',
  selfEmployedBusiness: '',
  children: [],
};

const GEDUDIM = [
  'משמר העמקים',
  'אבישי',
  'הכרמל',
  'אבשלום',
  'חרב שאול',
  'מטה',
];

const GENDERS = [
  { v: 'male', label: 'זכר' },
  { v: 'female', label: 'נקבה' },
  { v: 'other', label: 'אחר' },
];

const MARITAL = [
  { v: 'single', label: 'רווק/ה' },
  { v: 'married', label: 'נשוי/אה' },
  { v: 'common_law', label: 'ידוע/ה בציבור' },
  { v: 'in_relationship', label: 'בזוגיות' },
  { v: 'divorced', label: 'גרוש/ה' },
  { v: 'other', label: 'אחר' },
];

const EMPLOYMENT = [
  { v: 'employee', label: 'שכיר/ה' },
  { v: 'self_employed', label: 'עצמאי/ת' },
  { v: 'not_working', label: 'לא עובד/ת' },
  { v: 'student', label: 'סטודנט/ית' },
];

const STUDENT_LEVELS = [
  { v: 'bachelors', label: 'תואר ראשון' },
  { v: 'masters', label: 'תואר שני' },
  { v: 'doctorate', label: 'דוקטורט' },
  { v: 'other', label: 'אחר' },
];

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
        active
          ? 'border-accent bg-accent-50 text-accent-700'
          : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300'
      }`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-8 w-8 rounded-lg bg-muted-100 text-muted-700 flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
    </div>
  );
}

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const { submitQuestionnaire } = useAuth();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setAddr = (k, v) => setForm((f) => ({ ...f, address: { ...f.address, [k]: v } }));

  const addChild = () => set('children', [...form.children, { name: '', dateOfBirth: '' }]);
  const updateChild = (i, k, v) => {
    const next = form.children.map((c, idx) => (idx === i ? { ...c, [k]: v } : c));
    set('children', next);
  };
  const removeChild = (i) => set('children', form.children.filter((_, idx) => idx !== i));

  const toggleEmployment = (v) => set('employmentStatuses', form.employmentStatuses.includes(v) ? form.employmentStatuses.filter((s) => s !== v) : [...form.employmentStatuses, v]);
  const hasEmployment = (v) => form.employmentStatuses.includes(v);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.gender || !form.maritalStatus || !form.employmentStatuses.length || !form.gedud) {
      toast.error('יש לבחור את כל השדות החובה');
      return;
    }
    if (form.employmentStatuses.includes('student') && !form.studentLevel) {
      toast.error('יש לבחור רמת לימודים');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        employmentStatuses: form.employmentStatuses,
        employmentStatus: form.employmentStatuses[0] || '',
        children: form.children.filter((c) => c.name && c.dateOfBirth),
        studentLevel: form.employmentStatuses.includes('student') ? form.studentLevel : undefined,
        selfEmployedBusiness: form.employmentStatuses.includes('self_employed') ? form.selfEmployedBusiness : undefined,
      };
      await submitQuestionnaire(payload);
      toast.success('השאלון נשמר — ברוך הבא לקהילה!');
      navigate('/app');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשמירת השאלון');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="השאלון האישי"
      subtitle="כדי להתאים את ההטבות והשירותים, נשמח להכיר אותך טוב יותר."
      step={4}
      totalSteps={4}
    >
      <form onSubmit={submit} className="space-y-7">
        <section>
          <SectionTitle icon={User} title="פרטים אישיים" />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">שם פרטי</label>
                <input className="input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
              </div>
              <div>
                <label className="label">שם משפחה</label>
                <input className="input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">טלפון</label>
                <input dir="ltr" className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="050-0000000" required />
              </div>
              <div>
                <label className="label">תאריך לידה</label>
                <input type="date" className="input" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="label">גדוד</label>
              <div className="flex flex-wrap gap-2">
                {GEDUDIM.map((g) => (
                  <Pill key={g} active={form.gedud === g} onClick={() => set('gedud', g)}>
                    {g}
                  </Pill>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle icon={MapPin} title="כתובת" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">עיר *</label>
              <input className="input" value={form.address.city} onChange={(e) => setAddr('city', e.target.value)} required />
            </div>
            <div>
              <label className="label">רחוב *</label>
              <input className="input" value={form.address.street} onChange={(e) => setAddr('street', e.target.value)} required />
            </div>
            <div>
              <label className="label">מספר בית</label>
              <input className="input" value={form.address.houseNumber} onChange={(e) => setAddr('houseNumber', e.target.value)} placeholder="לא חובה" />
            </div>
            <div>
              <label className="label">דירה</label>
              <input className="input" value={form.address.apartment} onChange={(e) => setAddr('apartment', e.target.value)} placeholder="לא חובה" />
            </div>
          </div>
        </section>

        <section>
          <SectionTitle icon={Heart} title="פרטים נוספים" />
          <div className="space-y-4">
            <div>
              <label className="label">מגדר</label>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((o) => (
                  <Pill key={o.v} active={form.gender === o.v} onClick={() => set('gender', o.v)}>
                    {o.label}
                  </Pill>
                ))}
              </div>
            </div>
            <div>
              <label className="label">מצב משפחתי</label>
              <div className="flex flex-wrap gap-2">
                {MARITAL.map((o) => (
                  <Pill key={o.v} active={form.maritalStatus === o.v} onClick={() => set('maritalStatus', o.v)}>
                    {o.label}
                  </Pill>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle icon={Briefcase} title="תעסוקה" />
          <p className="text-xs text-ink-400 mb-2">ניתן לבחור יותר מאפשרות אחת</p>
          <div className="flex flex-wrap gap-2">
            {EMPLOYMENT.map((o) => (
              <Pill key={o.v} active={hasEmployment(o.v)} onClick={() => toggleEmployment(o.v)}>
                {o.label}
              </Pill>
            ))}
          </div>

          <AnimatePresence>
            {form.employmentStatuses.includes('self_employed') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4">
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
            {form.employmentStatuses.includes('student') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4 text-muted-700" />
                    <label className="label !mb-0">רמת לימודים</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STUDENT_LEVELS.map((o) => (
                      <Pill key={o.v} active={form.studentLevel === o.v} onClick={() => set('studentLevel', o.v)}>
                        {o.label}
                      </Pill>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle icon={Baby} title="ילדים" />
            <button type="button" onClick={addChild} className="btn-outline !py-1.5 !px-3 text-xs">
              <Plus className="h-3.5 w-3.5" />
              הוספת ילד/ה
            </button>
          </div>

          {form.children.length === 0 && (
            <p className="text-sm text-ink-400 bg-ink-50 rounded-lg p-3">אין ילדים? אפשר לדלג על השדה הזה.</p>
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
                <div className="rounded-xl border border-ink-100 bg-canvas p-3 mb-2 grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <label className="label text-xs">שם</label>
                    <input className="input !py-2" value={c.name} onChange={(e) => updateChild(i, 'name', e.target.value)} />
                  </div>
                  <div className="col-span-5">
                    <label className="label text-xs">תאריך לידה</label>
                    <input type="date" className="input !py-2" value={c.dateOfBirth} onChange={(e) => updateChild(i, 'dateOfBirth', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeChild(i)}
                      className="h-10 w-10 rounded-lg bg-accent-50 text-accent-700 hover:bg-accent-100 flex items-center justify-center"
                      aria-label="הסר"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'שומר…' : 'שמירה וכניסה לקהילה'}
          <ArrowLeft className="h-4 w-4" />
        </button>
      </form>
    </AuthShell>
  );
}
