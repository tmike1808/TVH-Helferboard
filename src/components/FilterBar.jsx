
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
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex gap-4 mb-6">

      <select
        value={selectedTeam}
        onChange={(e) => setSelectedTeam(e.target.value)}
        className="h-12 px-4 rounded-2xl border border-slate-200 bg-slate-50"
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
        className="h-12 px-4 rounded-2xl border border-slate-200 bg-slate-50"
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
