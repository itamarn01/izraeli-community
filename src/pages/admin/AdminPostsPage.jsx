import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, Eye, EyeOff, Trash2, Heart, MessageSquare, ChevronDown, ChevronLeft, ChevronRight,
  User2, Filter, Plus, X, Send, ShieldCheck, ImagePlus,
} from 'lucide-react';
import adminApi from '../../api/adminClient.js';
import { timeAgo } from '../../utils/format.js';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';

const PAGE_SIZE = 25;
const AVATAR_COLORS = ['#E74C3C','#9B59B6','#2980B9','#27AE60','#E67E22','#1ABC9C','#E91E63','#607D8B'];
function getUserColor(id) {
  let hash = 0;
  const str = String(id || '');
  for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); hash |= 0; }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function AdminPostsPage() {
  const { admin } = useAdminAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [hidden, setHidden] = useState('all');
  const [expanded, setExpanded] = useState({});
  const [showCompose, setShowCompose] = useState(false);
  const [commentingOn, setCommentingOn] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);

  useEffect(() => {
    adminApi.get('/organizations?limit=100').then(({ data }) => setOrgs(data.organizations || [])).catch(() => {});
  }, []);

  const fetchPosts = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
      if (q) params.set('q', q);
      if (userQuery) params.set('userQuery', userQuery);
      if (hidden !== 'all') params.set('isHidden', hidden);
      const { data } = await adminApi.get(`/posts?${params}`);
      setPosts(data.posts);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchPosts(1); }, 300);
    return () => clearTimeout(t);
  }, [q, userQuery, hidden]);

  const goPage = (p) => { setPage(p); fetchPosts(p); };

  const remove = async (post) => {
    if (!confirm('למחוק את הפוסט? פעולה זו אינה הפיכה.')) return;
    try {
      await adminApi.delete(`/posts/${post._id}`);
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
      toast.success('הפוסט נמחק');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    }
  };

  const toggleHide = async (post) => {
    try {
      const { data } = await adminApi.post(`/posts/${post._id}/toggle-hide`);
      setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, ...data.post } : p)));
      toast.success(data.post.isHidden ? 'הפוסט הוסתר' : 'הפוסט הוצג');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    }
  };

  const deleteComment = async (postId, commentId) => {
    if (!confirm('למחוק את התגובה?')) return;
    try {
      const { data } = await adminApi.delete(`/posts/${postId}/comments/${commentId}`);
      setPosts((prev) => prev.map((p) => (p._id === postId ? data.post : p)));
      toast.success('התגובה נמחקה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    }
  };

  const submitAdminComment = async (postId) => {
    if (!commentDraft.trim()) return;
    setCommentLoading(true);
    try {
      const { data } = await adminApi.post(`/posts/${postId}/admin-comment`, {
        text: commentDraft.trim(),
        adminDisplayName: admin?.fullName || admin?.username || 'הנהלה',
      });
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, comments: data.comments } : p)));
      setCommentDraft('');
      setCommentingOn(null);
      toast.success('תגובה פורסמה');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה');
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">ניהול פיד</h1>
          <p className="text-sm text-ink-400 mt-1">{total} פוסטים סה"כ</p>
        </div>
        <button onClick={() => setShowCompose(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          כתיבת פוסט כהנהלה
        </button>
      </header>

      <AnimatePresence>
        {showCompose && (
          <ComposeModal
            orgs={orgs}
            adminName={admin?.fullName || admin?.username || 'הנהלה'}
            onClose={() => setShowCompose(false)}
            onCreated={(post) => {
              setPosts((prev) => [post, ...prev]);
              setTotal((t) => t + 1);
              setShowCompose(false);
              toast.success('הפוסט פורסם');
            }}
          />
        )}
      </AnimatePresence>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pr-10" placeholder="חיפוש בתוכן…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="relative">
          <User2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pr-10" placeholder="סינון לפי יוזר: מייל / שם / טלפון" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <select className="input pr-10" value={hidden} onChange={(e) => setHidden(e.target.value)}>
            <option value="all">סטטוס (הכל)</option>
            <option value="false">פעיל</option>
            <option value="true">מוסתר</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-ink-400">טוען…</div>
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">לא נמצאו פוסטים</div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const author = [p.author?.profile?.firstName, p.author?.profile?.lastName].filter(Boolean).join(' ') || p.author?.email || '—';
            const isExpanded = !!expanded[p._id];
            return (
              <div key={p._id} className={`card p-4 transition ${p.isHidden ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  {p.author?.avatarUrl ? (
                    <img src={p.author.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="h-9 w-9 rounded-full text-white flex items-center justify-center font-bold shrink-0"
                      style={{ backgroundColor: getUserColor(p.author?._id) }}
                    >
                      {(p.author?.profile?.firstName?.[0] || p.author?.email?.[0] || '?').toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-ink">{author}</span>
                      <span className="text-xs text-ink-400">{timeAgo(p.createdAt)}</span>
                      {p.isHidden && <span className="chip text-[10px] text-red-700 bg-red-50">מוסתר</span>}
                      {p.organization?.name && <span className="chip text-[10px]">{p.organization.name}</span>}
                    </div>
                    <div className="text-xs text-ink-400" dir="ltr">{p.author?.email} {p.author?.profile?.phone && `· ${p.author.profile.phone}`}</div>
                    <p className="text-sm text-ink-700 mt-2 whitespace-pre-wrap leading-relaxed">{p.content}</p>
                    {p.imageUrl && <img src={p.imageUrl} alt="" className="mt-2 max-h-40 rounded-xl border border-ink-100" />}
                    <div className="mt-3 pt-3 border-t border-ink-100 flex items-center gap-4 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{p.likes?.length || 0}</span>
                      <button
                        onClick={() => setExpanded((e) => ({ ...e, [p._id]: !isExpanded }))}
                        className="inline-flex items-center gap-1 hover:text-ink"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {p.comments?.length || 0} תגובות
                        <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-3 space-y-2"
                        >
                          {p.comments?.map((c) => {
                            const isAdminC = c.isAdminComment;
                            const cName = isAdminC
                              ? (c.adminDisplayName || 'הנהלה')
                              : ([c.user?.profile?.firstName, c.user?.profile?.lastName].filter(Boolean).join(' ') || c.user?.email || '—');
                            return (
                              <div key={c._id} className={`flex items-start gap-2 rounded-xl p-2 ${isAdminC ? 'bg-accent-50 border border-accent/20' : 'bg-ink-50'}`}>
                                <div
                                  className={`h-6 w-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0 ${isAdminC ? 'bg-accent' : ''}`}
                                  style={!isAdminC ? { backgroundColor: getUserColor(c.user?._id) } : {}}
                                >
                                  {isAdminC ? '🛡' : cName[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <div className="text-xs font-semibold text-ink">{cName}</div>
                                    {isAdminC && <span className="text-[9px] font-bold bg-accent text-white px-1 rounded-full">הנהלה</span>}
                                  </div>
                                  <p className="text-xs text-ink-700 mt-0.5">{c.text}</p>
                                </div>
                                <button
                                  onClick={() => deleteComment(p._id, c._id)}
                                  title="מחיקת תגובה"
                                  className="h-6 w-6 rounded-md text-red-500 hover:bg-red-100 flex items-center justify-center shrink-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                          {commentingOn === p._id ? (
                            <div className="flex gap-2 mt-2">
                              <ShieldCheck className="h-5 w-5 text-accent shrink-0 mt-2" />
                              <input
                                className="input !py-1.5 flex-1 text-sm"
                                placeholder="תגובה כהנהלה…"
                                value={commentDraft}
                                onChange={(e) => setCommentDraft(e.target.value)}
                                autoFocus
                              />
                              <button
                                onClick={() => submitAdminComment(p._id)}
                                disabled={commentLoading || !commentDraft.trim()}
                                className="btn-primary !py-1.5 !px-3"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => { setCommentingOn(null); setCommentDraft(''); }} className="btn-outline !py-1.5 !px-3">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setCommentingOn(p._id); setExpanded((e) => ({ ...e, [p._id]: true })); }}
                              className="text-xs text-accent hover:underline flex items-center gap-1 mt-1"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              הוסף תגובה כהנהלה
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <button onClick={() => toggleHide(p)} title={p.isHidden ? 'הצגה' : 'הסתרה'} className="h-8 w-8 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-500 flex items-center justify-center">
                      {p.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => remove(p)} title="מחיקה" className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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

function ComposeModal({ orgs, adminName, onClose, onCreated }) {
  const [content, setContent] = useState('');
  const [orgId, setOrgId] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !orgId) return;
    setLoading(true);
    try {
      const { data } = await adminApi.post('/posts/compose', {
        content: content.trim(),
        organization: orgId,
        adminDisplayName: adminName,
      });
      onCreated(data.post);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בפרסום');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className="card w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-ink">פרסום פוסט כהנהלה</h3>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="label">ארגון</label>
            <select className="input" value={orgId} onChange={(e) => setOrgId(e.target.value)} required>
              <option value="">בחר ארגון…</option>
              {orgs.map((o) => (
                <option key={o._id} value={o._id}>{o.name} ({o.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">תוכן הפוסט</label>
            <textarea
              rows={5}
              className="input resize-none"
              placeholder="כתוב הודעה לקהילה…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-500 bg-accent-50 rounded-xl p-3">
            <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
            הפוסט יופיע עם תגית <span className="font-bold text-accent">הנהלה</span> בשם <span className="font-semibold">{adminName}</span>
          </div>
          <button type="submit" disabled={loading || !content.trim() || !orgId} className="btn-primary w-full">
            {loading ? 'מפרסם…' : 'פרסום הפוסט'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
