
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useDashboardStore = create((set, get) => ({

  games: [],
  teams: [],
  roles: [],
  assignments: [],

  selectedTeam: 'all',
  selectedCategory: 'all',

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

    set({
      games: gamesError ? currentState.games : games ?? [],
      teams: teamsError ? currentState.teams : teams ?? [],
      roles: rolesError ? currentState.roles : roles ?? [],
      assignments: assignmentsError
        ? currentState.assignments
        : assignments ?? []
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

  setSelectedTeam: (team) =>
    set({ selectedTeam: team }),

  setSelectedCategory: (category) =>
    set({ selectedCategory: category }),

  getFilteredGames: () => {

    const {
      games,
      teams,
      selectedTeam,
      selectedCategory
    } = get()

    return games.filter(game => {

      const team = teams.find(
        t => t.id === game.team_id
      )

      const teamMatch =
        selectedTeam === 'all'
        || team?.id === selectedTeam

      const categoryMatch =
        selectedCategory === 'all'
        || team?.category === selectedCategory

      return teamMatch && categoryMatch
    }).sort((firstGame, secondGame) => {
      const firstStart = new Date(firstGame.start_time).getTime()
      const secondStart = new Date(secondGame.start_time).getTime()

      if (Number.isNaN(firstStart) && Number.isNaN(secondStart)) return 0
      if (Number.isNaN(firstStart)) return 1
      if (Number.isNaN(secondStart)) return -1
      return firstStart - secondStart
    })
  }

}))
