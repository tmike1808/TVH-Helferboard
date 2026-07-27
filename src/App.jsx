
import { useEffect, useState } from 'react'
import { useDashboardStore } from './store/useDashboardStore'

import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import KPISection from './components/KPISection'
import FilterBar from './components/FilterBar'
import MatchCard from './components/MatchCard'
import AdminGamesPage from './pages/AdminGamesPage'

export default function App() {

  const [activePage, setActivePage] = useState('dashboard')

  const {
    loadData,
    getFilteredGames
  } = useDashboardStore()

  useEffect(() => {
    loadData().catch(error => {
      console.error('Dashboard-Daten konnten nicht geladen werden.', error)
    })
  }, [loadData])

  const filteredGames = getFilteredGames()

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <main className="min-w-0 p-4 sm:p-6 lg:p-7">

        {activePage === 'admin-games' ? (
          <AdminGamesPage />
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
