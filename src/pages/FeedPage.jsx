import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Send, ImagePlus, X } from 'lucide-react';
import api from '../api/client';
import { SkeletonList } from '../components/skeletons/Skeletons.jsx';
import { timeAgo } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useImageUpload } from '../hooks/useImageUpload.js';

const IMAGE_MAX_MB = 5;
const PAGE_SIZE = 10;

export default function FeedPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('post');

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const { upload, uploading, preview, clear } = useImageUpload();
  const [pendingImageUrl, setPendingImageUrl] = useState(null);
  const sentinelRef = useRef(null);
  const postRefs = useRef({});

  const fetchPage = async (p, replace = false) => {
    try {
      const { data } = await api.get(`/posts?page=${p}&limit=${PAGE_SIZE}`);
      setPosts((prev) => replace ? data.posts : [...prev, ...data.posts]);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchPage(1, true); }, []);

  // Scroll to highlighted post
  useEffect(() => {
    if (!highlightId || loading) return;
    const el = postRefs.current[highlightId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSearchParams({}, { replace: true });
    }
  }, [highlightId, posts, loading]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const next = page + 1;
          setPage(next);
          setLoadingMore(true);
          fetchPage(next);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page]);

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) setPendingImageUrl(url);
    e.target.value = '';
  };

  const clearImage = () => { clear(); setPendingImageUrl(null); };

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post('/posts', { content, imageUrl: pendingImageUrl || '' });
      setPosts((p) => [data.post, ...p]);
      setContent('');
      clearImage();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'שגיאה בפרסום');
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post) => {
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setPosts((arr) =>
        arr.map((p) =>
          p._id === post._id
            ? { ...p, likes: data.liked ? [...p.likes, user._id] : p.likes.filter((id) => id !== user._id) }
            : p
        )
      );
    } catch { toast.error('שגיאה'); }
  };

  const addComment = async (postId, text, reset) => {
    if (!text.trim()) return;
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { text });
      setPosts((arr) => arr.map((p) => (p._id === postId ? { ...p, comments: data.comments } : p)));
      reset();
    } catch (err) { toast.error(err?.response?.data?.message || 'שגיאה'); }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">פיד הקהילה</h1>
        <p className="text-sm text-ink-400 mt-1">שתפו, התייעצו והכירו חברים נוספים</p>
      </header>

      <form onSubmit={submit} className="card p-4">
        <div className="flex gap-3 items-start">
          <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center font-bold shrink-0">
            {user?.profile?.firstName?.[0] || '?'}
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="מה בא לך לשתף עם הקהילה?"
              className="input resize-none"
            />
            {(preview || pendingImageUrl) && (
              <div className="relative w-fit">
                <img src={preview || pendingImageUrl} alt="" className="h-32 w-auto rounded-xl object-cover border border-ink-100" />
                <button type="button" onClick={clearImage} className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-ink text-white flex items-center justify-center shadow">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <label className={`inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink cursor-pointer transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <ImagePlus className="h-4 w-4" />
                {uploading ? 'מעלה…' : `הוספת תמונה (עד ${IMAGE_MAX_MB}MB)`}
                <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} disabled={uploading} />
              </label>
              <button type="submit" disabled={posting || !content.trim() || uploading} className="btn-primary !py-2">
                {posting ? 'מפרסם…' : 'פרסום'}
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </form>

      {loading ? (
        <SkeletonList count={4} />
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center text-ink-400">עדיין אין פוסטים. היו ראשונים לפרסם!</div>
      ) : (
        <AnimatePresence>
          {posts.map((p) => (
            <div
              key={p._id}
              ref={(el) => { if (el) postRefs.current[p._id] = el; }}
            >
              <PostCard
                post={p}
                highlight={p._id === highlightId}
                currentUserId={user._id}
                onLike={() => toggleLike(p)}
                onComment={(text, reset) => addComment(p._id, text, reset)}
              />
            </div>
          ))}
        </AnimatePresence>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
      {loadingMore && <SkeletonList count={2} />}
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-sm text-ink-300 pb-4">אין עוד פוסטים</p>
      )}
    </div>
  );
}

function PostCard({ post, currentUserId, onLike, onComment, highlight }) {
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState('');
  const liked = post.likes?.some((id) => id === currentUserId);
  const authorName = [post.author?.profile?.firstName, post.author?.profile?.lastName].filter(Boolean).join(' ') || 'חבר קהילה';

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`card p-5 mb-3 transition-shadow ${highlight ? 'ring-2 ring-accent shadow-soft' : ''}`}
    >
      <header className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-muted-100 text-muted-700 flex items-center justify-center font-bold">
          {authorName[0] || '?'}
        </div>
        <div>
          <div className="font-semibold text-ink text-sm">{authorName}</div>
          <div className="text-xs text-ink-400">{timeAgo(post.createdAt)}</div>
        </div>
      </header>

      <p className="text-ink-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>

      {post.imageUrl && (
        <div className="mt-3 rounded-xl overflow-hidden border border-ink-100">
          <img src={post.imageUrl} alt="" className="w-full max-h-96 object-cover" />
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-ink-100 flex items-center gap-4 text-sm">
        <button
          onClick={onLike}
          className={`inline-flex items-center gap-1.5 transition ${liked ? 'text-accent' : 'text-ink-500 hover:text-accent'}`}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          {post.likes?.length || 0}
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="inline-flex items-center gap-1.5 text-ink-500 hover:text-ink"
        >
          <MessageSquare className="h-4 w-4" />
          {post.comments?.length || 0}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-ink-100 space-y-3">
          {post.comments?.map((c) => {
            const cName = [c.user?.profile?.firstName, c.user?.profile?.lastName].filter(Boolean).join(' ') || 'חבר קהילה';
            return (
              <div key={c._id} className="flex gap-2">
                <div className="h-8 w-8 rounded-full bg-ink-100 text-ink-700 flex items-center justify-center text-xs font-bold">
                  {cName[0] || '?'}
                </div>
                <div className="flex-1 rounded-xl bg-ink-50 px-3 py-2">
                  <div className="text-xs font-semibold text-ink">{cName}</div>
                  <p className="text-sm text-ink-700">{c.text}</p>
                </div>
              </div>
            );
          })}
          <form
            onSubmit={(e) => { e.preventDefault(); onComment(draft, () => setDraft('')); }}
            className="flex gap-2"
          >
            <input
              className="input !py-2 flex-1"
              placeholder="הוסף תגובה…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className="btn-primary !py-2">
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </motion.article>
  );
}
