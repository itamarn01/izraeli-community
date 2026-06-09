import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Briefcase, MessagesSquare, ArrowLeft, TrendingUp, Sparkles, ShieldCheck, Building2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { SkeletonStat, SkeletonGrid, SkeletonList } from '../components/skeletons/Skeletons.jsx';
import { timeAgo } from '../utils/format.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ benefits: [], jobs: [], posts: [] });

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [b, j, p] = await Promise.all([
          api.get('/benefits'),
          api.get('/jobs'),
          api.get('/posts'),
        ]);
        if (cancel) return;
        setData({ benefits: b.data.benefits, jobs: j.data.jobs, posts: p.data.posts });
      } catch {
        /* handled by interceptor */
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const firstName = user?.profile?.firstName || '';

  return (
    <div className="space-y-7">
      <div className="rounded-2xl bg-gradient-to-bl from-ink to-ink-700 text-white p-7 relative overflow-hidden shadow-card">
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute top-0 left-1/2 h-40 w-40 rounded-full bg-olive/20 blur-3xl" />
        <div className="relative">
          <span className="chip-accent !bg-accent/20 !text-accent-100">
            <Sparkles className="h-3.5 w-3.5" />
            ברוך הבא
          </span>
          <h1 className="mt-3 brand-display text-3xl">שלום {firstName || 'חבר/ה יקר/ה'}</h1>
          <p className="mt-1 text-white/70 max-w-lg">
            כאן תמצאו את כל ההטבות, המשרות והעדכונים החמים מהקהילה — במקום אחד.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/app/benefits" className="btn-primary">לצפייה בהטבות</Link>
            <Link to="/app/jobs" className="btn-outline !bg-white/5 !border-white/20 !text-white hover:!bg-white/10">לוח דרושים</Link>
          </div>
        </div>
      </div>

      <section>
        <SectionHeader title="עדכונים אחרונים מהקהילה" linkTo="/app/feed" />
        {loading ? (
          <SkeletonList count={3} />
        ) : data.posts.length === 0 ? (
          <EmptyState text="עדיין אין פוסטים — היו הראשונים לשתף" />
        ) : (
          <div className="space-y-3">
            {data.posts.slice(0, 3).map((p) => {
              const isAdminPost = p.isAdminPost;
              const authorName = isAdminPost
                ? (p.adminDisplayName || 'הנהלה')
                : ([p.author?.profile?.firstName, p.author?.profile?.lastName].filter(Boolean).join(' ') || 'חבר קהילה');
              return (
                <Link key={p._id} to={`/app/feed?post=${p._id}`} className="card p-4 flex gap-3 items-start hover:shadow-soft transition block">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold shrink-0 ${isAdminPost ? 'bg-accent text-white' : 'bg-muted-100 text-muted-700'}`}>
                    {isAdminPost ? <Building2 className="h-5 w-5" /> : (p.author?.profile?.firstName?.[0] || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-ink">{authorName}</span>
                      {isAdminPost && <span className="text-[9px] font-bold bg-accent text-white px-1.5 py-0.5 rounded-full">הנהלה</span>}
                      <span className="text-ink-400">·</span>
                      <span className="text-ink-400">{timeAgo(p.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-700 line-clamp-2">{p.content}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="הטבות חדשות" linkTo="/app/benefits" />
        {loading ? (
          <SkeletonGrid count={3} />
        ) : data.benefits.length === 0 ? (
          <EmptyState text="אין כרגע הטבות זמינות" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.benefits.slice(0, 3).map((b) => (
              <Link key={b._id} to={`/app/benefits?benefit=${b._id}`} className="card overflow-hidden hover:shadow-soft transition group block text-right">
                <div className="h-36 bg-gradient-to-bl from-muted-200 to-olive-100 relative flex items-center justify-center overflow-hidden">
                  {b.imageUrl ? (
                    <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <Gift className="h-10 w-10 text-white/70" />
                  )}
                  {(b.discountType === 'percentage' && b.discountPercent) && (
                    <span className="absolute top-2 right-2 bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">{b.discountPercent}% הנחה</span>
                  )}
                </div>
                <div className="p-4">
                  {b.businessName && <div className="text-xs text-muted-700 font-semibold mb-1">{b.businessName}</div>}
                  <h3 className="font-bold text-ink line-clamp-1">{b.title}</h3>
                  <p className="mt-1 text-sm text-ink-500 line-clamp-2">{b.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
            <StatCard icon={Gift} label="הטבות פעילות" value={data.benefits.length} hint="במועדון" tone="accent" to="/app/benefits" />
            <StatCard icon={Briefcase} label="משרות פתוחות" value={data.jobs.length} hint="ממתינות לכם" tone="olive" to="/app/jobs" />
            <StatCard icon={MessagesSquare} label="פוסטים בקהילה" value={data.posts.length} hint="פעילות ב-7 ימים" tone="muted" to="/app/feed" />
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone = 'accent', to }) {
  const tones = {
    accent: 'bg-accent-50 text-accent-700',
    olive: 'bg-olive-50 text-olive-700',
    muted: 'bg-muted-100 text-muted-700',
  };
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <TrendingUp className="h-4 w-4 text-olive-500" />
      </div>
      <div className="mt-3 text-3xl font-bold text-ink">{value}</div>
      <div className="text-sm font-semibold text-ink-700">{label}</div>
      <div className="text-xs text-ink-400 mt-0.5">{hint}</div>
    </>
  );
  return to ? (
    <Link to={to} className="card p-5 block hover:shadow-soft transition">
      {inner}
    </Link>
  ) : (
    <div className="card p-5">{inner}</div>
  );
}

function SectionHeader({ title, linkTo }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <Link to={linkTo} className="text-sm text-accent hover:underline font-semibold inline-flex items-center gap-1">
        לכל הפריטים
        <ArrowLeft className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="card p-8 text-center text-ink-400">{text}</div>;
}
