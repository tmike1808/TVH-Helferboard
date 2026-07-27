import { useEffect, useRef, useState } from 'react'
import Topbar from '../components/Topbar'
import DeleteGameDialog from '../components/admin/DeleteGameDialog'
import GameForm from '../components/admin/GameForm'
import GameTable from '../components/admin/GameTable'
import {
  createGame,
  deleteGame,
  getGames,
  getTeams,
  updateGame
} from '../services/gameService'
import { useDashboardStore } from '../store/useDashboardStore'

function getSaveErrorMessage(error, mode) {
  if (error?.code === 'GAME_NOT_FOUND') {
    return mode === 'edit'
      ? 'Das Spiel wurde nicht gefunden oder darf nicht bearbeitet werden.'
      : 'Das Spiel konnte nicht gespeichert werden.'
  }

  return (
    `Das Spiel konnte nicht ${mode === 'edit' ? 'aktualisiert' : 'gespeichert'} werden. `
    + 'Bitte prüfen Sie Ihre Eingaben und versuchen Sie es erneut.'
  )
}

function getDeleteErrorMessage(error) {
  if (error?.code === 'GAME_DELETE_BLOCKED') {
    return (
      'Das Spiel kann nicht gelöscht werden, weil es noch von anderen '
      + 'Datensätzen verwendet wird.'
    )
  }

  if (error?.code === 'GAME_NOT_FOUND') {
    return 'Das Spiel wurde nicht gefunden oder darf nicht gelöscht werden.'
  }

  return (
    'Das Spiel konnte nicht gelöscht werden. '
    + 'Bitte versuchen Sie es erneut.'
  )
}

export default function AdminGamesPage() {
  const [games, setGames] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formMode, setFormMode] = useState(null)
  const [selectedGame, setSelectedGame] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [refreshWarning, setRefreshWarning] = useState(null)
  const savingRef = useRef(false)
  const deletingRef = useRef(false)
  const loadDashboardData = useDashboardStore(state => state.loadData)

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
            'Die Spiele konnten nicht geladen werden. '
            + 'Bitte versuchen Sie es später erneut.'
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

  async function refreshAfterMutation(action) {
    const [gamesResult, dashboardResult] = await Promise.allSettled([
      getGames(teams),
      loadDashboardData()
    ])

    if (gamesResult.status === 'fulfilled') {
      setGames(gamesResult.value)
    } else {
      console.error(
        `Die Spieleliste konnte nach dem ${action} nicht aktualisiert werden.`,
        gamesResult.reason
      )
    }

    if (dashboardResult.status === 'rejected') {
      console.error(
        `Das Dashboard konnte nach dem ${action} nicht aktualisiert werden.`,
        dashboardResult.reason
      )
    }

    if (
      gamesResult.status === 'rejected'
      || dashboardResult.status === 'rejected'
    ) {
      setRefreshWarning(
        `Das Spiel wurde ${action}, die Daten konnten jedoch nicht vollständig `
        + 'aktualisiert werden. Öffnen Sie die Ansicht erneut.'
      )
    }
  }

  function openCreateForm() {
    setSaveError(null)
    setDeleteError(null)
    setSuccessMessage(null)
    setRefreshWarning(null)
    setSelectedGame(null)
    setFormMode('create')
  }

  function openEditForm(game) {
    if (savingRef.current || deletingRef.current) {
      return
    }

    setSaveError(null)
    setDeleteError(null)
    setSuccessMessage(null)
    setRefreshWarning(null)
    setSelectedGame(game)
    setFormMode('edit')
  }

  function closeForm() {
    if (savingRef.current) {
      return
    }

    setSaveError(null)
    setSelectedGame(null)
    setFormMode(null)
  }

  async function handleSaveGame(payload) {
    if (savingRef.current || !formMode) {
      return
    }

    const mode = formMode
    const gameId = selectedGame?.id

    if (mode === 'edit' && !gameId) {
      setSaveError('Das ausgewählte Spiel kann nicht bearbeitet werden.')
      return
    }

    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    setSuccessMessage(null)
    setRefreshWarning(null)

    try {
      if (mode === 'edit') {
        await updateGame(gameId, payload)
      } else {
        await createGame(payload)
      }
    } catch (saveRequestError) {
      console.error(
        mode === 'edit'
          ? 'Spiel konnte nicht aktualisiert werden.'
          : 'Spiel konnte nicht angelegt werden.',
        saveRequestError
      )
      setSaveError(getSaveErrorMessage(saveRequestError, mode))
      return
    } finally {
      savingRef.current = false
      setSaving(false)
    }

    setSelectedGame(null)
    setFormMode(null)
    setSuccessMessage(
      mode === 'edit'
        ? 'Das Spiel wurde erfolgreich aktualisiert.'
        : 'Das Spiel wurde erfolgreich angelegt.'
    )

    await refreshAfterMutation(
      mode === 'edit' ? 'aktualisiert' : 'gespeichert'
    )
  }

  function openDeleteDialog(game) {
    if (savingRef.current || deletingRef.current) {
      return
    }

    setDeleteError(null)
    setSaveError(null)
    setSuccessMessage(null)
    setRefreshWarning(null)
    setDeleteTarget(game)
  }

  function closeDeleteDialog() {
    if (deletingRef.current) {
      return
    }

    setDeleteError(null)
    setDeleteTarget(null)
  }

  async function handleDeleteGame() {
    if (deletingRef.current || !deleteTarget?.id) {
      return
    }

    const game = deleteTarget
    deletingRef.current = true
    setDeleting(true)
    setDeleteError(null)
    setSuccessMessage(null)
    setRefreshWarning(null)

    try {
      await deleteGame(game.id)
    } catch (deleteRequestError) {
      console.error('Spiel konnte nicht gelöscht werden.', deleteRequestError)
      setDeleteError(getDeleteErrorMessage(deleteRequestError))
      return
    } finally {
      deletingRef.current = false
      setDeleting(false)
    }

    setDeleteTarget(null)

    if (selectedGame?.id === game.id) {
      setSelectedGame(null)
      setFormMode(null)
    }

    setSuccessMessage('Das Spiel wurde erfolgreich gelöscht.')
    await refreshAfterMutation('gelöscht')
  }

  const pageReady = !loading && !error
  const isFormOpen = formMode !== null
  const actionsDisabled = saving || deleting

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
            onClick={openCreateForm}
            disabled={isFormOpen || actionsDisabled}
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
          key={`${formMode}-${selectedGame?.id ?? 'new'}`}
          mode={formMode}
          game={selectedGame}
          teams={teams}
          saving={saving}
          error={saveError}
          onSubmit={handleSaveGame}
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
        <GameTable
          games={games}
          actionsDisabled={actionsDisabled}
          onEdit={openEditForm}
          onDelete={openDeleteDialog}
        />
      )}

      <DeleteGameDialog
        game={deleteTarget}
        deleting={deleting}
        error={deleteError}
        onConfirm={handleDeleteGame}
        onCancel={closeDeleteDialog}
      />
    </section>
  )
}
