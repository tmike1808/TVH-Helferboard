
import { useEffect } from 'react'
import { useDashboardStore } from './store/useDashboardStore'

import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import KPISection from './components/KPISection'
import FilterBar from './components/FilterBar'
import MatchCard from './components/MatchCard'

export default function App() {

  const {
    loadData,
    getFilteredGames
  } = useDashboardStore()

  useEffect(() => {
    loadData()
  }, [])

  const filteredGames = getFilteredGames()

  return (
    <div className="min-h-screen grid grid-cols-[280px_1fr]">

      <Sidebar />

      <main className="p-7">

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

      </main>

    </div>
  )
}
