import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  X, Send, Loader2, Eye, EyeOff, Users, AlertCircle, CheckCircle2,
  FlaskConical, ArrowRight, Mail, Clock,
} from 'lucide-react';
import adminApi from '../../api/adminClient';
import RichTextEditor from '../common/RichTextEditor.jsx';

const POLL_MS = 2000;

const STATUS_LABELS = {
  queued: 'ממתין',
  sending: 'בשליחה',
  completed: 'הושלם',
  completed_with_errors: 'הושלם עם שגיאות',
  failed: 'נכשל',
  cancelled: 'בוטל',
};

function StatusPill({ status, stalled }) {
  if (stalled) return <span className="chip !bg-amber-100 !text-amber-800">נתקע — השרת הופעל מחדש</span>;
  const tone =
    status === 'completed'
      ? '!bg-olive-100 !text-olive-800'
      : status === 'failed'
        ? '!bg-red-100 !text-red-700'
        : status === 'completed_with_errors'
          ? '!bg-amber-100 !text-amber-800'
          : '!bg-accent-50 !text-accent-700';
  return <span className={`chip ${tone}`}>{STATUS_LABELS[status] || status}</span>;
}

/**
 * Bulk email composer. Audience is supplied by the caller — the users list
 * passes its active filters, the events screen passes an event + segment — and
 * this component owns compose → preview → confirm → live progress.
 *
 * @param {object}   audience  { type:'users', filters } | { type:'event', event, segment, slotId }
 * @param {string}   title
 * @param {React.ReactNode} [segmentPicker] extra controls rendered above the form
 * @param {function} onClose
 */
