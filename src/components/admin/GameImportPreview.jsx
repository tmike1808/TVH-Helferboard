import {
  IMPORT_STATUS,
  IMPORT_STATUS_LABELS,
  getImportSummary
} from '../../services/gameImportParser'

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

const STATUS_CLASSES = {
  [IMPORT_STATUS.READY]: 'bg-emerald-100 text-emerald-800',
  [IMPORT_STATUS.UNMATCHED]: 'bg-amber-100 text-amber-900',
  [IMPORT_STATUS.INVALID]: 'bg-red-100 text-red-800',
  [IMPORT_STATUS.DUPLICATE_EXISTING]: 'bg-sky-100 text-sky-800',
  [IMPORT_STATUS.NOT_HOME]: 'bg-slate-200 text-slate-800',
  [IMPORT_STATUS.DUPLICATE_FILE]: 'bg-violet-100 text-violet-800'
}

function formatDate(date) {
  if (!date) {
    return '–'
  }

  const [year, month, day] = date.split('-').map(Number)
  const value = new Date(year, month - 1, day)

  return Number.isNaN(value.getTime()) ? '–' : dateFormatter.format(value)
}

function SummaryCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    sky: 'border-sky-200 bg-sky-50 text-sky-900'
  }

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="text-sm font-bold">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  )
}

function TeamMapping({
  row,
  teams,
  disabled,
  onMappingChange
}) {
  const canMapManually =
    row.mappingSource === 'manual'
    || row.status === IMPORT_STATUS.UNMATCHED

  if (!canMapManually) {
    return row.matchedTeamName || '–'
  }

  return (
    <select
      value={row.matchedTeamId ? String(row.matchedTeamId) : ''}
      disabled={disabled}
      onChange={event => onMappingChange?.(
        row.importTeamName,
        event.target.value
      )}
      aria-label={`Team für ${row.importTeamName || `Zeile ${row.rowNumber}`} zuordnen`}
      className="h-10 min-w-56 max-w-full rounded-xl border border-slate-300 bg-white px-3 disabled:cursor-wait disabled:bg-slate-100"
    >
      <option value="">Nicht zugeordnet</option>
      {teams.map(team => (
        <option key={team.id} value={String(team.id)}>
          {team.name}
        </option>
      ))}
    </select>
  )
}

export default function GameImportPreview({
  rows = [],
  teams = [],
  disabled = false,
  onMappingChange
}) {
  const summary = getImportSummary(rows)

  return (
    <section className="min-w-0 max-w-full" aria-labelledby="import-preview-title">
      <div className="mb-5">
        <h2 id="import-preview-title" className="text-2xl font-black">
          Importvorschau
        </h2>
        <p className="mt-1 text-slate-600">
          Die Vorschau verändert keine Daten in Supabase.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Gesamtzeilen" value={summary.total} />
        <SummaryCard
          label="Importierbar"
          value={summary.ready}
          tone="emerald"
        />
        <SummaryCard
          label="Nicht zugeordnet"
          value={summary.unmatched}
          tone="amber"
        />
        <SummaryCard
          label="Ungültig"
          value={summary.invalid}
          tone="red"
        />
        <SummaryCard
          label="Duplikate"
          value={summary.duplicates}
          tone="sky"
        />
        <SummaryCard label="Übersprungen" value={summary.skipped} />
      </div>

      <div className="max-w-full overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Excel-Zeile</th>
              <th className="px-4 py-4">Mannschaft aus Excel</th>
              <th className="px-4 py-4">Supabase-Team</th>
              <th className="px-4 py-4">Gegner</th>
              <th className="px-4 py-4">Datum</th>
              <th className="px-4 py-4">Uhrzeit</th>
              <th className="px-4 py-4">Hinweis oder Fehler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map(row => (
              <tr key={row.rowNumber} className="align-top">
                <td className="px-4 py-4">
                  <span
                    className={
                      `inline-flex whitespace-nowrap rounded-full px-3 py-1 `
                      + `text-xs font-black ${STATUS_CLASSES[row.status]}`
                    }
                  >
                    {IMPORT_STATUS_LABELS[row.status]}
                  </span>
                </td>
                <td className="px-4 py-4 font-bold">{row.rowNumber}</td>
                <td className="px-4 py-4">{row.importTeamName || '–'}</td>
                <td className="px-4 py-4">
                  <TeamMapping
                    row={row}
                    teams={teams}
                    disabled={disabled}
                    onMappingChange={onMappingChange}
                  />
                </td>
                <td className="px-4 py-4">{row.opponent || '–'}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  {formatDate(row.date)}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {row.time ? `${row.time} Uhr` : '–'}
                </td>
                <td className="min-w-72 px-4 py-4 text-sm text-slate-700">
                  {row.messages.join(' ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
