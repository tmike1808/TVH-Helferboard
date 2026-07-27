import { useEffect, useRef } from 'react'

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

function formatDate(startTime) {
  const value = new Date(startTime)
  return Number.isNaN(value.getTime())
    ? 'unbekanntem Datum'
    : dateFormatter.format(value)
}

function getTeams(game) {
  const ownTeam = game.team?.name || 'Unbekannte TVH-Mannschaft'
  const opponent = game.opponent || 'Unbekannter Gegner'

  return game.is_home === false
    ? `${opponent} gegen ${ownTeam}`
    : `${ownTeam} gegen ${opponent}`
}

export default function DeleteGameDialog({
  game,
  deleting = false,
  error = null,
  onConfirm,
  onCancel
}) {
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    if (!game) {
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
  }, [deleting, game, onCancel])

  if (!game) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-game-title"
        aria-describedby="delete-game-description"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl sm:p-8"
      >
        <h2 id="delete-game-title" className="text-2xl font-black">
          Spiel löschen?
        </h2>

        <p id="delete-game-description" className="mt-4 text-slate-700">
          Möchten Sie das Spiel <strong>{getTeams(game)}</strong> am{' '}
          <strong>{formatDate(game.start_time)}</strong> wirklich löschen?
        </p>

        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-900">
          Vorhandene Helfereintragungen dieses Spiels werden ebenfalls
          dauerhaft gelöscht.
        </p>

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
            className="h-12 rounded-2xl border border-slate-300 px-5 font-bold hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="h-12 rounded-2xl bg-red-600 px-5 font-bold text-white hover:bg-red-700 disabled:cursor-wait disabled:bg-red-300"
          >
            {deleting ? 'Spiel wird gelöscht …' : 'Spiel löschen'}
          </button>
        </div>
      </section>
    </div>
  )
}
