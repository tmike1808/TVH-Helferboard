const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

const timeFormatter = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
})

function parseStartTime(startTime) {
  if (!startTime) {
    return null
  }

  const value = new Date(startTime)
  return Number.isNaN(value.getTime()) ? null : value
}

export function formatGameDate(startTime) {
  const value = parseStartTime(startTime)
  return value ? dateFormatter.format(value) : '–'
}

export function formatGameTime(startTime) {
  const value = parseStartTime(startTime)
  return value ? `${timeFormatter.format(value)} Uhr` : '–'
}
