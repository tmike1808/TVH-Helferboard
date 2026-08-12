import { useRef, useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { downloadDashboardExport } from '../services/dashboardExport'
import { canExportDashboardGames } from '../utils/dashboardExportModel'

export default function DashboardExportButton({
  games,
  teams,
  roles,
  assignments
}) {
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const exportLock = useRef(false)
  const canExport = canExportDashboardGames(games)

  async function handleExport() {
    if (!canExport || exportLock.current) {
      return
    }

    exportLock.current = true
    setExporting(true)
    setMessage('')
    setError('')

    try {
      await downloadDashboardExport({
        games,
        teams,
        roles,
        assignments
      })
      setMessage('Die XLSX-Datei wurde erstellt.')
    } catch {
      setError('Die XLSX-Datei konnte nicht erstellt werden. Bitte erneut versuchen.')
    } finally {
      exportLock.current = false
      setExporting(false)
    }
  }

  return (
    <section
      aria-label="Helferplan exportieren"
      className="mb-6 min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-black text-slate-900">
            Helferplan als XLSX
          </h2>
          <p className="mt-1 break-words text-sm text-slate-600">
            Exportiert genau die aktuell gefilterten Spiele mit allen Rollen und Plätzen.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={!canExport || exporting}
          aria-busy={exporting}
          aria-describedby="dashboard-export-status"
          className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#8B1E2D] px-5 font-bold text-white outline-none hover:bg-[#741826] focus-visible:ring-2 focus-visible:ring-[#8B1E2D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto"
        >
          <FileSpreadsheet aria-hidden="true" className="h-5 w-5 shrink-0" />
          <span className="break-words text-center">
            {!canExport
              ? 'Keine Spiele zum Exportieren'
              : exporting
                ? 'XLSX wird erstellt …'
                : 'Gefilterte Spiele exportieren'}
          </span>
        </button>
      </div>

      <div
        id="dashboard-export-status"
        className="mt-2 min-h-5 text-sm"
        aria-live="polite"
      >
        {error ? (
          <p className="font-semibold text-red-700" role="alert">{error}</p>
        ) : message ? (
          <p className="font-semibold text-emerald-700" role="status">{message}</p>
        ) : (
          <p className="text-slate-500">
            {canExport
              ? `${games.length} ${games.length === 1 ? 'Spiel' : 'Spiele'} in der aktuellen Ansicht`
              : 'Ändere die Filter, um Spiele für den Export auszuwählen.'}
          </p>
        )}
      </div>
    </section>
  )
}
