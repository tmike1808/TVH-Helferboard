const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

const timeFormatter = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit'
})

function formatStartTime(startTime) {
  if (!startTime) {
    return { date: '–', time: '–' }
  }

  const value = new Date(startTime)

  if (Number.isNaN(value.getTime())) {
    return { date: '–', time: '–' }
  }

  return {
    date: dateFormatter.format(value),
    time: timeFormatter.format(value)
  }
}

function getTeams(game) {
  const ownTeam = game.team?.name || '–'
  const opponent = game.opponent || '–'

  if (game.is_home === true) {
    return {
      homeTeam: ownTeam,
      awayTeam: opponent
    }
  }

  if (game.is_home === false) {
    return {
      homeTeam: opponent,
      awayTeam: ownTeam
    }
  }

  return {
    homeTeam: '–',
    awayTeam: '–'
  }
}

export default function GameTable({
  games = [],
  actionsDisabled = false,
  selectionDisabled = false,
  selectedGameIds = new Set(),
  onSelectionChange,
  onEdit,
  onDelete
}) {
  const rows = games.map(game => {
    const { date, time } = formatStartTime(game.start_time)
    const { homeTeam, awayTeam } = getTeams(game)

    return {
      game,
      date,
      time,
      homeTeam,
      awayTeam,
      category: game.team?.category || '–',
      label: `${homeTeam} gegen ${awayTeam} am ${date}`
    }
  })

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden max-w-full overflow-x-auto md:block">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="w-16 px-5 py-4">Auswahl</th>
              <th className="px-5 py-4">Datum</th>
              <th className="px-5 py-4">Uhrzeit</th>
              <th className="px-5 py-4">Heimmannschaft</th>
              <th className="px-5 py-4">Gastmannschaft</th>
              <th className="px-5 py-4">Kategorie</th>
              <th className="px-5 py-4 text-right">Aktionen</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {rows.map(row => (
              <tr key={row.game.id} className="align-top">
                <td className="px-5 py-4">
                  <input
                    type="checkbox"
                    checked={selectedGameIds.has(String(row.game.id))}
                    onChange={event => onSelectionChange?.(
                      row.game.id,
                      event.target.checked
                    )}
                    disabled={selectionDisabled}
                    aria-label={`${row.label} auswählen`}
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-wait"
                  />
                </td>
                <td className="whitespace-nowrap px-5 py-4 font-bold">
                  {row.date}
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  {row.time}
                </td>
                <td className="max-w-xs break-words px-5 py-4">
                  {row.homeTeam}
                </td>
                <td className="max-w-xs break-words px-5 py-4">
                  {row.awayTeam}
                </td>
                <td className="px-5 py-4">
                  {row.category}
                </td>
                <td className="px-5 py-4">
                  <GameActions
                    row={row}
                    disabled={actionsDisabled}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-200 md:hidden">
        {rows.map(row => (
          <article key={row.game.id} className="min-w-0 space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedGameIds.has(String(row.game.id))}
                  onChange={event => onSelectionChange?.(
                    row.game.id,
                    event.target.checked
                  )}
                  disabled={selectionDisabled}
                  aria-label={`${row.label} auswählen`}
                  className="h-6 w-6 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-wait"
                />
                <div className="font-black">
                  {row.date}, {row.time} Uhr
                </div>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {row.category}
              </div>
            </div>

            <dl className="grid gap-3">
              <div>
                <dt className="text-xs font-bold uppercase text-slate-500">
                  Heimmannschaft
                </dt>
                <dd className="mt-1 break-words font-bold">
                  {row.homeTeam}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase text-slate-500">
                  Gastmannschaft
                </dt>
                <dd className="mt-1 break-words font-bold">
                  {row.awayTeam}
                </dd>
              </div>
            </dl>

            <GameActions
              row={row}
              disabled={actionsDisabled}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </article>
        ))}
      </div>
    </div>
  )
}

function GameActions({
  row,
  disabled,
  onEdit,
  onDelete
}) {
  const gameLabel = row.label

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
      <button
        type="button"
        onClick={() => onEdit?.(row.game)}
        disabled={disabled}
        aria-label={`${gameLabel} bearbeiten`}
        className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm font-bold hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 sm:h-10 sm:w-auto"
      >
        Bearbeiten
      </button>
      <button
        type="button"
        onClick={() => onDelete?.(row.game)}
        disabled={disabled}
        aria-label={`${gameLabel} löschen`}
        className="h-12 w-full rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-wait disabled:bg-red-300 sm:h-10 sm:w-auto"
      >
        Löschen
      </button>
    </div>
  )
}
