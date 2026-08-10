
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Shield,
  ClipboardList,
  LogOut,
  Menu,
  X
} from 'lucide-react'

export default function Sidebar({
  activePage = 'dashboard',
  isAdmin = false,
  authLoading = false,
  onNavigate,
  onLogout
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [activePage])

  function navigate(page) {
    setMenuOpen(false)
    onNavigate?.(page)
  }

  async function logout() {
    setMenuOpen(false)
    await onLogout?.()
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex min-w-0 items-center justify-between gap-3 bg-slate-950 px-4 py-3 text-white shadow-lg lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Navigation öffnen"
          aria-expanded={menuOpen}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/15"
        >
          <Menu size={24} aria-hidden="true" />
        </button>

        <div className="flex min-w-0 items-center gap-2 text-right">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#8B1E2D]">
            <img
              src="/tvh-logo.png"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-black">TVH</div>
            <div className="text-xs font-bold tracking-wide text-[#A1A1AA]">
              Dashboard
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="Navigation schließen"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}

      <aside
        aria-label="Hauptnavigation"
        className={
          'fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-3rem))] '
          + 'max-w-full flex-col overflow-y-auto bg-slate-950 p-5 text-white '
          + 'shadow-2xl transition-transform duration-200 lg:static lg:z-auto '
          + 'lg:w-auto lg:translate-x-0 lg:p-6 lg:shadow-none '
          + (menuOpen ? 'translate-x-0' : '-translate-x-full')
        }
      >

      <div className="mb-8 flex min-w-0 items-center gap-3 lg:mb-10 lg:gap-4">

        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#8B1E2D]">
          <img
            src="/tvh-logo.png"
            alt="TVH Logo"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="break-words text-xl font-black lg:text-2xl">
            TVH
          </div>

          <div className="text-[#A1A1AA]">
            Dashboard
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="Navigation schließen"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 lg:hidden"
        >
          <X size={24} aria-hidden="true" />
        </button>

      </div>

      <nav className="space-y-2">

        <NavItem
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
          active={activePage === 'dashboard'}
          onClick={() => navigate('dashboard')}
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
          onClick={() => navigate('admin-games')}
        />

        <NavItem
          icon={<Calendar size={18} />}
          label="Spielimport"
          active={activePage === 'admin-game-import'}
          onClick={() => navigate('admin-game-import')}
        />

      </nav>

      {isAdmin && (
        <div className="mt-auto border-t border-white/10 pt-6 lg:mt-8">
          <NavItem
            icon={<LogOut size={18} />}
            label={authLoading ? 'Abmeldung läuft …' : 'Abmelden'}
            disabled={authLoading}
            onClick={logout}
          />
        </div>
      )}

      </aside>
    </>
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
        "flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left " +
        (active
          ? "bg-[#8B1E2D]"
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
