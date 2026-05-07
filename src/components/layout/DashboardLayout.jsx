import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Gift, Briefcase, MessagesSquare, UserCircle2,
  LogOut, Menu, X, Bell, Search, Briefcase as JobIcon, Gift as BenefitIcon,
  MessagesSquare as PostIcon, Trash2, CheckCheck, ChevronLeft, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TERMS_SECTIONS, PRIVACY_SECTIONS } from '../../content/legal.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';

const AVATAR_COLORS = ['#E74C3C','#9B59B6','#2980B9','#27AE60','#E67E22','#1ABC9C','#E91E63','#607D8B'];
function getUserColor(id) {
  let hash = 0;
  const str = String(id || '');
  for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); hash |= 0; }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
import api from '../../api/client.js';
import { timeAgo } from '../../utils/format.js';
import Logo from '../common/Logo.jsx';

const NAV = [
  { to: '/app', label: 'דשבורד', icon: LayoutDashboard, end: true },
  { to: '/app/benefits', label: 'מועדון הטבות', icon: Gift },
  { to: '/app/jobs', label: 'דרושים', icon: Briefcase },
  { to: '/app/feed', label: 'פיד הקהילה', icon: MessagesSquare },
  { to: '/app/profile', label: 'הפרופיל שלי', icon: UserCircle2 },
];

const TYPE_ICON = { post: PostIcon, job: JobIcon, benefit: BenefitIcon };
const TYPE_LABEL = { post: 'פוסט', job: 'משרה', benefit: 'הטבה' };
const TYPE_ROUTE = { post: '/app/feed', job: '/app/jobs', benefit: '/app/benefits' };
const TYPE_PARAM = { post: 'post', job: 'job', benefit: 'benefit' };

