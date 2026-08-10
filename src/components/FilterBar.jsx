
import { useDashboardStore } from '../store/useDashboardStore'

export default function FilterBar() {

  const {
    teams,
    selectedTeam,
    selectedCategory,
    setSelectedTeam,
    setSelectedCategory
  } = useDashboardStore()

  return (
    <div className="mb-6 flex min-w-0 flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:gap-4 sm:p-5">

      <select
        value={selectedTeam}
        onChange={(e) => setSelectedTeam(e.target.value)}
        aria-label="Mannschaft filtern"
        className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 sm:flex-1"
      >

        <option value="all">
          Alle Mannschaften
        </option>

        {teams.map(team => (
          <option
            key={team.id}
            value={team.id}
          >
            {team.name}
          </option>
        ))}

      </select>

      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        aria-label="Kategorie filtern"
        className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 sm:flex-1"
      >

        <option value="all">
          Alle Kategorien
        </option>

        <option value="Aktive">
          Aktive
        </option>

        <option value="Jugend">
          Jugend
        </option>

      </select>

    </div>
  )
}
