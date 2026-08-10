import { useDashboardStore } from '../store/useDashboardStore'
import { calculateDashboardKpis } from '../utils/dashboardFilters'

export default function KPISection() {
  const {
    teams,
    roles,
    assignments,
    getFilteredGames
  } = useDashboardStore()

  const games = getFilteredGames()
  const kpis = calculateDashboardKpis({
    games,
    teams,
    roles,
    assignments
  })
  const cards = [
    ['Heimspiele', kpis.homeGames],
    ['Offene Dienste', kpis.openTasks],
    ['Helfereinträge', kpis.assignmentCount],
    ['Mannschaften', kpis.teamCount]
  ]

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
      {cards.map(([title, value]) => (
        <div
          key={title}
          className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6"
        >
          <div className="break-words text-xs font-bold uppercase leading-5 text-slate-500 sm:text-sm">
            {title}
          </div>
          <div className="mt-2 break-words text-3xl font-black sm:text-4xl lg:mt-3 lg:text-5xl">
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}
