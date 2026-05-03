import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, Briefcase, MessagesSquare, Gift, ShieldCheck, ChevronLeft } from 'lucide-react';
import adminApi from '../../api/adminClient.js';
import { timeAgo } from '../../utils/format.js';

const CARDS = [
  { key: 'users', label: 'משתמשים', icon: Users, to: '/admin/users', color: 'bg-accent-50 text-accent-700 border-accent-100' },
  { key: 'verifiedUsers', label: 'מאומתים', icon: ShieldCheck, color: 'bg-olive-50 text-olive-700 border-olive-100' },
  { key: 'organizations', label: 'ארגונים', icon: Building2, to: '/admin/organizations', color: 'bg-muted-50 text-muted-700 border-muted-100' },
  { key: 'jobs', label: 'משרות', icon: Briefcase, to: '/admin/jobs', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { key: 'posts', label: 'פוסטים', icon: MessagesSquare, to: '/admin/posts', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { key: 'benefits', label: 'הטבות', icon: Gift, to: '/admin/benefits', color: 'bg-pink-50 text-pink-700 border-pink-100' },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState({ stats: {}, recentUsers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get('/dashboard').then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">לוח בקרה</h1>
        <p className="text-sm text-ink-400 mt-1">סקירה מהירה של פעילות הקהילה</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {CARDS.map((c) => {
          const value = loading ? '…' : (data.stats?.[c.key] ?? 0);
          const Inner = (
            <div className={`card p-4 border ${c.color} transition hover:shadow-soft`}>
              <div className="flex items-center justify-between">
                <c.icon className="h-5 w-5" />
                {c.to && <ChevronLeft className="h-4 w-4 opacity-50" />}
              </div>
              <div className="text-2xl font-bold mt-3">{value}</div>
              <div className="text-xs opacity-70 mt-1">{c.label}</div>
            </div>
          );
          return c.to ? <Link key={c.key} to={c.to}>{Inner}</Link> : <div key={c.key}>{Inner}</div>;
        })}
      </div>

      <section className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-ink">משתמשים אחרונים</h2>
          <Link to="/admin/users" className="text-sm text-accent hover:underline">לכל המשתמשים ←</Link>
        </div>
        {loading ? (
          <p className="text-sm text-ink-400">טוען…</p>
        ) : data.recentUsers?.length ? (
          <div className="divide-y divide-ink-50">
            {data.recentUsers.map((u) => {
              const name = [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ') || u.email;
              return (
                <div key={u._id} className="flex items-center gap-3 py-3">
                  <div className="h-9 w-9 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                    {(u.profile?.firstName?.[0] || u.email[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">{name}</div>
                    <div className="text-xs text-ink-400 truncate" dir="ltr">{u.email}</div>
                  </div>
                  <div className="text-xs text-ink-400">
                    {u.organization?.name || '—'} · {timeAgo(u.createdAt)}
                  </div>
                  {u.isEmailVerified && (
                    <span className="chip text-xs text-olive-700 bg-olive-50">מאומת</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-ink-400">אין משתמשים</p>
        )}
      </section>
    </div>
  );
}
