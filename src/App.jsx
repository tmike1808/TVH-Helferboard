
import { useEffect, useState } from 'react'
import { useDashboardStore } from './store/useDashboardStore'

import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import KPISection from './components/KPISection'
import FilterBar from './components/FilterBar'
import MatchCard from './components/MatchCard'
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

    return <AdminGamesPage />
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">

      <Sidebar
        activePage={activePage}
        isAdmin={isAdmin}
        authLoading={authLoading}
        onNavigate={navigate}
        onLogout={handleLogout}
      />

      <main className="min-w-0 p-4 sm:p-6 lg:p-7">

        {activePage === 'admin-games' ? (
          renderAdminPage()
        ) : (
          <>
            <Topbar />

            <KPISection />

            <FilterBar />

            <div className="space-y-5">

              {filteredGames.map(game => (
                <MatchCard
                  key={game.id}
                  game={game}
                />
              ))}

            </div>
          </>
        )}

      </main>

    </div>
  )
}