export default function BroadcastModal({ audience, title, segmentPicker, onClose }) {
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');

  const [config, setConfig] = useState(null);
  const [audienceInfo, setAudienceInfo] = useState(null);
  const [loadingAudience, setLoadingAudience] = useState(true);

  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [stage, setStage] = useState('compose'); // compose | confirm | progress
  const [sendingTest, setSendingTest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [broadcast, setBroadcast] = useState(null);

  const closeRef = useRef(null);
  // Serialized so the effect below re-runs when the caller changes segment/slot.
  const audienceKey = JSON.stringify(audience);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && stage !== 'progress') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, stage]);

  useEffect(() => {
    adminApi
      .get('/broadcasts/status')
      .then(({ data }) => setConfig(data))
      .catch(() => setConfig({ configured: false, message: 'לא ניתן לבדוק את הגדרות Flashy' }));
  }, []);

  // Recipient count for the current audience; refreshed whenever it changes.
  useEffect(() => {
    let cancelled = false;
    setLoadingAudience(true);
    adminApi
      .post('/broadcasts/preview', { audience })
      .then(({ data }) => !cancelled && setAudienceInfo(data))
      .catch((err) => {
        if (cancelled) return;
        setAudienceInfo(null);
        toast.error(err?.response?.data?.message || 'שגיאה בטעינת רשימת הנמענים');
      })
      .finally(() => !cancelled && setLoadingAudience(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceKey]);

  const fields = audienceInfo?.fields || [];
  const total = audienceInfo?.total ?? 0;
  const canSend = subject.trim().length >= 2 && bodyHtml.trim().length > 0 && total > 0 && config?.configured;

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const { data } = await adminApi.post('/broadcasts/preview', { audience, subject, bodyHtml });
      setPreview(data.preview || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה ביצירת התצוגה המקדימה');
    } finally {
      setPreviewLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceKey, subject, bodyHtml]);

  const togglePreview = () => {
    const next = !showPreview;
    setShowPreview(next);
    if (next) loadPreview();
  };

  const sendTest = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      return toast.error('יש למלא נושא ותוכן לפני שליחת בדיקה');
    }
    setSendingTest(true);
    try {
      const { data } = await adminApi.post('/broadcasts/test', { subject, bodyHtml, audience });
      toast.success(`מייל בדיקה נשלח אל ${data.sentTo}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשליחת מייל הבדיקה');
    } finally {
      setSendingTest(false);
    }
  };

  const send = async () => {
    setSubmitting(true);
    try {
      const { data } = await adminApi.post('/broadcasts', { subject, bodyHtml, audience });
      setBroadcast(data.broadcast);
      setStage('progress');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בשליחה');
      setStage('compose');
    } finally {
      setSubmitting(false);
    }
  };

  // Poll while the send is running; stop as soon as it settles.
  useEffect(() => {
    if (stage !== 'progress' || !broadcast?._id) return undefined;
    if (['completed', 'completed_with_errors', 'failed', 'cancelled'].includes(broadcast.status)) return undefined;

    const timer = setTimeout(() => {
      adminApi
        .get(`/broadcasts/${broadcast._id}`)
        .then(({ data }) => setBroadcast(data.broadcast))
        .catch(() => {});
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [stage, broadcast]);

  const progressPct = useMemo(() => {
    if (!broadcast?.total) return 0;
    return Math.round(((broadcast.sent + broadcast.failed) / broadcast.total) * 100);
  }, [broadcast]);

  const done = broadcast && ['completed', 'completed_with_errors', 'failed'].includes(broadcast.status);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center gap-3 z-10">
          <div className="min-w-0">
            <h3 className="font-bold text-ink truncate">{title}</h3>
            <p className="text-xs text-ink-400">
              שליחה דרך Flashy
              {config?.from?.email ? ` · מאת ${config.from.name} <${config.from.email}>` : ''}
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="סגירה"
            className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-500 shrink-0 mr-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {config && !config.configured && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">שליחת תפוצה אינה מוגדרת</p>
                <p className="mt-0.5 text-xs leading-relaxed">{config.message}</p>
              </div>
            </div>
          )}

          {stage === 'progress' && broadcast ? (
            <ProgressPanel
              broadcast={broadcast}
              progressPct={progressPct}
              done={done}
              onClose={onClose}
            />
          ) : stage === 'confirm' ? (
            <ConfirmPanel
              total={total}
              label={audienceInfo?.label}
              subject={subject}
              submitting={submitting}
              onBack={() => setStage('compose')}
              onConfirm={send}
            />
          ) : (
            <>
              {segmentPicker}

              {/* Audience */}
              <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-accent shrink-0" />
                  {loadingAudience ? (
                    <span className="text-ink-400">מחשב נמענים…</span>
                  ) : (
                    <span>
                      <strong className="text-ink">{total}</strong>{' '}
                      <span className="text-ink-500">נמענים · {audienceInfo?.label}</span>
                    </span>
                  )}
                </div>
                {!loadingAudience && audienceInfo?.sample?.length > 0 && (
                  <p className="mt-2 text-xs text-ink-400 leading-relaxed">
                    לדוגמה: {audienceInfo.sample.slice(0, 4).map((s) => s.name || s.email).join(' · ')}
                    {total > 4 ? ` ועוד ${total - 4}` : ''}
                  </p>
                )}
                {!loadingAudience && total === 0 && (
                  <p className="mt-2 text-xs text-amber-700">אין נמענים התואמים לבחירה הנוכחית.</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="bc-subject">נושא המייל</label>
                <input
                  id="bc-subject"
                  className="input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="למשל: תזכורת — עצרת החטיבה בשבוע הבא"
                  maxLength={200}
                />
              </div>

              <div>
                <div className="flex items-end justify-between mb-1.5">
                  <label className="label !mb-0">תוכן ההודעה</label>
                  <button
                    type="button"
                    onClick={togglePreview}
                    className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1"
                  >
                    {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showPreview ? 'הסתרת תצוגה מקדימה' : 'תצוגה מקדימה'}
                  </button>
                </div>
                <RichTextEditor
                  value={bodyHtml}
                  fields={fields}
                  onChange={setBodyHtml}
                  fieldsLabel="פרטי הנמען"
                  fieldsEmptyHint="אין שדות זמינים לקהל הזה"
                  placeholder="כתבו כאן את גוף המייל. אפשר לעצב, להוסיף כותרות ורשימות, ולשלב את שם הנמען דרך ״פרטי הנמען״."
                />
                <p className="mt-1.5 text-xs text-ink-400">
                  ״פרטי הנמען״ מוסיף שדה שמוחלף אצל כל נמען בערך שלו — למשל שם פרטי או גדוד.
                </p>
              </div>

              {showPreview && (
                <div className="rounded-xl border border-ink-200 overflow-hidden">
                  <div className="flex items-center gap-2 bg-ink-50 px-3 py-2 text-xs text-ink-500 border-b border-ink-100">
                    <Mail className="h-3.5 w-3.5" />
                    {previewLoading ? (
                      'מייצר תצוגה מקדימה…'
                    ) : preview ? (
                      <>
                        <span className="font-semibold text-ink">{preview.subject}</span>
                        <span className="mr-auto">כפי שייראה אצל {preview.forRecipient}</span>
                      </>
                    ) : (
                      'אין תצוגה להצגה'
                    )}
                    <button
                      type="button"
                      onClick={loadPreview}
                      className="text-accent font-semibold hover:underline"
                    >
                      רענון
                    </button>
                  </div>
                  {preview?.html && (
                    <iframe
                      title="תצוגה מקדימה של המייל"
                      srcDoc={preview.html}
                      sandbox=""
                      className="w-full h-96 bg-white"
                    />
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStage('confirm')}
                  disabled={!canSend}
                  className="btn-primary flex-1 min-w-[180px]"
                >
                  <Send className="h-4 w-4" />
                  שליחה ל-{total} נמענים
                </button>
                <button
                  type="button"
                  onClick={sendTest}
                  disabled={sendingTest || !config?.configured}
                  className="btn-outline"
                >
                  {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                  מייל בדיקה אליי
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ConfirmPanel({ total, label, subject, submitting, onBack, onConfirm }) {
  return (
    <div className="space-y-4 text-center py-4">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-accent-50 text-accent-700 flex items-center justify-center">
        <Send className="h-7 w-7" />
      </div>
      <div>
        <h4 className="text-lg font-bold text-ink">לשלוח את המייל ל-{total} נמענים?</h4>
        <p className="mt-1 text-sm text-ink-500">{label}</p>
      </div>
      <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 text-right">
        <div className="text-xs text-ink-400">נושא</div>
        <div className="font-semibold text-ink">{subject}</div>
      </div>
      <p className="text-xs text-ink-400">לא ניתן לבטל שליחה לאחר שהחלה.</p>
      <div className="flex gap-2">
        <button onClick={onBack} disabled={submitting} className="btn-outline flex-1">
          <ArrowRight className="h-4 w-4" />
          חזרה לעריכה
        </button>
        <button onClick={onConfirm} disabled={submitting} className="btn-primary flex-1">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          כן, שלח
        </button>
      </div>
    </div>
  );
}

function ProgressPanel({ broadcast, progressPct, done, onClose }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StatusPill status={broadcast.status} stalled={broadcast.isStalled} />
        <span className="text-sm text-ink-500">{broadcast.audience?.label}</span>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="font-semibold text-ink">
            {broadcast.sent + broadcast.failed} / {broadcast.total}
          </span>
          <span className="text-ink-400">{progressPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-ink-100 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${broadcast.failed > 0 ? 'bg-amber-500' : 'bg-accent'}`}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-olive-50 border border-olive-100 p-3">
          <div className="text-xl font-bold text-olive-800">{broadcast.sent}</div>
          <div className="text-[11px] text-olive-700">נשלחו</div>
        </div>
        <div className="rounded-xl bg-red-50 border border-red-100 p-3">
          <div className="text-xl font-bold text-red-700">{broadcast.failed}</div>
          <div className="text-[11px] text-red-600">נכשלו</div>
        </div>
        <div className="rounded-xl bg-ink-50 border border-ink-100 p-3">
          <div className="text-xl font-bold text-ink">{broadcast.total}</div>
          <div className="text-[11px] text-ink-400">סה״כ</div>
        </div>
      </div>

      {broadcast.isStalled && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
          <Clock className="h-4 w-4 shrink-0 mt-px" />
          השליחה הופסקה באמצע — כנראה השרת הופעל מחדש. המיילים שכבר נשלחו לא יישלחו שוב;
          ניתן לשלוח שוב לנמענים שנותרו.
        </p>
      )}

      {broadcast.error && (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-px" />
          {broadcast.error}
        </p>
      )}

      {broadcast.failures?.length > 0 && (
        <details className="rounded-xl border border-ink-100 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-ink">
            כתובות שנכשלו ({broadcast.failures.length})
          </summary>
          <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto text-xs">
            {broadcast.failures.map((f, i) => (
              <li key={`${f.email}-${i}`} className="flex flex-wrap gap-x-2 text-ink-500">
                <span dir="ltr" className="font-mono text-ink">{f.email}</span>
                <span className="text-red-600">{f.error}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {done ? (
        <div className="flex items-center gap-2 pt-1">
          <CheckCircle2 className="h-5 w-5 text-olive-600 shrink-0" />
          <span className="text-sm text-ink-600">
            {broadcast.status === 'failed'
              ? 'השליחה נכשלה — אף מייל לא נשלח.'
              : `השליחה הסתיימה. ${broadcast.sent} מיילים נשלחו${broadcast.failed ? `, ${broadcast.failed} נכשלו` : ''}.`}
          </span>
          <button onClick={onClose} className="btn-primary mr-auto">
            סגירה
          </button>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          השליחה רצה ברקע — אפשר לסגור את החלון ולחזור למסך התפוצות בהמשך.
          <button onClick={onClose} className="btn-outline !py-1.5 !px-3 text-xs mr-auto">
            סגירה
          </button>
        </p>
      )}
    </div>
  );
}
