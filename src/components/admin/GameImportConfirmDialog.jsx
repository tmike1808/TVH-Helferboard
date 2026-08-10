import { useEffect, useRef } from 'react'

export default function GameImportConfirmDialog({
  open = false,
  importableCount = 0,
  skippedCount = 0,
  importing = false,
  progress = null,
  onConfirm,
  onCancel
}) {
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    cancelButtonRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !importing) {
        onCancel?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [importing, onCancel, open])

  if (!open) {
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
        aria-labelledby="game-import-confirm-title"
        aria-describedby="game-import-confirm-description"
        className="max-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:p-8"
      >
        <h2 id="game-import-confirm-title" className="text-2xl font-black">
          Spiele importieren?
        </h2>

        <div
          id="game-import-confirm-description"
          className="mt-4 space-y-3 text-slate-700"
        >
          <p>
            <strong>{importableCount}</strong>{' '}
            {importableCount === 1 ? 'Spiel wird' : 'Spiele werden'} in
            Supabase angelegt.
          </p>
          <p>
            <strong>{skippedCount}</strong>{' '}
            {skippedCount === 1 ? 'Zeile wird' : 'Zeilen werden'} eindeutig
            übersprungen.
          </p>
          <p>
            Vor dem Speichern werden vorhandene Spiele erneut geladen und
            Duplikate nochmals geprüft.
          </p>
        </div>

        {importing && (
          <div
            className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 font-bold text-sky-900"
            role="status"
          >
            {progress
              ? `${progress.processed} von ${progress.total} Spielen verarbeitet …`
              : 'Import wird vorbereitet …'}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={importing}
            className="h-12 w-full rounded-2xl border border-slate-300 px-5 font-bold hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={importing || importableCount === 0}
            className="h-12 w-full rounded-2xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-300 sm:w-auto"
          >
            {importing ? 'Import läuft …' : 'Import starten'}
          </button>
        </div>
      </section>
    </div>
  )
}
