
import { useEffect, useState } from 'react'
import { useDashboardStore } from './store/useDashboardStore'
import { createMatchdayGroups } from './utils/matchdays'

import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import KPISection from './components/KPISection'
import FilterBar from './components/FilterBar'
import MatchdayCalendar from './components/MatchdayCalendar'
import MatchCard from './components/MatchCard'
import AdminGameImportPage from './pages/AdminGameImportPage'
import AdminGamesPage from './pages/AdminGamesPage'
import AdminLoginPage from './pages/AdminLoginPage'
import { useAdminAuth } from './hooks/useAdminAuth'

export default function App() {

  const [activePage, setActivePage] = useState('dashboard')
  const {
    isAdmin,
    loading: authLoading,
    error: authError,
    login,
    logout
  } = useAdminAuth()

  const {
    games,
    showPastGames,
    selectedMatchdayIds,
    loadData,
    getFilteredGames
  } = useDashboardStore()

  useEffect(() => {
    if (activePage !== 'dashboard') {
      return
    }

    loadData().catch(error => {
      console.error('Dashboard-Daten konnten nicht geladen werden.', error)
    })
  }, [activePage, loadData])

  const filteredGames = getFilteredGames()
  const matchdayGroups = createMatchdayGroups(filteredGames, games)

  function navigate(page) {
    setActivePage(page)
  }

  async function handleLogout() {
    setActivePage('dashboard')
    await logout()
  }

  function renderAdminPage() {
    if (authLoading) {
      return (
        <section>
          <Topbar
            title="Adminbereich"
            subtitle="Berechtigung wird geprüft"
          />
          <div
            className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm"
            role="status"
          >
            Adminzugriff wird geprüft …
          </div>
        </section>
      )
    }

    if (!isAdmin) {
      return (
        <AdminLoginPage
          loading={authLoading}
          authError={authError}
          onLogin={login}
          onBack={() => navigate('dashboard')}
        />
      )
    }

    return activePage === 'admin-game-import'
      ? <AdminGameImportPage />
      : <AdminGamesPage />
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">

      <Sidebar
        activePage={activePage}
        isAdmin={isAdmin}
        authLoading={authLoading}
        onNavigate={navigate}
        onLogout={handleLogout}
      />

      <main className="w-full min-w-0 max-w-full p-3 sm:p-6 lg:p-7">

        {['admin-games', 'admin-game-import'].includes(activePage) ? (
          renderAdminPage()
        ) : (
          <>
            <Topbar />

            <KPISection />

            <FilterBar />

            <MatchdayCalendar />

            <div className="space-y-8">
              {filteredGames.length > 0 ? (
                matchdayGroups.map(group => (
                  <section
                    key={group.id}
                    aria-labelledby={`matchday-${group.id}`}
                    className="min-w-0"
                  >
                    <div className="mb-4 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 border-l-4 border-[#8B1E2D] pl-3">
                      <h2
                        id={`matchday-${group.id}`}
                        className="text-lg font-black text-slate-900 sm:text-xl"
                      >
                        Spieltag {group.label}
                      </h2>
                      <span className="text-sm font-semibold text-slate-500">
                        {group.games.length}{' '}
                        {group.games.length === 1 ? 'Spiel' : 'Spiele'}
                      </span>
                    </div>

                    <div className="space-y-5">
                      {group.games.map(game => (
                        <MatchCard
                          key={game.id}
                          game={game}
                        />
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div
                  className="rounded-3xl border border-slate-200 bg-white p-8 text-center font-bold text-slate-600 shadow-sm"
                  role="status"
                >
                  {selectedMatchdayIds.length === 0 && !showPastGames
                    ? 'Keine aktuellen oder kommenden Spiele entsprechen den ausgewählten Filtern.'
                    : 'Keine Spiele entsprechen den ausgewählten Filtern.'}
                </div>
              )}
            </div>
          </>
        )}

      </main>

    </div>
  )
}
