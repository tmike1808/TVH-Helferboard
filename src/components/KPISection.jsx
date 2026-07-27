
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
