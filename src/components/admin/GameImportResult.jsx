function ResultValue({ label, value }) {
  return (
    <li className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-200 py-2 last:border-0">
      <span className="min-w-0 break-words">{label}</span>
      <strong>{value}</strong>
    </li>
  )
}

export default function GameImportResult({
  result,
  onReset
}) {
  if (!result) {
    return null
  }

  const { summary } = result
  const detailRows = [
    ...result.skipped.map(row => ({
      key: `skipped-${row.rowNumber}`,
      rowNumber: row.rowNumber,
      message: row.message
    })),
    ...result.failed.map(row => ({
      key: `failed-${row.rowNumber}`,
      rowNumber: row.rowNumber,
      message:
        row.message
        || 'Das Spiel konnte nicht gespeichert werden.'
    })),
    ...result.aliases.failed.map(alias => ({
      key: `alias-${alias.teamId}-${alias.importName}`,
      rowNumber: 'Zuordnung',
      message: `${alias.importName}: ${alias.message}`
    }))
  ]

  return (
    <section
      className="mt-6 min-w-0 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 shadow-sm sm:p-7"
      aria-labelledby="game-import-result-title"
    >
      <h2 id="game-import-result-title" className="text-2xl font-black">
        {result.status === 'failed'
          ? 'Import fehlgeschlagen'
          : result.status === 'partial'
            ? 'Import teilweise abgeschlossen'
            : 'Import abgeschlossen'}
      </h2>

      <ul className="mt-4 max-w-xl">
        <ResultValue label="Zeilen geprüft" value={summary.total} />
        <ResultValue label="Spiele importiert" value={summary.imported} />
        <ResultValue
          label="Bereits vorhanden"
          value={summary.alreadyExisting}
        />
        <ResultValue
          label="Doppelt in Datei"
          value={summary.duplicateFile}
        />
        <ResultValue label="Ungültig" value={summary.invalid} />
        <ResultValue label="Nicht zugeordnet" value={summary.unmatched} />
        <ResultValue label="Kein Heimspiel" value={summary.notHome} />
        <ResultValue label="Fehlgeschlagen" value={summary.failed} />
        {(result.aliases.successful.length > 0
          || result.aliases.failed.length > 0) && (
          <>
            <ResultValue
              label="Zuordnungen gespeichert"
              value={result.aliases.successful.length}
            />
            <ResultValue
              label="Zuordnungen fehlgeschlagen"
              value={result.aliases.failed.length}
            />
          </>
        )}
      </ul>

      {result.refreshWarnings.length > 0 && (
        <div
          className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
          role="alert"
        >
          {result.refreshWarnings.join(' ')}
        </div>
      )}

      {detailRows.length > 0 && (
        <details className="mt-5 rounded-2xl border border-emerald-200 bg-white p-4">
          <summary className="cursor-pointer font-black">
            Übersprungene oder fehlgeschlagene Zeilen
          </summary>
          <ul className="mt-3 space-y-2 break-words text-sm">
            {detailRows.map(row => (
              <li key={row.key}>
                <strong>
                  {typeof row.rowNumber === 'number'
                    ? `Excel-Zeile ${row.rowNumber}:`
                    : `${row.rowNumber}:`}
                </strong>{' '}
                {row.message}
              </li>
            ))}
          </ul>
        </details>
      )}

      <button
        type="button"
        onClick={onReset}
        className="mt-6 h-12 w-full rounded-2xl border border-emerald-700 px-5 font-bold text-emerald-900 hover:bg-emerald-100 sm:w-auto"
      >
        Import zurücksetzen
      </button>
    </section>
  )
}
