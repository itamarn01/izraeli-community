import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Phone, Globe, User2 } from 'lucide-react';
import adminApi from '../../api/adminClient.js';
import { timeAgo } from '../../utils/format.js';

const STATUS_LABELS = { pending: 'ממתינה', approved: 'אושרה', rejected: 'נדחתה' };
const STATUS_CLASSES = {
  pending: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

const PAGE_SIZE = 25;

export default function AdminBenefitSuggestionsPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchSuggestions = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const { data } = await adminApi.get(`/benefit-suggestions?${params}`);
      setSuggestions(data.suggestions);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchSuggestions(1);
  }, [statusFilter]);

  const goPage = (p) => { setPage(p); fetchSuggestions(p); };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await adminApi.patch(`/benefit-suggestions/${id}/status`, { status });
      setSuggestions((prev) => prev.map((s) => (s._id === id ? data.suggestion : s)));
      toast.success(`ההצעה ${STATUS_LABELS[status]}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    }
  };

  const remove = async (id) => {
    if (!confirm('למחוק את ההצעה?')) return;
    try {
      await adminApi.delete(`/benefit-suggestions/${id}`);
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
      setTotal((t) => t - 1);
      toast.success('ההצעה נמחקה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">הצעות הטבות</h1>
          <p className="text-sm text-ink-400 mt-1">{total} הצעות סה"כ</p>
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${statusFilter === s ? 'bg-accent text-white' : 'bg-ink-50 text-ink-500 hover:bg-ink-100'}`}
            >
              {s === 'all' ? 'הכל' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="card p-10 text-center text-ink-400">טוען…</div>
      ) : suggestions.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">לא נמצאו הצעות</div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => {
            const submitter = [s.submittedBy?.profile?.firstName, s.submittedBy?.profile?.lastName].filter(Boolean).join(' ') || s.submittedBy?.email || '—';
            return (
              <div key={s._id} className="card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-ink text-base">{s.businessName}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLASSES[s.status]}`}>
                        {STATUS_LABELS[s.status]}
                      </span>
                    </div>
                    <p className="text-sm text-ink-600 mt-1 leading-relaxed">{s.description}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {s.status !== 'approved' && (
                      <button onClick={() => updateStatus(s._id, 'approved')} title="אשר" className="h-8 w-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {s.status !== 'rejected' && (
                      <button onClick={() => updateStatus(s._id, 'rejected')} title="דחה" className="h-8 w-8 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 flex items-center justify-center">
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    {s.status === 'pending' && (
                      <button onClick={() => updateStatus(s._id, 'pending')} title="ממתינה" className="h-8 w-8 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-600 flex items-center justify-center">
                        <Clock className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => remove(s._id)} title="מחיקה" className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-ink-500 border-t border-ink-100 pt-3">
                  <span className="inline-flex items-center gap-1">
                    <User2 className="h-3.5 w-3.5" />
                    {submitter}
                    {s.submittedBy?.email && <span dir="ltr" className="text-ink-300">({s.submittedBy.email})</span>}
                  </span>
                  {s.contactName && <span className="inline-flex items-center gap-1"><User2 className="h-3.5 w-3.5" />איש קשר: {s.contactName}</span>}
                  {s.contactPhone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{s.contactPhone}</span>}
                  {s.website && (
                    <a href={s.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
                      <Globe className="h-3.5 w-3.5" />{s.website}
                    </a>
                  )}
                  <span className="mr-auto text-ink-300">{timeAgo(s.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => goPage(page - 1)} disabled={page <= 1} className="btn-outline disabled:opacity-50">
            <ChevronRight className="h-4 w-4" />
            הקודם
          </button>
          <span className="text-sm text-ink-500">עמוד {page}</span>
          <button onClick={() => goPage(page + 1)} disabled={!hasMore} className="btn-outline disabled:opacity-50">
            הבא
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
