
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

    const { data: games = [] } =
      await supabase.from('games').select('*')

    const { data: teams = [] } =
      await supabase.from('teams').select('*')

    const { data: roles = [] } =
      await supabase.from('helper_roles').select('*')

    const { data: assignments = [] } =
      await supabase.from('helper_assignments').select('*')

    set({
      games,
      teams,
      roles,
      assignments
    })
  },

  reloadAssignments: async () => {

    const { data: assignments = [] } =
      await supabase.from('helper_assignments').select('*')

    set({ assignments })
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
    })
  }

}))
