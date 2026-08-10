import { useEffect, useRef, useState } from 'react'
import Topbar from '../components/Topbar'
import BulkDeleteGamesDialog from '../components/admin/BulkDeleteGamesDialog'
import DeleteGameDialog from '../components/admin/DeleteGameDialog'
import GameForm from '../components/admin/GameForm'
import GameTable from '../components/admin/GameTable'
import {
  createGame,
  deleteGame,
  deleteGames,
  getGames,
  getTeams,
  updateGame
} from '../services/gameService'
import {
  pruneGameSelection,
  toggleAllDisplayedGames,
  toggleGameSelection
} from '../services/gameSelection'
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

function getBulkDeleteErrorMessage(error) {
  if (error?.code === 'INVALID_GAME_IDS') {
    return 'Wählen Sie mindestens ein Spiel zum Löschen aus.'
  }

  if (error?.code === 'BULK_DELETE_IN_PROGRESS') {
    return 'Eine Sammellöschung wird bereits ausgeführt.'
  }

  return (
    'Die Sammellöschung konnte nicht gestartet werden. '
    + 'Bitte versuchen Sie es erneut.'
  )
}

function getFailedGamesMessage(failedIds, selectedGames) {
  const labels = failedIds
    .map(id => selectedGames.find(game => String(game.id) === String(id)))
    .filter(Boolean)
    .slice(0, 3)
    .map(game => `${game.team?.name || 'TVH-Team'} – ${game.opponent}`)
  const remaining = Math.max(0, failedIds.length - labels.length)

  return labels.length > 0
    ? `Nicht gelöscht: ${labels.join(', ')}${remaining > 0 ? ` und ${remaining} weitere` : ''}.`
    : `${failedIds.length} Spiele konnten nicht gelöscht werden.`
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
  const [selectedGameIds, setSelectedGameIds] = useState(() => new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(null)
  const [bulkDeleteDialogError, setBulkDeleteDialogError] = useState(null)
  const [bulkDeleteSummary, setBulkDeleteSummary] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [refreshWarning, setRefreshWarning] = useState(null)
  const savingRef = useRef(false)
  const deletingRef = useRef(false)
  const bulkDeletingRef = useRef(false)
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

  useEffect(() => {
    setSelectedGameIds(previousIds => {
      const nextIds = pruneGameSelection(previousIds, games)

      return nextIds.size === previousIds.size ? previousIds : nextIds
    })
  }, [games])

  async function refreshAfterMutation(action, subject = 'Das Spiel') {
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
      const verb = subject === 'Das Spiel' ? 'wurde' : 'wurden'

      setRefreshWarning(
        `${subject} ${verb} ${action}, die Daten konnten jedoch nicht vollständig `
        + 'aktualisiert werden. Öffnen Sie die Ansicht erneut.'
      )
    }

    return {
      complete:
        gamesResult.status === 'fulfilled'
        && dashboardResult.status === 'fulfilled'
    }
  }

  function openCreateForm() {
    setSaveError(null)
    setDeleteError(null)
    setSuccessMessage(null)
    setBulkDeleteSummary(null)
    setRefreshWarning(null)
    setSelectedGame(null)
    setFormMode('create')
  }

  function openEditForm(game) {
    if (savingRef.current || deletingRef.current || bulkDeletingRef.current) {
      return
    }

    setSaveError(null)
    setDeleteError(null)
    setSuccessMessage(null)
    setBulkDeleteSummary(null)
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
    setBulkDeleteSummary(null)
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
    if (savingRef.current || deletingRef.current || bulkDeletingRef.current) {
      return
    }

    setDeleteError(null)
    setSaveError(null)
    setSuccessMessage(null)
    setBulkDeleteSummary(null)
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

  function handleSelectionChange(gameId, selected) {
    if (savingRef.current || deletingRef.current || bulkDeletingRef.current) {
      return
    }

    setSelectedGameIds(previousIds => {
      return toggleGameSelection(previousIds, gameId, selected)
    })
    setBulkDeleteSummary(null)
  }

  function toggleSelectAll() {
    if (savingRef.current || deletingRef.current || bulkDeletingRef.current) {
      return
    }

    setSelectedGameIds(toggleAllDisplayedGames(selectedGameIds, games))
    setBulkDeleteSummary(null)
  }

  function openBulkDeleteDialog() {
    if (
      selectedGameIds.size === 0
      || savingRef.current
      || deletingRef.current
      || bulkDeletingRef.current
    ) {
      return
    }

    setBulkDeleteDialogError(null)
    setBulkDeleteSummary(null)
    setSuccessMessage(null)
    setRefreshWarning(null)
    setBulkDeleteOpen(true)
  }

  function closeBulkDeleteDialog() {
    if (bulkDeletingRef.current) {
      return
    }

    setBulkDeleteDialogError(null)
    setBulkDeleteProgress(null)
    setBulkDeleteOpen(false)
  }

  async function handleBulkDeleteGames() {
    if (bulkDeletingRef.current || selectedGameIds.size === 0) {
      return
    }

    const ids = [...selectedGameIds]
    const gamesAtStart = games.filter(game =>
      selectedGameIds.has(String(game.id))
    )

    bulkDeletingRef.current = true
    setBulkDeleting(true)
    setBulkDeleteProgress({ processed: 0, total: ids.length })
    setBulkDeleteDialogError(null)
    setBulkDeleteSummary(null)
    setSuccessMessage(null)
    setRefreshWarning(null)

    let result

    try {
      result = await deleteGames(ids, {
        onProgress: setBulkDeleteProgress,
        refresh: async () => {
          const refreshResult = await refreshAfterMutation(
            'gelöscht',
            'Die erfolgreich gelöschten Spiele'
          )

          if (!refreshResult.complete) {
            throw new Error('Unvollständiger Refresh nach Sammellöschung')
          }
        }
      })
    } catch (bulkDeleteError) {
      console.error(
        'Die Sammellöschung konnte nicht ausgeführt werden.',
        bulkDeleteError
      )
      setBulkDeleteDialogError(getBulkDeleteErrorMessage(bulkDeleteError))
      return
    } finally {
      bulkDeletingRef.current = false
      setBulkDeleting(false)
    }

    const successfulIds = new Set(
      result.successful.map(item => String(item.id))
    )
    const failedIds = result.failed.map(item => String(item.id))

    setSelectedGameIds(new Set(failedIds))
    setBulkDeleteProgress(null)

    if (result.successful.length === 0) {
      setBulkDeleteDialogError(
        'Keines der ausgewählten Spiele konnte gelöscht werden. '
        + 'Die Auswahl bleibt für einen erneuten Versuch erhalten.'
      )
      return
    }

    setBulkDeleteOpen(false)

    if (selectedGame?.id && successfulIds.has(String(selectedGame.id))) {
      setSelectedGame(null)
      setFormMode(null)
    }

    if (result.failed.length === 0) {
      setSuccessMessage(
        `${result.successful.length} `
        + `${result.successful.length === 1 ? 'Spiel wurde' : 'Spiele wurden'} `
        + 'erfolgreich gelöscht.'
      )
    } else {
      setBulkDeleteSummary(
        `${result.successful.length} von ${ids.length} Spielen wurden gelöscht. `
        + getFailedGamesMessage(failedIds, gamesAtStart)
        + ' Die fehlgeschlagenen Spiele bleiben ausgewählt.'
      )
    }

    if (result.refreshError) {
      setRefreshWarning(
        'Die Löschung wurde ausgeführt, die Daten konnten jedoch nicht '
        + 'vollständig aktualisiert werden. Öffnen Sie die Ansicht erneut.'
      )
    }
  }

  const pageReady = !loading && !error
  const isFormOpen = formMode !== null
  const actionsDisabled = saving || deleting || bulkDeleting
  const allGamesSelected = games.length > 0
    && selectedGameIds.size === games.length
  const selectedGames = games.filter(game =>
    selectedGameIds.has(String(game.id))
  )

  return (
    <section className="min-w-0">
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
            className="h-12 w-full rounded-2xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400 sm:w-auto"
          >
            Neues Spiel
          </button>
        </div>
      )}

      {pageReady && games.length > 0 && (
        <section
          aria-label="Sammelauswahl Spiele"
          className="mb-6 flex min-w-0 flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="font-black">
              {selectedGameIds.size} {selectedGameIds.size === 1
                ? 'Spiel ausgewählt'
                : 'Spiele ausgewählt'}
            </div>
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={actionsDisabled || isFormOpen}
              className="mt-2 min-h-10 font-bold text-emerald-700 hover:text-emerald-800 disabled:cursor-wait disabled:text-slate-400"
            >
              {allGamesSelected ? 'Alle abwählen' : 'Alle auswählen'}
            </button>
          </div>

          <button
            type="button"
            onClick={openBulkDeleteDialog}
            disabled={
              selectedGameIds.size === 0
              || actionsDisabled
              || isFormOpen
            }
            className="h-12 w-full rounded-2xl bg-red-600 px-5 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto"
          >
            Ausgewählte Spiele löschen
          </button>
        </section>
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

      {bulkDeleteSummary && (
        <div
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
          role="alert"
        >
          {bulkDeleteSummary}
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
          selectionDisabled={actionsDisabled || isFormOpen}
          selectedGameIds={selectedGameIds}
          onSelectionChange={handleSelectionChange}
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

      <BulkDeleteGamesDialog
        games={bulkDeleteOpen ? selectedGames : []}
        deleting={bulkDeleting}
        progress={bulkDeleteProgress}
        error={bulkDeleteDialogError}
        onConfirm={handleBulkDeleteGames}
        onCancel={closeBulkDeleteDialog}
      />
    </section>
  )
}
