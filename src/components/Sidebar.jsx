
import {
  LayoutDashboard,
  Calendar,
  Users,
  Shield,
  ClipboardList
} from 'lucide-react'

export default function Sidebar() {

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
          active
        />

        <NavItem
          icon={<Calendar size={18} />}
          label="Kalender"
        />

        <NavItem
          icon={<Users size={18} />}
          label="Helfer"
        />

        <div className="pt-6 mt-6 border-t border-white/10 text-xs uppercase text-slate-500 font-bold">
          Administration
        </div>

        <NavItem
          icon={<Shield size={18} />}
          label="Teams"
        />

        <NavItem
          icon={<ClipboardList size={18} />}
          label="Spiele"
        />

        <NavItem
          icon={<Calendar size={18} />}
          label="Kalenderimport"
        />

      </nav>

    </aside>
  )
}

function NavItem({ icon, label, active }) {

  return (
    <button
      className={
        "w-full h-12 rounded-2xl px-4 flex items-center gap-3 " +
        (active
          ? "bg-emerald-600"
          : "hover:bg-white/10")
      }
    >
      {icon}
      {label}
    </button>
  )
}
