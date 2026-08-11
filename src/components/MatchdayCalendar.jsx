import { useEffect, useMemo, useRef, useState } from 'react'
import { useDashboardStore } from '../store/useDashboardStore'
import {
  createCalendarMonth,
  formatCalendarDate,
  formatCalendarMonth,
  getBerlinDateKey,
  getCurrentCalendarMonth,
  getInitialCalendarMonth,
  getSelectedCalendarDates,
  shiftCalendarMonth
} from '../utils/matchdayCalendar'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export default function MatchdayCalendar() {
  const {
    games,
    teams,
    selectedCategory,
    selectedTeamIds,
    selectedMatchdayIds,
    selectMatchdayFromCalendar,
    getRelevantMatchdayGroups
  } = useDashboardStore()
  const matchdayGroups = useMemo(
    () => getRelevantMatchdayGroups()
      .filter(group => group.startDate && group.endDate),
    [
      games,
      teams,
      selectedCategory,
      selectedTeamIds,
      getRelevantMatchdayGroups
    ]
  )
  const [visibleMonth, setVisibleMonth] = useState(
    () => getInitialCalendarMonth([])
  )
  const initializedWithGames = useRef(false)
  const skipNextSelectionMonthSync = useRef(false)

  useEffect(() => {
    if (initializedWithGames.current || matchdayGroups.length === 0) {
      return
    }

    setVisibleMonth(getInitialCalendarMonth(matchdayGroups))
    initializedWithGames.current = true
  }, [matchdayGroups])

  useEffect(() => {
    if (skipNextSelectionMonthSync.current) {
      skipNextSelectionMonthSync.current = false
      return
    }

    if (selectedMatchdayIds.length !== 1) {
      return
    }

    const selectedGroup = matchdayGroups.find(
      group => group.id === selectedMatchdayIds[0]
    )
    const selectedMonth = selectedGroup?.startDate?.slice(0, 7)

    if (selectedMonth) {
      setVisibleMonth(selectedMonth)
    }
  }, [matchdayGroups, selectedMatchdayIds])

  const monthCells = useMemo(
    () => createCalendarMonth(visibleMonth, matchdayGroups),
    [matchdayGroups, visibleMonth]
  )
  const monthWeeks = useMemo(
    () => Array.from(
      { length: monthCells.length / 7 },
      (_, index) => monthCells.slice(index * 7, index * 7 + 7)
    ),
    [monthCells]
  )
  const selectedDates = useMemo(
    () => getSelectedCalendarDates(matchdayGroups, selectedMatchdayIds),
    [matchdayGroups, selectedMatchdayIds]
  )
  const today = getBerlinDateKey()

  function changeMonth(offset) {
    setVisibleMonth(current => shiftCalendarMonth(current, offset) ?? current)
  }

  function showCurrentMonth() {
    setVisibleMonth(getCurrentCalendarMonth())
  }

  function selectCalendarMatchday(matchdayId) {
    skipNextSelectionMonthSync.current = true
    selectMatchdayFromCalendar(matchdayId)
  }

  return (
    <section
      aria-labelledby="matchday-calendar-title"
      className="mb-8 min-w-0 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5"
    >
      <div className="mx-auto max-w-xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Vorheriger Monat"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#8B1E2D]"
          >
            <span aria-hidden="true" className="text-2xl leading-none">‹</span>
          </button>

          <div className="min-w-0 text-center">
            <h2
              id="matchday-calendar-title"
              aria-live="polite"
              className="break-words text-lg font-black capitalize text-slate-900 sm:text-xl"
            >
              {formatCalendarMonth(visibleMonth)}
            </h2>
            <p className="text-xs font-semibold text-slate-500 sm:text-sm">
              Spieltag auswählen
            </p>
          </div>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Nächster Monat"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#8B1E2D]"
          >
            <span aria-hidden="true" className="text-2xl leading-none">›</span>
          </button>
        </div>

        <div className="mb-3 flex justify-center">
          <button
            type="button"
            onClick={showCurrentMonth}
            aria-label="Zum aktuellen Monat springen"
            className="min-h-11 rounded-2xl border border-[#8B1E2D] px-5 text-sm font-black text-[#8B1E2D] outline-none hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-[#8B1E2D] focus-visible:ring-offset-2"
          >
            Heute
          </button>
        </div>

        <div
          className="grid grid-cols-7 gap-1 text-center"
          role="grid"
          aria-label={`Kalender ${formatCalendarMonth(visibleMonth)}`}
        >
          <div role="row" className="contents">
            {WEEKDAYS.map(weekday => (
              <div
                key={weekday}
                role="columnheader"
                className="py-1 text-xs font-black text-slate-500 sm:text-sm"
              >
                {weekday}
              </div>
            ))}
          </div>

          {monthWeeks.map((week, weekIndex) => (
            <div
              key={`week-${weekIndex}`}
              role="row"
              className="contents"
            >
              {week.map(cell => {
                if (!cell.dateKey) {
                  return (
                    <div
                      key={cell.key}
                      role="gridcell"
                      aria-hidden="true"
                      className="min-h-10"
                    />
                  )
                }

                const isToday = cell.dateKey === today
                const isSelected = selectedDates.has(cell.dateKey)

                if (!cell.matchday) {
                  return (
                    <div
                      key={cell.key}
                      role="gridcell"
                      aria-current={isToday ? 'date' : undefined}
                      className="flex min-h-10 items-center justify-center"
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold text-slate-600 ${
                          isToday ? 'border border-dashed border-slate-500' : ''
                        }`}
                      >
                        {cell.day}
                      </span>
                    </div>
                  )
                }

                const gameCount = cell.matchday.games.length
                const accessibleLabel = [
                  formatCalendarDate(cell.dateKey),
                  `Spieltag ${cell.matchday.label}`,
                  `${gameCount} ${gameCount === 1 ? 'Spiel' : 'Spiele'}`
                ].join(', ')

                return (
                  <div key={cell.key} role="gridcell">
                    <button
                      type="button"
                      onClick={() => selectCalendarMatchday(cell.matchday.id)}
                      aria-label={accessibleLabel}
                      aria-pressed={isSelected}
                      aria-current={isToday ? 'date' : undefined}
                      className={`flex min-h-10 w-full items-center justify-center rounded-xl border text-sm font-black outline-none transition focus-visible:ring-2 focus-visible:ring-[#8B1E2D] focus-visible:ring-offset-2 ${
                        isSelected
                          ? 'border-[#8B1E2D] bg-[#8B1E2D] text-white shadow-sm'
                          : 'border-[#8B1E2D] bg-rose-50 text-[#8B1E2D] hover:bg-rose-100'
                      } ${
                        isToday ? 'ring-1 ring-slate-500 ring-offset-1' : ''
                      }`}
                    >
                      {cell.day}
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded border border-[#8B1E2D] bg-rose-50"
            />
            Heimspieltag
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded bg-[#8B1E2D]"
            />
            Ausgewählt
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded border border-dashed border-slate-500"
            />
            Heute
          </span>
        </div>
      </div>
    </section>
  )
}