function NotificationPanel({ onClose }) {
  const navigate = useNavigate();
  const { notifications, markRead, markAllRead, clearAll, isRead } = useNotifications();

  const handleClick = (n) => {
    if (!isRead(n)) markRead(n._id);
    if (n.resourceId && n.type) {
      navigate(`${TYPE_ROUTE[n.type]}?${TYPE_PARAM[n.type]}=${n.resourceId}`);
    }
    onClose();
  };

  return (
    <div className="absolute left-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-80 card shadow-card overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
        <span className="font-bold text-ink">התראות</span>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="text-xs text-accent hover:underline flex items-center gap-1">
            <CheckCheck className="h-3.5 w-3.5" />
            סמן הכל
          </button>
          <button onClick={clearAll} className="text-xs text-ink-400 hover:text-accent flex items-center gap-1">
            <Trash2 className="h-3.5 w-3.5" />
            נקה
          </button>
          <button onClick={onClose} className="h-7 w-7 rounded-lg hover:bg-ink-50 flex items-center justify-center text-ink-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto divide-y divide-ink-50">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-ink-400">אין התראות</div>
        ) : (
          notifications.map((n) => {
            const read = isRead(n);
            const Icon = TYPE_ICON[n.type] || Bell;
            return (
              <button
                key={n._id}
                onClick={() => handleClick(n)}
                className={`w-full text-right flex items-start gap-3 px-4 py-3 hover:bg-ink-50 transition ${!read ? 'bg-accent-50/40' : ''}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.type === 'post' ? 'bg-muted-100 text-muted-700' :
                  n.type === 'job' ? 'bg-olive-100 text-olive-700' :
                    'bg-accent-100 text-accent-700'
                  }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-ink-400">{TYPE_LABEL[n.type]}</span>
                    {!read && <span className="h-1.5 w-1.5 rounded-full bg-accent inline-block shrink-0" />}
                  </div>
                  <div className="text-sm font-semibold text-ink leading-snug">{n.title}</div>
                  {n.body && <div className="text-xs text-ink-400 truncate mt-0.5">{n.body}</div>}
                  <div className="text-xs text-ink-300 mt-1">{timeAgo(n.createdAt)}</div>
                </div>
                <ChevronLeft className="h-3.5 w-3.5 text-ink-300 shrink-0 mt-1" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function SearchDropdown({ q, results, loading, onNavigate }) {
  if (!q || q.length < 2) return null;
  const hasResults = results.posts?.length || results.jobs?.length || results.benefits?.length;

  return (
    <div className="absolute right-0 top-full mt-1 w-full max-w-md card shadow-card z-50 overflow-hidden">
      {loading ? (
        <div className="p-4 text-sm text-ink-400 text-center">מחפש…</div>
      ) : !hasResults ? (
        <div className="p-4 text-sm text-ink-400 text-center">לא נמצאו תוצאות</div>
      ) : (
        <div className="divide-y divide-ink-50 max-h-80 overflow-y-auto">
          {results.posts?.map((p) => (
            <SearchItem
              key={p._id} icon={PostIcon} label="פוסט"
              title={p.content?.slice(0, 60)} sub={timeAgo(p.createdAt)}
              onClick={() => onNavigate(`/app/feed?post=${p._id}`)}
            />
          ))}
          {results.jobs?.map((j) => (
            <SearchItem
              key={j._id} icon={JobIcon} label="משרה"
              title={j.title} sub={j.company}
              onClick={() => onNavigate(`/app/jobs?job=${j._id}`)}
            />
          ))}
          {results.benefits?.map((b) => (
            <SearchItem
              key={b._id} icon={BenefitIcon} label="הטבה"
              title={b.title} sub={b.businessName || b.category}
              onClick={() => onNavigate(`/app/benefits?benefit=${b._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchItem({ icon: Icon, label, title, sub, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-ink-50 transition">
      <div className="h-8 w-8 rounded-lg bg-ink-50 text-ink-500 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-ink-400">{label}</div>
        <div className="text-sm font-semibold text-ink truncate">{title}</div>
        {sub && <div className="text-xs text-ink-400 truncate">{sub}</div>}
      </div>
      <ChevronLeft className="h-4 w-4 text-ink-300 shrink-0" />
    </button>
  );
}

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  const fullName = [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ');

  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="px-5 py-6 border-b border-white/10">
        <Logo size={40} variant="light" />
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${isActive
                ? 'bg-accent text-white shadow-soft'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="תמונת פרופיל" className="h-9 w-9 rounded-full object-cover shrink-0" />
          ) : (
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-white shrink-0"
              style={{ backgroundColor: getUserColor(user?._id) }}
            >
              {(user?.profile?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{fullName || user?.email}</div>
            <div className="text-[11px] text-white/50 truncate">{user?.role === 'admin' ? 'מנהל קהילה' : 'חבר קהילה'}</div>
          </div>
          <button onClick={handleLogout} className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white" title="התנתקות">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AccordionSection({ title, sections }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-ink-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-right hover:bg-ink-50 transition"
      >
        <span className="font-semibold text-ink text-sm">{title}</span>
        <ChevronDown className={`h-4 w-4 text-ink-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 max-h-60 overflow-y-auto space-y-4 border-t border-ink-100 pt-3">
          {sections.map((s) => (
            <div key={s.num}>
              <div className="text-xs font-bold text-ink mb-1.5">{s.num}. {s.title}</div>
              <ul className="space-y-1">
                {s.points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-xs text-ink-500 leading-relaxed">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-accent shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TermsModal() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/users/me/accept-terms');
      setUser(data.user);
    } catch {
      toast.error('שגיאה, נסה שנית');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (user?.termsAcceptedAt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-ink-100">
          <Logo size={34} />
          <h2 className="text-lg font-bold text-ink mt-4">תנאי שימוש ומדיניות פרטיות</h2>
          <p className="text-sm text-ink-400 mt-1">יש לקרוא ולאשר לפני השימוש באפליקציה</p>
        </div>

        {/* Accordion sections */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <AccordionSection title="תנאי שימוש" sections={TERMS_SECTIONS} />
          <AccordionSection title="מדיניות פרטיות" sections={PRIVACY_SECTIONS} />
          <p className="text-xs text-ink-400 text-center pt-1">
            לצפייה בגרסה המלאה:{' '}
            <a href="/terms" target="_blank" rel="noreferrer" className="text-accent hover:underline">תנאי שימוש</a>
            {' '}|{' '}
            <a href="/privacy" target="_blank" rel="noreferrer" className="text-accent hover:underline">מדיניות פרטיות</a>
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-4 border-t border-ink-100 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-accent cursor-pointer"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span className="text-sm text-ink leading-snug">
              קראתי ואני מסכים/מסכימה לתנאי השימוש ולמדיניות הפרטיות
            </span>
          </label>
          <button
            onClick={handleAccept}
            disabled={!checked || loading}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'שומר…' : 'מאשר/ת והמשך'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-ink-400 hover:text-ink py-1 transition"
          >
            יציאה מהמערכת
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [q, setQ] = useState('');
  const [searchResults, setSearchResults] = useState({});
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const { unreadCount } = useNotifications();

  // Debounced search
  useEffect(() => {
    if (!q || q.length < 2) { setSearchResults({}); setShowSearch(false); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setShowSearch(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(q)}`);
        setSearchResults(data);
      } catch { /* ignore */ } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  // Close panels on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchNavigate = (path) => {
    setShowSearch(false);
    setQ('');
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-canvas">
      <TermsModal />
      <aside className="hidden lg:flex fixed inset-y-0 right-0 w-72 z-30">
        <SidebarContent />
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-72">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pr-72 flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-ink-100">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden h-9 w-9 rounded-lg bg-ink-50 text-ink flex items-center justify-center"
              aria-label="פתח תפריט"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-md relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  className="input pr-10 !py-2 bg-ink-50/60 border-transparent"
                  placeholder="חיפוש בקהילה…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => q.length >= 2 && setShowSearch(true)}
                />
              </div>
              {showSearch && (
                <SearchDropdown
                  q={q}
                  results={searchResults}
                  loading={searchLoading}
                  onNavigate={handleSearchNavigate}
                />
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotif((s) => !s)}
                className="h-9 w-9 rounded-lg bg-ink-50 text-ink-500 hover:text-ink flex items-center justify-center relative"
                aria-label="התראות"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} />}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
