import {
  formatGameDate,
  formatGameTime,
  getBerlinDateKey
} from './formatDateTime.js'
import { normalizeRoleName } from './dashboardFilters.js'

const BASE_COLUMNS = [
  { key: 'date', header: 'Datum', width: 12 },
  { key: 'time', header: 'Zeit', width: 8 },
  { key: 'team', header: 'Heim', width: 14 },
  { key: 'opponent', header: 'Gegner', width: 32 }
]

const ROLE_COLUMNS = [
  { key: 'timekeeper', header: 'Zeitnehmer', roleName: 'Zeitnehmer', width: 20 },
  { key: 'secretary', header: 'Sekretär', roleName: 'Sekretär', width: 20 },
  { key: 'referee', header: 'Schiri', roleName: 'Schiri', width: 18 },
  { key: 'wiper', header: 'Wischer', roleName: 'Wischer', width: 18 },
  { key: 'steward', header: 'Ordner', roleName: 'Ordner', width: 18 },
  { key: 'sales', header: 'Verkauf', roleName: 'Verkauf', width: 22 },
  { key: 'cake', header: 'Kuchen', roleName: 'Kuchen', width: 20 },
  {
    key: 'pretzels',
    header: 'Brezeln / Sonstiges',
    roleName: 'Brezeln / Sonstiges',
    width: 24
  },
  { key: 'shirts', header: 'Trikots', roleName: 'Trikots', width: 18 }
]

export const DASHBOARD_EXPORT_COLUMNS = Object.freeze(
  [...BASE_COLUMNS, ...ROLE_COLUMNS].map(column => Object.freeze(column))
)

export function createDashboardExportModel({
  games,
  teams,
  roles,
  assignments
}) {
  const teamsById = new Map(
    asArray(teams).map(team => [team?.id, team])
  )
  const rolesByCategoryAndName = new Map(
    asArray(roles).map(role => [getRoleKey(role?.category, role?.name), role])
  )
  const assignmentsByGameAndRole = groupAssignments(assignments)
  const sortedGames = asArray(games).slice().sort(compareGamesByStartTime)

  const rows = sortedGames.map(game => {
    const team = teamsById.get(game?.team_id)
    const category = team?.category
    const roleValues = ROLE_COLUMNS.map(column => {
      const role = rolesByCategoryAndName.get(
        getRoleKey(category, column.roleName)
      )

      if (!role) {
        return '-'
      }

      return createRoleExportValue(
        role,
        assignmentsByGameAndRole.get(getAssignmentKey(game?.id, role.id)) ?? []
      )
    })

    return [
      formatGameDate(game?.start_time),
      formatExportTime(game?.start_time),
      team?.name?.trim() || '–',
      game?.opponent?.trim() || '–',
      ...roleValues
    ]
  })

  return {
    columns: DASHBOARD_EXPORT_COLUMNS,
    rows
  }
}

export function createRoleExportValue(role, assignments) {
  const slots = normalizeSlotCount(role?.slots)

  if (slots === 0) {
    return ''
  }

  const helperNames = asArray(assignments)
    .map((assignment, index) => ({ assignment, index }))
    .filter(({ assignment }) => (
      typeof assignment?.helper_name === 'string'
      && assignment.helper_name.trim()
    ))
    .sort(compareAssignments)
    .slice(0, slots)
    .map(({ assignment }) => assignment.helper_name.trim())

  return [
    ...helperNames,
    ...Array.from({ length: slots - helperNames.length }, () => 'FREI')
  ].join('\n')
}

export function createDashboardExportFilename(now = new Date()) {
  const date = getBerlinDateKey(now) ?? 'Datum-unbekannt'
  return `TVH_Helferplan_${date}.xlsx`
}

export function canExportDashboardGames(games) {
  return asArray(games).length > 0
}

function groupAssignments(assignments) {
  const groups = new Map()

  for (const assignment of asArray(assignments)) {
    const key = getAssignmentKey(assignment?.game_id, assignment?.role_id)
    const group = groups.get(key) ?? []
    group.push(assignment)
    groups.set(key, group)
  }

  return groups
}

function getRoleKey(category, roleName) {
  return `${category ?? ''}\u0000${normalizeRoleName(roleName)}`
}

function getAssignmentKey(gameId, roleId) {
  return `${gameId ?? ''}\u0000${roleId ?? ''}`
}

function normalizeSlotCount(value) {
  const slots = Number(value)
  return Number.isInteger(slots) && slots > 0 ? slots : 0
}

function formatExportTime(startTime) {
  return formatGameTime(startTime).replace(/\s+Uhr$/, '')
}

function compareAssignments(first, second) {
  const firstTime = getTimestamp(first.assignment?.created_at)
  const secondTime = getTimestamp(second.assignment?.created_at)

  if (firstTime !== secondTime) {
    return firstTime - secondTime
  }

  return first.index - second.index
}

function getTimestamp(value) {
  if (!value) {
    return Number.MAX_SAFE_INTEGER
  }

  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp
}

function compareGamesByStartTime(firstGame, secondGame) {
  const firstStart = getTimestamp(firstGame?.start_time)
  const secondStart = getTimestamp(secondGame?.start_time)

  if (firstStart !== secondStart) {
    return firstStart - secondStart
  }

  return String(firstGame?.id ?? '').localeCompare(
    String(secondGame?.id ?? ''),
    'de-DE',
    { numeric: true, sensitivity: 'base' }
  )
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}
