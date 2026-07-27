import { useEffect, useRef, useState } from 'react'
import Topbar from '../components/Topbar'
import GameTable from '../components/admin/GameTable'
import GameForm from '../components/admin/GameForm'
import {
  createGame,
  getGames,
  getTeams
} from '../services/gameService'

export default function AdminGamesPage() {
  const [games, setGames] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [refreshWarning, setRefreshWarning] = useState(null)
  const savingRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function loadGames() {
      try {
        const loadedTeams = await getTeams()
        const loadedGames = await getGames(loadedTeams)

        if (!cancelled) {
          setGames(loadedGames)
          setTeams(loadedTeams)
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

  function openForm() {
    setSaveError(null)
    setSuccessMessage(null)
    setRefreshWarning(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    if (savingRef.current) {
      return
    }

    setSaveError(null)
    setIsFormOpen(false)
  }

  async function handleCreateGame(payload) {
    if (savingRef.current) {
      return
    }

    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    setSuccessMessage(null)
    setRefreshWarning(null)

    try {
      await createGame(payload)
    } catch (createError) {
      console.error('Spiel konnte nicht angelegt werden.', createError)
      setSaveError(
        'Das Spiel konnte nicht gespeichert werden. ' +
        'Bitte prüfen Sie Ihre Eingaben und versuchen Sie es erneut.'
      )
      return
    } finally {
      savingRef.current = false
      setSaving(false)
    }

    setIsFormOpen(false)
    setSuccessMessage('Das Spiel wurde erfolgreich angelegt.')

    try {
      const loadedGames = await getGames(teams)
      setGames(loadedGames)
    } catch (loadError) {
      console.error(
        'Die Spieleliste konnte nach dem Anlegen nicht aktualisiert werden.',
        loadError
      )
      setRefreshWarning(
        'Das Spiel wurde gespeichert, die Liste konnte jedoch nicht ' +
        'aktualisiert werden. Öffnen Sie die Spieleverwaltung erneut.'
      )
    }
  }

  const pageReady = !loading && !error

  return (
    <section>
      <Topbar
        title="Spiele verwalten"
        subtitle="Übersicht aller vorhandenen Spiele"
      />

      {pageReady && (
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={openForm}
            disabled={isFormOpen || saving}
            className="h-12 rounded-2xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            Neues Spiel
          </button>
        </div>
      )}

      {successMessage && (
        <div
          className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {refreshWarning && (
        <div
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
          role="alert"
        >
          {refreshWarning}
        </div>
      )}

      {pageReady && isFormOpen && (
        <GameForm
          teams={teams}
          saving={saving}
          error={saveError}
          onSubmit={handleCreateGame}
          onCancel={closeForm}
        />
      )}

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
