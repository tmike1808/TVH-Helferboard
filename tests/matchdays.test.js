import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createMatchdayGroups,
  formatMatchdayLabel,
  getMatchdayOptions,
  INVALID_MATCHDAY_ID
} from '../src/utils/matchdays.js'
import { getGameCalendarDay } from '../src/utils/formatDateTime.js'

function game(id, localDate, hour = 12) {
  const winter = [1, 2, 3, 11, 12].includes(Number(localDate.slice(5, 7)))
  const utcHour = hour - (winter ? 1 : 2)

  return {
    id,
    start_time: `${localDate}T${String(utcHour).padStart(2, '0')}:00:00.000Z`
  }
}

function groupIds(games) {
  return createMatchdayGroups(games).map(group => group.id)
}

test('ein einzelner Samstag bleibt ein eigener Spieltag', () => {
  assert.deepEqual(groupIds([game('sat', '2026-08-29')]), ['2026-08-29'])
})

test('ein einzelner Sonntag bleibt ein eigener Spieltag', () => {
  assert.deepEqual(groupIds([game('sun', '2026-08-30')]), ['2026-08-30'])
})

test('Samstag und unmittelbar folgender Sonntag bilden einen Spieltag', () => {
  assert.deepEqual(
    groupIds([game('sat', '2026-08-29'), game('sun', '2026-08-30')]),
    ['2026-08-29_2026-08-30']
  )
})

test('mehrere Spiele eines Wochenendes bleiben in einer Gruppe', () => {
  const groups = createMatchdayGroups([
    game('sat-late', '2026-08-29', 18),
    game('sun', '2026-08-30', 10),
    game('sat-early', '2026-08-29', 14)
  ])

  assert.equal(groups.length, 1)
  assert.deepEqual(groups[0].games.map(item => item.id), [
    'sat-early',
    'sat-late',
    'sun'
  ])
})

test('zwei Samstage ohne Sonntag bleiben getrennt', () => {
  assert.deepEqual(groupIds([
    game('sat-1', '2026-08-29'),
    game('sat-2', '2026-09-05')
  ]), ['2026-08-29', '2026-09-05'])
})

test('Sonntag und Montag werden nicht verbunden', () => {
  assert.deepEqual(groupIds([
    game('sun', '2026-08-30'),
    game('mon', '2026-08-31')
  ]), ['2026-08-30', '2026-08-31'])
})

test('Freitag und Samstag werden nicht verbunden', () => {
  assert.deepEqual(groupIds([
    game('fri', '2026-08-28'),
    game('sat', '2026-08-29')
  ]), ['2026-08-28', '2026-08-29'])
})

test('ein Wochentag außerhalb des Wochenendes bleibt einzeln', () => {
  assert.deepEqual(groupIds([game('wed', '2026-09-02')]), ['2026-09-02'])
})

test('Beschriftungen decken Einzel-, Monats- und Jahresgrenzen ab', () => {
  assert.equal(formatMatchdayLabel('2026-08-29'), '29.08.2026')
  assert.equal(formatMatchdayLabel('2026-08-29', '2026-08-30'), '29.–30.08.2026')
  assert.equal(formatMatchdayLabel('2026-10-31', '2026-11-01'), '31.10.–01.11.2026')
  assert.equal(formatMatchdayLabel('2022-12-31', '2023-01-01'), '31.12.2022–01.01.2023')
})

test('Wochenenden über Monats- und Jahresgrenzen werden tatsächlich gruppiert', () => {
  const monthBoundary = createMatchdayGroups([
    game('october', '2026-10-31'),
    game('november', '2026-11-01')
  ])
  const yearBoundary = createMatchdayGroups([
    game('december', '2022-12-31'),
    game('january', '2023-01-01')
  ])

  assert.equal(monthBoundary[0].id, '2026-10-31_2026-11-01')
  assert.equal(monthBoundary[0].label, '31.10.–01.11.2026')
  assert.equal(yearBoundary[0].id, '2022-12-31_2023-01-01')
  assert.equal(yearBoundary[0].label, '31.12.2022–01.01.2023')
})

test('mehrere Spiele desselben Datums ergeben genau eine Gruppe', () => {
  const groups = createMatchdayGroups([
    game('second', '2026-09-02', 18),
    game('first', '2026-09-02', 16)
  ])

  assert.equal(groups.length, 1)
  assert.equal(groups[0].label, '02.09.2026')
  assert.deepEqual(groups[0].games.map(item => item.id), ['first', 'second'])
})

test('Eingabereihenfolge beeinflusst Gruppen und Spielreihenfolge nicht', () => {
  const input = [
    game('sun', '2026-08-30', 10),
    game('earlier', '2026-08-29', 14),
    game('later', '2026-08-29', 18)
  ]
  const groups = createMatchdayGroups(input)

  assert.equal(groups[0].id, '2026-08-29_2026-08-30')
  assert.deepEqual(groups[0].games.map(item => item.id), [
    'earlier',
    'later',
    'sun'
  ])
})

test('gefilterte Teilmengen behalten die Identität des vollständigen Spieltags', () => {
  const allGames = [game('sat', '2026-08-29'), game('sun', '2026-08-30')]
  const groups = createMatchdayGroups([allGames[1]], allGames)

  assert.equal(groups.length, 1)
  assert.equal(groups[0].id, '2026-08-29_2026-08-30')
  assert.equal(groups[0].label, '29.–30.08.2026')
  assert.deepEqual(groups[0].games.map(item => item.id), ['sun'])
})

test('leere Gruppen werden nach dem Filtern nicht ausgegeben', () => {
  const allGames = [game('sat', '2026-08-29'), game('next', '2026-09-05')]
  const groups = createMatchdayGroups([allGames[1]], allGames)

  assert.deepEqual(groups.map(group => group.id), ['2026-09-05'])
})

test('ungültige Startzeiten bleiben sichtbar und folgen am Ende', () => {
  const groups = createMatchdayGroups([
    { id: 'missing', start_time: null },
    game('valid', '2026-08-29'),
    { id: 'invalid', start_time: 'kein Datum' }
  ])

  assert.deepEqual(groups.map(group => group.id), ['2026-08-29', INVALID_MATCHDAY_ID])
  assert.deepEqual(groups[1].games.map(item => item.id), ['invalid', 'missing'])
})

test('Filteroptionen verwenden stabile IDs und chronologische Labels', () => {
  assert.deepEqual(getMatchdayOptions([
    game('later', '2026-09-05'),
    game('sat', '2026-08-29'),
    game('sun', '2026-08-30')
  ]), [
    { value: '2026-08-29_2026-08-30', label: '29.–30.08.2026' },
    { value: '2026-09-05', label: '05.09.2026' }
  ])
})

test('Europe/Berlin bestimmt Sommer- und Wintertag ohne UTC-Verschiebung', () => {
  assert.equal(
    getGameCalendarDay('2026-08-29T22:30:00.000Z').dateKey,
    '2026-08-30'
  )
  assert.equal(
    getGameCalendarDay('2026-12-05T23:30:00.000Z').dateKey,
    '2026-12-06'
  )
})
