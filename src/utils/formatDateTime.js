export const GAME_TIME_ZONE = 'Europe/Berlin'

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: GAME_TIME_ZONE
})

const timeFormatter = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: GAME_TIME_ZONE
})

const calendarDayFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: GAME_TIME_ZONE
})

export function parseGameStartTime(startTime) {
  if (!startTime) {
    return null
  }

  const value = new Date(startTime)
  return Number.isNaN(value.getTime()) ? null : value
}

export function getGameCalendarDay(startTime) {
  const value = parseGameStartTime(startTime)

  if (!value) {
    return null
  }

  const parts = Object.fromEntries(
    calendarDayFormatter.formatToParts(value)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value])
  )
  const year = Number(parts.year)
  const month = Number(parts.month)
  const day = Number(parts.day)
  const sortValue = Date.UTC(year, month - 1, day)

  return {
    year,
    month,
    day,
    weekday: new Date(sortValue).getUTCDay(),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    sortValue
  }
}

export function getBerlinDateKey(value = new Date()) {
  return getGameCalendarDay(value)?.dateKey ?? null
}

export function formatGameDate(startTime) {
  const value = parseGameStartTime(startTime)
  return value ? dateFormatter.format(value) : '–'
}

export function formatGameTime(startTime) {
  const value = parseGameStartTime(startTime)
  return value ? `${timeFormatter.format(value)} Uhr` : '–'
}
