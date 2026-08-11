import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import {
  ALL_CATEGORIES,
  filterDashboardGames,
  getAvailableRoleOptions,
  getAvailableTeams,
  getRelevantMatchdayGroups,
  getRelevantMatchdayOptions,
  normalizeRoleName,
  reconcileDashboardFilters,
  resetDashboardFilters
} from '../utils/dashboardFilters'
import { getCalendarSelection } from '../utils/matchdayCalendar'
import {
  createDashboardPreferences,
  deleteDashboardPreferences,
  readDashboardPreferences,
  resolveDashboardPreferences,
  saveDashboardPreferences
} from '../services/dashboardPreferences'

export const useDashboardStore = create((set, get) => ({
  games: [],
  teams: [],
  roles: [],
  assignments: [],
  preferencesHydrated: false,
  hasSavedPreferences: false,
  preferencesMessage: '',
  preferencesError: '',

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
    const nextGames = gamesError ? currentState.games : games ?? []
    const nextTeams = teamsError ? currentState.teams : teams ?? []
    const nextRoles = rolesError ? currentState.roles : roles ?? []
    const canHydratePreferences =
      !currentState.preferencesHydrated
      && !teamsError
      && !rolesError
    const storedPreferences = canHydratePreferences
      ? readDashboardPreferences()
      : null
    const reconciledFilters = canHydratePreferences
      ? resolveDashboardPreferences(
        storedPreferences.preferences,
        nextTeams,
        nextRoles,
        nextGames
      )
      : reconcileDashboardFilters(
        currentState,
        nextTeams,
        nextRoles,
        nextGames
      )

    if (storedPreferences?.status === 'valid') {
      const cleanedPreferences = createDashboardPreferences(reconciledFilters)

      if (
        JSON.stringify(cleanedPreferences)
        !== JSON.stringify(storedPreferences.preferences)
      ) {
        saveDashboardPreferences(reconciledFilters)
      }
    }

    set({
      games: nextGames,
      teams: nextTeams,
      roles: nextRoles,
      assignments: assignmentsError
        ? currentState.assignments
        : assignments ?? [],
      preferencesHydrated:
        currentState.preferencesHydrated || canHydratePreferences,
      hasSavedPreferences: canHydratePreferences
        ? storedPreferences.status === 'valid'
        : currentState.hasSavedPreferences,
      preferencesError:
        ['unavailable', 'read-failed'].includes(storedPreferences?.status)
          ? 'Die persönliche Ansicht konnte in diesem Browser nicht geladen werden.'
          : currentState.preferencesError,
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
      state.roles,
      state.games
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
      state.roles,
      state.games
    )
  }),

  clearSelectedTeams: () => set(state => reconcileDashboardFilters(
    { ...state, selectedTeamIds: [] },
    state.teams,
    state.roles,
    state.games
  )),

  setShowPastGames: enabled => set({ showPastGames: Boolean(enabled) }),

  toggleSelectedMatchday: (matchdayId, selected) => set(state => {
    const nextIds = new Set(state.selectedMatchdayIds)

    if (selected) {
      nextIds.add(String(matchdayId))
    } else {
      nextIds.delete(String(matchdayId))
    }

    return { selectedMatchdayIds: [...nextIds] }
  }),

  clearSelectedMatchdays: () => set({ selectedMatchdayIds: [] }),

  selectMatchdayFromCalendar: matchdayId => set(state => ({
    selectedMatchdayIds: getCalendarSelection(
      state.selectedMatchdayIds,
      matchdayId
    )
  })),

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

  saveCurrentDashboardPreferences: () => set(state => {
    const result = saveDashboardPreferences(state)

    return result.ok
      ? {
        hasSavedPreferences: true,
        preferencesMessage: 'Meine Ansicht wurde gespeichert.',
        preferencesError: ''
      }
      : {
        preferencesMessage: '',
        preferencesError:
          'Meine Ansicht konnte in diesem Browser nicht gespeichert werden.'
      }
  }),

  deleteCurrentDashboardPreferences: () => set(() => {
    const result = deleteDashboardPreferences()

    return result.ok
      ? {
        hasSavedPreferences: false,
        preferencesMessage: 'Meine gespeicherte Ansicht wurde gelöscht.',
        preferencesError: ''
      }
      : {
        preferencesMessage: '',
        preferencesError:
          'Meine gespeicherte Ansicht konnte nicht gelöscht werden.'
      }
  }),

  getAvailableTeams: () => {
    const { teams, selectedCategory } = get()
    return getAvailableTeams(teams, selectedCategory)
  },

  getAvailableRoleOptions: () => {
    const { roles, selectedCategory } = get()
    return getAvailableRoleOptions(roles, selectedCategory)
  },

  getAvailableMatchdayOptions: () => getRelevantMatchdayOptions(get()),

  getRelevantMatchdayGroups: () => getRelevantMatchdayGroups(get()),

  getFilteredGames: () => filterDashboardGames(get())
}))
