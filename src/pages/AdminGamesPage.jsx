import { useEffect, useState } from 'react'
import Topbar from '../components/Topbar'
import GameTable from '../components/admin/GameTable'
import { getGames } from '../services/gameService'

export default function AdminGamesPage() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadGames() {
      try {
        const loadedGames = await getGames()

        if (!cancelled) {
          setGames(loadedGames)
        }
      } catch (loadError) {
        console.error('Spiele konnten nicht geladen werden.', loadError)

        if (!cancelled) {
          setError(
            'Die Spiele konnten nicht geladen werden. Bitte versuchen Sie es später erneut.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadGames()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section>
      <Topbar
        title="Spiele verwalten"
        subtitle="Übersicht aller vorhandenen Spiele"
      />

      {loading && (
        <div
          className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm"
          role="status"
        >
          Spiele werden geladen …
        </div>
      )}

      {!loading && error && (
        <div
          className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-800 shadow-sm"
          role="alert"
        >
          <h2 className="text-lg font-black">
            Laden fehlgeschlagen
          </h2>
          <p className="mt-2">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">
            Keine Spiele vorhanden
          </h2>
          <p className="mt-2">
            Sobald Spiele in Supabase hinterlegt sind, erscheinen sie hier.
          </p>
        </div>
      )}

      {!loading && !error && games.length > 0 && (
        <GameTable games={games} />
      )}
    </section>
  )
}
