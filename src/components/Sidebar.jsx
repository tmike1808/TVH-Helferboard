
import {
  LayoutDashboard,
  Calendar,
  Users,
  Shield,
  ClipboardList,
  LogOut
} from 'lucide-react'

export default function Sidebar({
  activePage = 'dashboard',
  isAdmin = false,
  authLoading = false,
  onNavigate,
  onLogout
}) {

  return (
    <aside className="bg-slate-950 text-white p-6">

      <div className="flex items-center gap-4 mb-10">

        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center font-black">
          TVH
        </div>

        <div>
          <div className="text-2xl font-black">
            TV Homburg
          </div>

          <div className="text-slate-400">
            CORE MERGE
          </div>
        </div>

      </div>

      <nav className="space-y-2">

        <NavItem
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
          active={activePage === 'dashboard'}
          onClick={() => onNavigate?.('dashboard')}
        />

        <NavItem
          icon={<Calendar size={18} />}
          label="Kalender"
          disabled
        />

        <NavItem
          icon={<Users size={18} />}
          label="Helfer"
          disabled
        />

        <div className="pt-6 mt-6 border-t border-white/10 text-xs uppercase text-slate-500 font-bold">
          Administration
        </div>

        <NavItem
          icon={<Shield size={18} />}
          label="Teams"
          disabled
        />

        <NavItem
          icon={<ClipboardList size={18} />}
          label="Spiele verwalten"
          active={activePage === 'admin-games'}
          onClick={() => onNavigate?.('admin-games')}
        />

        <NavItem
          icon={<Calendar size={18} />}
          label="Kalenderimport"
          disabled
        />

      </nav>

      {isAdmin && (
        <div className="mt-8 border-t border-white/10 pt-6">
          <NavItem
            icon={<LogOut size={18} />}
            label={authLoading ? 'Abmeldung läuft …' : 'Abmelden'}
            disabled={authLoading}
            onClick={onLogout}
          />
        </div>
      )}

    </aside>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
  disabled = false
}) {

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      className={
        "w-full h-12 rounded-2xl px-4 flex items-center gap-3 " +
        (active
          ? "bg-emerald-600"
          : disabled
            ? "text-slate-600 cursor-not-allowed"
            : "hover:bg-white/10")
      }
    >
      {icon}
      {label}
    </button>
  )
}
