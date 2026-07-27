
import { useDashboardStore } from '../store/useDashboardStore'

export default function KPISection() {

  const {
    teams,
    assignments,
    selectedTeam,
    getFilteredGames
  } = useDashboardStore()

  const games = getFilteredGames()

  const filteredGameIds = games.map(g => g.id)

  const filteredAssignments = assignments.filter(
    a => filteredGameIds.includes(a.game_id)
  )

  const homeGames =
    games.filter(g => g.is_home).length

  const openTasks =
    Math.max((games.length * 10) - filteredAssignments.length, 0)

  const visibleTeams =
    selectedTeam === 'all'
      ? teams.length
      : 1

  const cards = [
    ['Heimspiele', homeGames],
    ['Offene Dienste', openTasks],
    ['Helfereinträge', filteredAssignments.length],
    ['Mannschaften', visibleTeams]
  ]

  return (
    <div className="grid grid-cols-4 gap-5 mb-6">

      {cards.map(([title, value]) => (
        <div
          key={title}
          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm"
        >

          <div className="text-sm uppercase font-bold text-slate-500">
            {title}
          </div>

          <div className="text-5xl font-black mt-3">
            {value}
          </div>

        </div>
      ))}

    </div>
  )
}
