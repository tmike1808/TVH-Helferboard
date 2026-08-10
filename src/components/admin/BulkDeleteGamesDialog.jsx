import { useEffect, useRef } from 'react'
import { formatGameDate } from '../../utils/formatDateTime'

const PREVIEW_LIMIT = 5

function getGameLabel(game) {
  const ownTeam = game.team?.name || 'Unbekannte TVH-Mannschaft'
  const opponent = game.opponent || 'Unbekannter Gegner'
  const teams = game.is_home === false
    ? `${opponent} – ${ownTeam}`
    : `${ownTeam} – ${opponent}`

  return `${formatGameDate(game.start_time)}: ${teams}`
}

export default function BulkDeleteGamesDialog({
  games = [],
  deleting = false,
  progress = null,
  error = null,
  onConfirm,
  onCancel
}) {
  const cancelButtonRef = useRef(null)
  const count = games.length
  const previewGames = games.slice(0, PREVIEW_LIMIT)
  const remainingCount = Math.max(0, count - previewGames.length)

  useEffect(() => {
    if (count === 0) {
      return undefined
    }

    cancelButtonRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !deleting) {
        onCancel?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [count, deleting, onCancel])

  if (count === 0) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-delete-games-title"
        aria-describedby="bulk-delete-games-description"
        className="max-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:p-8"
      >
        <h2 id="bulk-delete-games-title" className="text-2xl font-black">
          {count} {count === 1 ? 'Spiel' : 'Spiele'} löschen?
        </h2>

        <p
          id="bulk-delete-games-description"
          className="mt-4 text-slate-700"
        >
          Die ausgewählten Spiele werden dauerhaft gelöscht. Dieser Vorgang
          kann nicht rückgängig gemacht werden.
        </p>

        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-900">
          Vorhandene Helferzuordnungen dieser Spiele werden aufgrund der
          bestehenden Datenbankbeziehung ebenfalls dauerhaft gelöscht.
        </p>

        <ul className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          {previewGames.map(game => (
            <li key={game.id} className="break-words">
              {getGameLabel(game)}
            </li>
          ))}
          {remainingCount > 0 && (
            <li className="font-bold text-slate-500">
              + {remainingCount} weitere {remainingCount === 1 ? 'Spiel' : 'Spiele'}
            </li>
          )}
        </ul>

        {deleting && progress && (
          <div className="mt-4 rounded-2xl bg-slate-100 p-4" role="status">
            {progress.processed} von {progress.total} Spielen verarbeitet …
          </div>
        )}

        {error && (
          <div
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="h-12 w-full rounded-2xl border border-slate-300 px-5 font-bold hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="h-12 w-full rounded-2xl bg-red-600 px-5 font-bold text-white hover:bg-red-700 disabled:cursor-wait disabled:bg-red-300 sm:w-auto"
          >
            {deleting
              ? 'Spiele werden gelöscht …'
              : `${count} ${count === 1 ? 'Spiel' : 'Spiele'} löschen`}
          </button>
        </div>
      </section>
    </div>
  )
}
