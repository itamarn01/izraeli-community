import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Briefcase, MessagesSquare, Gift,
  LogOut, Menu, ShieldCheck, Send, UserCircle2,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import Logo from '../common/Logo.jsx';

const NAV = [
  { to: '/admin', label: 'דשבורד', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'משתמשים', icon: Users },
  { to: '/admin/organizations', label: 'ארגונים', icon: Building2 },
  { to: '/admin/jobs', label: 'דרושים', icon: Briefcase },
  { to: '/admin/posts', label: 'פיד', icon: MessagesSquare },
  { to: '/admin/benefits', label: 'הטבות', icon: Gift },
  { to: '/admin/benefit-suggestions', label: 'הצעות הטבות', icon: Send },
  { to: '/admin/profile', label: 'פרופיל', icon: UserCircle2 },
];

function SidebarContent({ onNavigate }) {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Logo size={36} variant="light" />
          <div className="brand-display text-base">מערכת ניהול</div>
        </div>
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
          {admin?.avatarUrl ? (
            <img src={admin.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center font-bold text-white shrink-0">
              {(admin?.fullName?.[0] || admin?.username?.[0] || '?').toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{admin?.fullName || admin?.username}</div>
            <div className="text-[11px] text-white/50 truncate" dir="ltr">{admin?.email}</div>
          </div>
          <button onClick={handleLogout} className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white" title="התנתקות">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
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
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <ShieldCheck className="h-4 w-4 text-accent" />
              מצב ניהול
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
