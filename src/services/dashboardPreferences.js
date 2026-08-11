import {
  ALL_CATEGORIES,
  normalizeRoleName,
  reconcileDashboardFilters,
  resetDashboardFilters
} from '../utils/dashboardFilters.js'

export const DASHBOARD_PREFERENCES_KEY = 'tvh-dashboard-preferences-v1'
export const DASHBOARD_PREFERENCES_VERSION = 1

const VALID_CATEGORIES = new Set([
  ALL_CATEGORIES,
  'Aktive',
  'Jugend'
])

export function createDashboardPreferences(filters) {
  const roleNames = uniqueStrings(
    (Array.isArray(filters?.selectedRoleNames)
      ? filters.selectedRoleNames
      : [])
      .map(normalizeRoleName)
  )

  return {
    version: DASHBOARD_PREFERENCES_VERSION,
    category: VALID_CATEGORIES.has(filters?.selectedCategory)
      ? filters.selectedCategory
      : ALL_CATEGORIES,
    teamIds: uniqueStrings(filters?.selectedTeamIds),
    roleNames,
    showOnlyOpenRoles:
      roleNames.length > 0
      && Boolean(filters?.openSelectedRolesOnly)
  }
}

export function sanitizeDashboardPreferences(value) {
  if (
    !value
    || typeof value !== 'object'
    || Array.isArray(value)
    || value.version !== DASHBOARD_PREFERENCES_VERSION
    || !VALID_CATEGORIES.has(value.category)
    || !Array.isArray(value.teamIds)
    || !Array.isArray(value.roleNames)
    || typeof value.showOnlyOpenRoles !== 'boolean'
  ) {
    return null
  }

  return createDashboardPreferences({
    selectedCategory: value.category,
    selectedTeamIds: value.teamIds,
    selectedRoleNames: value.roleNames,
    openSelectedRolesOnly: value.showOnlyOpenRoles
  })
}

export function readDashboardPreferences(storage = getBrowserStorage()) {
  if (!storage) {
    return { status: 'unavailable', preferences: null }
  }

  let serialized

  try {
    serialized = storage.getItem(DASHBOARD_PREFERENCES_KEY)
  } catch {
    return { status: 'read-failed', preferences: null }
  }

  if (serialized === null) {
    return { status: 'missing', preferences: null }
  }

  try {
    const preferences = sanitizeDashboardPreferences(JSON.parse(serialized))

    return preferences
      ? { status: 'valid', preferences }
      : { status: 'invalid', preferences: null }
  } catch {
    return { status: 'invalid', preferences: null }
  }
}

export function saveDashboardPreferences(
  filters,
  storage = getBrowserStorage()
) {
  if (!storage) {
    return { ok: false, error: 'storage-unavailable' }
  }

  const preferences = createDashboardPreferences(filters)

  try {
    storage.setItem(
      DASHBOARD_PREFERENCES_KEY,
      JSON.stringify(preferences)
    )
    return { ok: true, preferences }
  } catch {
    return { ok: false, error: 'write-failed' }
  }
}

export function deleteDashboardPreferences(storage = getBrowserStorage()) {
  if (!storage) {
    return { ok: false, error: 'storage-unavailable' }
  }

  try {
    storage.removeItem(DASHBOARD_PREFERENCES_KEY)
    return { ok: true }
  } catch {
    return { ok: false, error: 'delete-failed' }
  }
}

export function resolveDashboardPreferences(
  preferences,
  teams,
  roles,
  games = []
) {
  if (!preferences) {
    return resetDashboardFilters()
  }

  return reconcileDashboardFilters({
    ...resetDashboardFilters(),
    selectedCategory: preferences.category,
    selectedTeamIds: preferences.teamIds,
    selectedRoleNames: preferences.roleNames,
    openSelectedRolesOnly: preferences.showOnlyOpenRoles,
    showPastGames: false,
    selectedMatchdayIds: []
  }, teams, roles, games)
}

function getBrowserStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function uniqueStrings(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .filter(value => typeof value === 'string' && value.trim())
      .map(value => value.trim())
  )]
}
