
import { useDashboardStore } from '../store/useDashboardStore'

export default function KPISection() {

  const {
    teams,
    roles,
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

  const requiredSlotsByCategory = roles.reduce((slotsByCategory, role) => {
    const slots = Number(role.slots)

    if (!Number.isFinite(slots) || slots <= 0) {
      return slotsByCategory
    }

    slotsByCategory.set(
      role.category,
      (slotsByCategory.get(role.category) ?? 0) + slots
    )

    return slotsByCategory
  }, new Map())

  const assignmentsByGame = filteredAssignments.reduce(
    (countsByGame, assignment) => {
      countsByGame.set(
        assignment.game_id,
        (countsByGame.get(assignment.game_id) ?? 0) + 1
      )

      return countsByGame
    },
    new Map()
  )

  const openTasks = games.reduce((total, game) => {
    const team = teams.find(team => team.id === game.team_id)
    const requiredSlots = requiredSlotsByCategory.get(team?.category) ?? 0
    const filledSlots = assignmentsByGame.get(game.id) ?? 0

    return total + Math.max(requiredSlots - filledSlots, 0)
  }, 0)

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
