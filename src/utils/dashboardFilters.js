import {
  getMatchdayIdByGameId,
  pruneSelectedMatchdayIds
} from './matchdays.js'
import { getRoleStaffingStatus } from './staffingStatus.js'

export const ALL_CATEGORIES = 'all'

const ROLE_PRIORITY_BY_CATEGORY = Object.freeze({
  Aktive: Object.freeze([
    'zeitnehmer',
    'sekretär',
    'wischer',
    'ordner',
    'verkauf'
  ]),
  Jugend: Object.freeze([
    'zeitnehmer',
    'sekretär',
    'schiri',
    'verkauf',
    'kuchen',
    'brezeln / sonstiges',
    'trikots'
  ]),
  [ALL_CATEGORIES]: Object.freeze([
    'zeitnehmer',
    'sekretär',
    'schiri',
    'wischer',
    'ordner',
    'verkauf',
    'kuchen',
    'brezeln / sonstiges',
    'trikots'
  ])
})

export const INITIAL_DASHBOARD_FILTERS = Object.freeze({
  selectedCategory: ALL_CATEGORIES,
  selectedTeamIds: [],
  selectedMatchdayIds: [],
  selectedRoleNames: [],
  openSelectedRolesOnly: false
})

export function normalizeRoleName(name) {
  return typeof name === 'string'
    ? name.trim().toLocaleLowerCase('de-DE')
    : ''
}

export function getAvailableTeams(teams, selectedCategory) {
  return (Array.isArray(teams) ? teams : [])
    .filter(team => (
      selectedCategory === ALL_CATEGORIES
      || team?.category === selectedCategory
    ))
    .slice()
    .sort((first, second) => (
      (first?.name ?? '').localeCompare(second?.name ?? '', 'de-DE', {
        numeric: true,
        sensitivity: 'base'
      })
    ))
}

export function pruneSelectedTeamIds(selectedTeamIds, availableTeams) {
  const availableIds = new Set(
    getTeamIds(availableTeams)
  )

  return uniqueStrings(selectedTeamIds)
    .filter(id => availableIds.has(id))
}

export function getAvailableRoleOptions(roles, selectedCategory) {
  const optionsByName = new Map()

  for (const role of Array.isArray(roles) ? roles : []) {
    if (
      selectedCategory !== ALL_CATEGORIES
      && role?.category !== selectedCategory
    ) {
      continue
    }

    const value = normalizeRoleName(role?.name)

    if (!value || optionsByName.has(value)) {
      continue
    }

    optionsByName.set(value, {
      value,
      label: role.name.trim()
    })
  }

  return [...optionsByName.values()].sort((first, second) => (
    compareRoleOptions(first, second, selectedCategory)
  ))
}

export function pruneSelectedRoleNames(selectedRoleNames, availableRoles) {
  const availableNames = new Set(
    (Array.isArray(availableRoles) ? availableRoles : [])
      .map(role => typeof role === 'string' ? normalizeRoleName(role) : role?.value)
      .filter(Boolean)
  )

  return uniqueStrings(
    (Array.isArray(selectedRoleNames) ? selectedRoleNames : [])
      .map(normalizeRoleName)
  )
    .filter(name => availableNames.has(name))
}

export function resolveSelectedRolesForCategory(
  roles,
  category,
  selectedRoleNames
) {
  const selectedNames = new Set(
    uniqueStrings(
      (Array.isArray(selectedRoleNames) ? selectedRoleNames : [])
        .map(normalizeRoleName)
    )
  )

  return (Array.isArray(roles) ? roles : []).filter(role => (
    role?.category === category
    && selectedNames.has(normalizeRoleName(role?.name))
  ))
}

export function countRoleAssignments(assignments, gameId, roleId) {
  return (Array.isArray(assignments) ? assignments : []).filter(
    assignment => (
      assignment?.game_id === gameId
      && assignment?.role_id === roleId
    )
  ).length
}

export function isRoleOpen(role, assignmentCount) {
  return getRoleStaffingStatus(role, assignmentCount).openSlots > 0
}

