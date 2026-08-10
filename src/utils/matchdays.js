import {
  getGameCalendarDay,
  parseGameStartTime
} from './formatDateTime.js'

export const INVALID_MATCHDAY_ID = 'invalid-date'

export function createMatchdayGroups(games, referenceGames = games) {
  const referenceGroups = buildReferenceGroups(referenceGames)
  const referenceByGameId = new Map()

  for (const group of referenceGroups) {
    for (const game of group.games) {
      if (game?.id != null) {
        referenceByGameId.set(String(game.id), group)
      }
    }
  }

  const visibleByGroupId = new Map()

  for (const game of Array.isArray(games) ? games : []) {
    const referenceGroup = game?.id != null
      ? referenceByGameId.get(String(game.id))
      : null
    const fallbackGroup = referenceGroup ?? getStandaloneGroup(game)
    const current = visibleByGroupId.get(fallbackGroup.id)

    if (current) {
      current.games.push(game)
      continue
    }

    visibleByGroupId.set(fallbackGroup.id, {
      id: fallbackGroup.id,
      label: fallbackGroup.label,
      startDate: fallbackGroup.startDate,
      endDate: fallbackGroup.endDate,
      sortValue: fallbackGroup.sortValue,
      games: [game]
    })
  }

  return [...visibleByGroupId.values()]
    .map(group => ({
      ...group,
      games: group.games.slice().sort(compareGamesByStartTime)
    }))
    .sort(compareMatchdayGroups)
}

export function getMatchdayOptions(games) {
  return createMatchdayGroups(games).map(group => ({
    value: group.id,
    label: group.label
  }))
}

export function getMatchdayIdByGameId(games) {
  const matchdaysByGameId = new Map()

  for (const group of createMatchdayGroups(games)) {
    for (const game of group.games) {
      if (game?.id != null) {
        matchdaysByGameId.set(String(game.id), group.id)
      }
    }
  }

  return matchdaysByGameId
}

export function formatMatchdayLabel(startDate, endDate = startDate) {
  const start = parseDateKey(startDate)
  const end = parseDateKey(endDate)

  if (!start || !end) {
    return 'Datum unbekannt'
  }

  if (start.dateKey === end.dateKey) {
    return formatFullDate(start)
  }

  if (start.year !== end.year) {
    return `${formatFullDate(start)}–${formatFullDate(end)}`
  }

  if (start.month !== end.month) {
    return `${twoDigits(start.day)}.${twoDigits(start.month)}.–${formatFullDate(end)}`
  }

  return `${twoDigits(start.day)}.–${formatFullDate(end)}`
}

export function pruneSelectedMatchdayIds(selectedMatchdayIds, games) {
  const availableIds = new Set(
    getMatchdayOptions(games).map(option => option.value)
  )

  return uniqueStrings(selectedMatchdayIds)
    .filter(id => availableIds.has(id))
}

function buildReferenceGroups(games) {
  const gamesByDate = new Map()
  const invalidGames = []

  for (const game of Array.isArray(games) ? games : []) {
    const calendarDay = getGameCalendarDay(game?.start_time)

    if (!calendarDay) {
      invalidGames.push(game)
      continue
    }

    const entry = gamesByDate.get(calendarDay.dateKey)

    if (entry) {
      entry.games.push(game)
    } else {
      gamesByDate.set(calendarDay.dateKey, {
        ...calendarDay,
        games: [game]
      })
    }
  }

  const dates = [...gamesByDate.values()]
    .sort((first, second) => first.sortValue - second.sortValue)
  const groups = []
  const consumedDates = new Set()

  for (const date of dates) {
    if (consumedDates.has(date.dateKey)) {
      continue
    }

    const nextDateKey = toDateKey(date.sortValue + 24 * 60 * 60 * 1000)
    const followingSunday = date.weekday === 6
      ? gamesByDate.get(nextDateKey)
      : null
    const endDate = followingSunday?.weekday === 0
      ? followingSunday
      : date
    const groupedGames = followingSunday?.weekday === 0
      ? [...date.games, ...followingSunday.games]
      : [...date.games]

    consumedDates.add(date.dateKey)
    if (followingSunday?.weekday === 0) {
      consumedDates.add(followingSunday.dateKey)
    }

    groups.push({
      id: createMatchdayId(date.dateKey, endDate.dateKey),
      label: formatMatchdayLabel(date.dateKey, endDate.dateKey),
      startDate: date.dateKey,
      endDate: endDate.dateKey,
      sortValue: date.sortValue,
      games: groupedGames.sort(compareGamesByStartTime)
    })
  }

  if (invalidGames.length > 0) {
    groups.push({
      id: INVALID_MATCHDAY_ID,
      label: 'Datum unbekannt',
      startDate: null,
      endDate: null,
      sortValue: Number.POSITIVE_INFINITY,
      games: invalidGames.slice().sort(compareGamesByStartTime)
    })
  }

  return groups.sort(compareMatchdayGroups)
}

function getStandaloneGroup(game) {
  const calendarDay = getGameCalendarDay(game?.start_time)

  if (!calendarDay) {
    return {
      id: INVALID_MATCHDAY_ID,
      label: 'Datum unbekannt',
      startDate: null,
      endDate: null,
      sortValue: Number.POSITIVE_INFINITY
    }
  }

  return {
    id: calendarDay.dateKey,
    label: formatMatchdayLabel(calendarDay.dateKey),
    startDate: calendarDay.dateKey,
    endDate: calendarDay.dateKey,
    sortValue: calendarDay.sortValue
  }
}

function createMatchdayId(startDate, endDate) {
  return startDate === endDate
    ? startDate
    : `${startDate}_${endDate}`
}

function compareMatchdayGroups(first, second) {
  if (first.sortValue !== second.sortValue) {
    return first.sortValue - second.sortValue
  }

  return first.id.localeCompare(second.id)
}

function compareGamesByStartTime(firstGame, secondGame) {
  const firstStart = parseGameStartTime(firstGame?.start_time)?.getTime()
  const secondStart = parseGameStartTime(secondGame?.start_time)?.getTime()

  if (firstStart == null && secondStart == null) {
    return String(firstGame?.id ?? '').localeCompare(String(secondGame?.id ?? ''))
  }
  if (firstStart == null) return 1
  if (secondStart == null) return -1
  if (firstStart !== secondStart) return firstStart - secondStart

  return String(firstGame?.id ?? '').localeCompare(String(secondGame?.id ?? ''))
}

function parseDateKey(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey ?? '')

  if (!match) {
    return null
  }

  const [, year, month, day] = match
  const sortValue = Date.UTC(Number(year), Number(month) - 1, Number(day))

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    dateKey,
    sortValue
  }
}

function formatFullDate(date) {
  return `${twoDigits(date.day)}.${twoDigits(date.month)}.${date.year}`
}

function toDateKey(sortValue) {
  return new Date(sortValue).toISOString().slice(0, 10)
}

function twoDigits(value) {
  return String(value).padStart(2, '0')
}

function uniqueStrings(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .filter(value => typeof value === 'string' && value.trim())
      .map(value => value.trim())
  )]
}
