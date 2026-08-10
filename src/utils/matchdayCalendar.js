import { GAME_TIME_ZONE, getGameCalendarDay } from './formatDateTime.js'
import { createMatchdayGroups } from './matchdays.js'

const MONTH_KEY_PATTERN = /^(\d{4})-(\d{2})$/
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

const monthFormatter = new Intl.DateTimeFormat('de-DE', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
})

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
})

export function getCalendarMatchdayGroups(games) {
  return createMatchdayGroups(games)
    .filter(group => group.startDate && group.endDate)
}

export function getInitialCalendarMonth(
  matchdayGroups,
  now = new Date()
) {
  const groups = validGroups(matchdayGroups)
  const today = getBerlinDateKey(now)
  const nextGroup = groups.find(group => group.startDate >= today)

  if (nextGroup) {
    return monthFromDateKey(nextGroup.startDate)
  }

  const lastGroup = groups.at(-1)
  return lastGroup
    ? monthFromDateKey(lastGroup.startDate)
    : monthFromDateKey(today)
}

export function createCalendarMonth(monthKey, matchdayGroups) {
  const month = parseMonthKey(monthKey)

  if (!month) {
    return []
  }

  const firstDay = Date.UTC(month.year, month.month - 1, 1)
  const daysInMonth = new Date(Date.UTC(month.year, month.month, 0))
    .getUTCDate()
  const leadingEmptyDays = (new Date(firstDay).getUTCDay() + 6) % 7
  const totalCells = Math.ceil((leadingEmptyDays + daysInMonth) / 7) * 7
  const matchdaysByDate = getMatchdayByDate(matchdayGroups)

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - leadingEmptyDays + 1

    if (day < 1 || day > daysInMonth) {
      return {
        key: `empty-${index}`,
        dateKey: null,
        day: null,
        matchday: null
      }
    }

    const dateKey = toDateKey(month.year, month.month, day)

    return {
      key: dateKey,
      dateKey,
      day,
      matchday: matchdaysByDate.get(dateKey) ?? null
    }
  })
}

export function getMatchdayByDate(matchdayGroups) {
  const matchdaysByDate = new Map()

  for (const group of validGroups(matchdayGroups)) {
    let current = parseDateKey(group.startDate)
    const end = parseDateKey(group.endDate)

    if (!current || !end) {
      continue
    }

    while (current.sortValue <= end.sortValue) {
      matchdaysByDate.set(current.dateKey, group)
      current = parseDateKey(toDateKeyFromSortValue(
        current.sortValue + 24 * 60 * 60 * 1000
      ))
    }
  }

  return matchdaysByDate
}

export function getCalendarSelection(selectedMatchdayIds, matchdayId) {
  const selectedIds = uniqueStrings(selectedMatchdayIds)
  const clickedId = typeof matchdayId === 'string' ? matchdayId.trim() : ''

  if (!clickedId) {
    return selectedIds
  }

  return selectedIds.length === 1 && selectedIds[0] === clickedId
    ? []
    : [clickedId]
}

export function getSelectedCalendarDates(matchdayGroups, selectedMatchdayIds) {
  const selectedIds = new Set(uniqueStrings(selectedMatchdayIds))

  return new Set(
    [...getMatchdayByDate(matchdayGroups).entries()]
      .filter(([, group]) => selectedIds.has(group.id))
      .map(([dateKey]) => dateKey)
  )
}

export function shiftCalendarMonth(monthKey, offset) {
  const month = parseMonthKey(monthKey)
  const step = Number.isInteger(offset) ? offset : 0

  if (!month) {
    return null
  }

  const value = new Date(Date.UTC(month.year, month.month - 1 + step, 1))
  return `${value.getUTCFullYear()}-${twoDigits(value.getUTCMonth() + 1)}`
}

export function formatCalendarMonth(monthKey) {
  const month = parseMonthKey(monthKey)

  return month
    ? monthFormatter.format(new Date(Date.UTC(month.year, month.month - 1, 1)))
    : ''
}

export function formatCalendarDate(dateKey) {
  const date = parseDateKey(dateKey)
  return date ? dateFormatter.format(new Date(date.sortValue)) : ''
}

export function getBerlinDateKey(now = new Date()) {
  const day = getGameCalendarDay(now)

  if (day) {
    return day.dateKey
  }

  const fallback = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: GAME_TIME_ZONE
  }).formatToParts(new Date())
  const parts = Object.fromEntries(
    fallback
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value])
  )

  return `${parts.year}-${parts.month}-${parts.day}`
}

function validGroups(matchdayGroups) {
  return (Array.isArray(matchdayGroups) ? matchdayGroups : [])
    .filter(group => (
      parseDateKey(group?.startDate)
      && parseDateKey(group?.endDate)
    ))
    .slice()
    .sort((first, second) => first.startDate.localeCompare(second.startDate))
}

function parseMonthKey(monthKey) {
  const match = MONTH_KEY_PATTERN.exec(monthKey ?? '')

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])

  if (month < 1 || month > 12) {
    return null
  }

  return { year, month }
}

function parseDateKey(dateKey) {
  const match = DATE_KEY_PATTERN.exec(dateKey ?? '')

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const sortValue = Date.UTC(year, month - 1, day)
  const value = new Date(sortValue)

  if (
    value.getUTCFullYear() !== year
    || value.getUTCMonth() + 1 !== month
    || value.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day, dateKey, sortValue }
}

function monthFromDateKey(dateKey) {
  return dateKey.slice(0, 7)
}

function toDateKey(year, month, day) {
  return `${year}-${twoDigits(month)}-${twoDigits(day)}`
}

function toDateKeyFromSortValue(sortValue) {
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
