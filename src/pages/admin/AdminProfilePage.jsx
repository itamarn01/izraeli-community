import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { UserCircle2, ImagePlus, Save, KeyRound, Eye, EyeOff } from 'lucide-react';
import adminApi from '../../api/adminClient.js';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';

export default function AdminProfilePage() {
  const { admin, setAdmin } = useAdminAuth();

  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(admin?.avatarUrl || '');

  const [profileForm, setProfileForm] = useState({ fullName: admin?.fullName || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('יש להעלות תמונה');
    if (file.size > 5 * 1024 * 1024) return toast.error('גודל מקסימלי 5MB');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await adminApi.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAvatarPreview(data.url);
      const res = await adminApi.patch('/auth/profile', { avatarUrl: data.url });
      setAdmin(res.data.admin);
      toast.success('תמונת הפרופיל עודכנה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בהעלאה');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAvatar = async () => {
    try {
      const res = await adminApi.patch('/auth/profile', { avatarUrl: '' });
      setAdmin(res.data.admin);
      setAvatarPreview('');
      toast.success('התמונה הוסרה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await adminApi.patch('/auth/profile', { fullName: profileForm.fullName });
      setAdmin(res.data.admin);
      toast.success('הפרטים עודכנו');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('הסיסמאות אינן תואמות');
    }
    if (pwForm.newPassword.length < 8) {
      return toast.error('סיסמה חייבת להכיל לפחות 8 תווים');
    }
    setSavingPw(true);
    try {
      await adminApi.patch('/auth/profile', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('הסיסמה עודכנה בהצלחה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">פרופיל מנהל</h1>
        <p className="text-sm text-ink-400 mt-1">{admin?.username} · {admin?.email}</p>
      </header>

      {/* Avatar */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <h2 className="font-bold text-ink mb-4 flex items-center gap-2">
          <UserCircle2 className="h-5 w-5 text-accent" />
          תמונת פרופיל
        </h2>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="h-20 w-20 rounded-full object-cover border-2 border-accent/30" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-bold">
                {(admin?.fullName?.[0] || admin?.username?.[0] || '?').toUpperCase()}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className={`btn-primary cursor-pointer inline-flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <ImagePlus className="h-4 w-4" />
              {uploading ? 'מעלה…' : 'העלאת תמונה'}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} disabled={uploading} />
            </label>
            {avatarPreview && (
              <button onClick={removeAvatar} className="block text-sm text-ink-400 hover:text-red-500 transition">
                הסרת תמונה
              </button>
            )}
            <p className="text-xs text-ink-400">PNG, JPG עד 5MB. התמונה תופיע בפוסטים.</p>
          </div>
        </div>
      </motion.section>

      {/* Profile details */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-6"
      >
        <h2 className="font-bold text-ink mb-4 flex items-center gap-2">
          <Save className="h-5 w-5 text-accent" />
          פרטים אישיים
        </h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="label">שם מלא (שם תצוגה בפוסטים)</label>
            <input
              className="input"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="שם המנהל"
            />
          </div>
          <div>
            <label className="label">שם משתמש</label>
            <input className="input bg-ink-50 cursor-not-allowed" value={admin?.username || ''} disabled dir="ltr" />
          </div>
          <div>
            <label className="label">כתובת מייל</label>
            <input className="input bg-ink-50 cursor-not-allowed" value={admin?.email || ''} disabled dir="ltr" />
          </div>
          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? 'שומר…' : 'שמירת שינויים'}
          </button>
        </form>
      </motion.section>

      {/* Change password */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="font-bold text-ink mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-accent" />
          שינוי סיסמה
        </h2>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="label">סיסמה נוכחית</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                className="input pr-10"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                dir="ltr"
                required
              />
              <button type="button" onClick={() => setShowCurrent((s) => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">סיסמה חדשה</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                className="input pr-10"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                dir="ltr"
                required
                minLength={8}
              />
              <button type="button" onClick={() => setShowNew((s) => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">אימות סיסמה חדשה</label>
            <input
              type="password"
              className="input"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              dir="ltr"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={savingPw}>
            {savingPw ? 'מעדכן…' : 'עדכון סיסמה'}
          </button>
        </form>
      </motion.section>
    </div>
  );
}
