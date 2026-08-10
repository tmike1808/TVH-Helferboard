import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import {
  ALL_CATEGORIES,
  filterDashboardGames,
  getAvailableRoleOptions,
  getAvailableTeams,
  normalizeRoleName,
  reconcileDashboardFilters,
  resetDashboardFilters
} from '../utils/dashboardFilters'

export const useDashboardStore = create((set, get) => ({
  games: [],
  teams: [],
  roles: [],
  assignments: [],

  ...resetDashboardFilters(),

  loadData: async () => {
    const { data: games, error: gamesError } =
      await supabase.from('games').select('*')
    const { data: teams, error: teamsError } =
      await supabase.from('teams').select('*')
    const { data: roles, error: rolesError } =
      await supabase.from('helper_roles').select('*')
    const { data: assignments, error: assignmentsError } =
      await supabase.from('helper_assignments').select('*')

    const currentState = get()
    const nextTeams = teamsError ? currentState.teams : teams ?? []
    const nextRoles = rolesError ? currentState.roles : roles ?? []
    const reconciledFilters = reconcileDashboardFilters(
      currentState,
      nextTeams,
      nextRoles
    )

    set({
      games: gamesError ? currentState.games : games ?? [],
      teams: nextTeams,
      roles: nextRoles,
      assignments: assignmentsError
        ? currentState.assignments
        : assignments ?? [],
      ...reconciledFilters
    })

    const errors = [
      gamesError,
      teamsError,
      rolesError,
      assignmentsError
    ].filter(Boolean)

    if (errors.length > 0) {
      console.error(
        'Dashboard-Daten konnten nicht vollständig geladen werden.',
        errors
      )
    }
  },

  reloadAssignments: async () => {
    const { data: assignments, error } =
      await supabase.from('helper_assignments').select('*')

    if (error) {
      console.error('Helferzuordnungen konnten nicht geladen werden.', error)
      return
    }

    set({ assignments: assignments ?? [] })
  },

  setSelectedCategory: category => set(state => {
    const selectedCategory = ['Aktive', 'Jugend'].includes(category)
      ? category
      : ALL_CATEGORIES

    return reconcileDashboardFilters(
      { ...state, selectedCategory },
      state.teams,
      state.roles
    )
  }),

  toggleSelectedTeam: (teamId, selected) => set(state => {
    const nextIds = new Set(state.selectedTeamIds)

    if (selected) {
      nextIds.add(String(teamId))
    } else {
      nextIds.delete(String(teamId))
    }

    return reconcileDashboardFilters(
      { ...state, selectedTeamIds: [...nextIds] },
      state.teams,
      state.roles
    )
  }),

  clearSelectedTeams: () => set({ selectedTeamIds: [] }),

  toggleSelectedRole: (roleName, selected) => set(state => {
    const nextNames = new Set(state.selectedRoleNames)
    const normalizedName = normalizeRoleName(roleName)

    if (selected && normalizedName) {
      nextNames.add(normalizedName)
    } else {
      nextNames.delete(normalizedName)
    }

    const selectedRoleNames = [...nextNames]

    return {
      selectedRoleNames,
      openSelectedRolesOnly:
        selectedRoleNames.length > 0
        && state.openSelectedRolesOnly
    }
  }),

  clearSelectedRoles: () => set({
    selectedRoleNames: [],
    openSelectedRolesOnly: false
  }),

  setOpenSelectedRolesOnly: enabled => set(state => ({
    openSelectedRolesOnly:
      state.selectedRoleNames.length > 0
      && Boolean(enabled)
  })),

  resetFilters: () => set(resetDashboardFilters()),

  getAvailableTeams: () => {
    const { teams, selectedCategory } = get()
    return getAvailableTeams(teams, selectedCategory)
  },

  getAvailableRoleOptions: () => {
    const { roles, selectedCategory } = get()
    return getAvailableRoleOptions(roles, selectedCategory)
  },

  getFilteredGames: () => filterDashboardGames(get())
}))