export function filterDashboardGames({
  games,
  teams,
  roles,
  assignments,
  selectedCategory = ALL_CATEGORIES,
  selectedTeamIds = [],
  selectedMatchdayIds = [],
  selectedRoleNames = [],
  openSelectedRolesOnly = false
}) {
  const teamsById = new Map(
    (Array.isArray(teams) ? teams : []).map(team => [team.id, team])
  )
  const teamIds = new Set(uniqueStrings(selectedTeamIds))
  const matchdayIds = new Set(uniqueStrings(selectedMatchdayIds))
  const matchdayIdByGameId = matchdayIds.size > 0
    ? getMatchdayIdByGameId(games)
    : null
  const roleNames = uniqueStrings(
    (Array.isArray(selectedRoleNames) ? selectedRoleNames : [])
      .map(normalizeRoleName)
  )
  const hasTeamFilter = teamIds.size > 0
  const hasMatchdayFilter = matchdayIds.size > 0
  const hasRoleFilter = roleNames.length > 0

  return (Array.isArray(games) ? games : [])
    .filter(game => {
      const team = teamsById.get(game?.team_id)

      if (!team) {
        return false
      }

      if (
        selectedCategory !== ALL_CATEGORIES
        && team.category !== selectedCategory
      ) {
        return false
      }

      if (hasTeamFilter && !teamIds.has(String(team.id))) {
        return false
      }

      if (
        hasMatchdayFilter
        && !matchdayIds.has(matchdayIdByGameId.get(String(game.id)))
      ) {
        return false
      }

      if (!hasRoleFilter) {
        return true
      }

      const matchingRoles = resolveSelectedRolesForCategory(
        roles,
        team.category,
        roleNames
      )

      if (matchingRoles.length === 0) {
        return false
      }

      if (!openSelectedRolesOnly) {
        return true
      }

      return matchingRoles.some(role => isRoleOpen(
        role,
        countRoleAssignments(assignments, game.id, role.id)
      ))
    })
    .sort(compareGamesByStartTime)
}

export function calculateDashboardKpis({
  games,
  teams,
  roles,
  assignments
}) {
  const visibleGames = Array.isArray(games) ? games : []
  const visibleGameIds = new Set(visibleGames.map(game => game.id))
  const visibleAssignments = (Array.isArray(assignments) ? assignments : [])
    .filter(assignment => visibleGameIds.has(assignment.game_id))
  const teamsById = new Map(
    (Array.isArray(teams) ? teams : []).map(team => [team.id, team])
  )
  const openTasks = visibleGames.reduce((total, game) => {
    const category = teamsById.get(game.team_id)?.category
    const gameRoles = (Array.isArray(roles) ? roles : [])
      .filter(role => role?.category === category)
    const gameOpenSlots = gameRoles.reduce((roleTotal, role) => (
      roleTotal + getRoleStaffingStatus(
        role,
        countRoleAssignments(visibleAssignments, game.id, role.id)
      ).openSlots
    ), 0)

    return total + gameOpenSlots
  }, 0)

  return {
    homeGames: visibleGames.filter(game => game.is_home).length,
    openTasks,
    assignmentCount: visibleAssignments.length,
    teamCount: new Set(visibleGames.map(game => game.team_id)).size
  }
}

export function resetDashboardFilters() {
  return {
    selectedCategory: ALL_CATEGORIES,
    selectedTeamIds: [],
    selectedMatchdayIds: [],
    selectedRoleNames: [],
    openSelectedRolesOnly: false
  }
}

export function reconcileDashboardFilters(filters, teams, roles, games = []) {
  const selectedCategory = filters?.selectedCategory ?? ALL_CATEGORIES
  const availableTeams = getAvailableTeams(teams, selectedCategory)
  const availableRoles = getAvailableRoleOptions(roles, selectedCategory)
  const selectedTeamIds = pruneSelectedTeamIds(
    filters?.selectedTeamIds ?? [],
    availableTeams
  )
  const selectedRoleNames = pruneSelectedRoleNames(
    filters?.selectedRoleNames ?? [],
    availableRoles
  )
  const selectedMatchdayIds = pruneSelectedMatchdayIds(
    filters?.selectedMatchdayIds ?? [],
    games
  )

  return {
    selectedCategory,
    selectedTeamIds,
    selectedMatchdayIds,
    selectedRoleNames,
    openSelectedRolesOnly:
      selectedRoleNames.length > 0
      && Boolean(filters?.openSelectedRolesOnly)
  }
}

function getTeamIds(teams) {
  return (Array.isArray(teams) ? teams : [])
    .map(team => team?.id)
    .filter(id => typeof id === 'string' && id.trim())
    .map(id => id.trim())
}

function uniqueStrings(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .filter(value => typeof value === 'string' && value.trim())
      .map(value => value.trim())
  )]
}

function compareGamesByStartTime(firstGame, secondGame) {
  const firstStart = new Date(firstGame?.start_time).getTime()
  const secondStart = new Date(secondGame?.start_time).getTime()

  if (Number.isNaN(firstStart) && Number.isNaN(secondStart)) return 0
  if (Number.isNaN(firstStart)) return 1
  if (Number.isNaN(secondStart)) return -1
  return firstStart - secondStart
}

function compareRoleOptions(first, second, selectedCategory) {
  const priority = ROLE_PRIORITY_BY_CATEGORY[selectedCategory]
    ?? ROLE_PRIORITY_BY_CATEGORY[ALL_CATEGORIES]
  const firstPriority = priority.indexOf(first.value)
  const secondPriority = priority.indexOf(second.value)
  const firstIsKnown = firstPriority >= 0
  const secondIsKnown = secondPriority >= 0

  if (firstIsKnown && secondIsKnown) {
    return firstPriority - secondPriority
  }

  if (firstIsKnown) return -1
  if (secondIsKnown) return 1

  return first.label.localeCompare(second.label, 'de-DE', {
    numeric: true,
    sensitivity: 'base'
  })
}
