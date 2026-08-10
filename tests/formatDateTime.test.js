import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatGameDate,
  formatGameTime
} from '../src/utils/formatDateTime.js'

test('formatiert die Anwurfzeit ohne Verschiebung aus lokaler Hallenzeit', () => {
  const localStart = new Date(2026, 7, 29, 18, 30, 0, 0)

  assert.equal(formatGameTime(localStart.toISOString()), '18:30 Uhr')
  assert.equal(formatGameDate(localStart.toISOString()), '29.08.2026')
})

test('liefert für fehlende oder ungültige Startzeiten einen Platzhalter', () => {
  assert.equal(formatGameTime(null), '–')
  assert.equal(formatGameTime('kein Datum'), '–')
  assert.equal(formatGameDate(undefined), '–')
})

test('formatiert Mitternacht im geforderten 00:00-Format', () => {
  const localMidnight = new Date(2026, 7, 30, 0, 0, 0, 0)

  assert.equal(formatGameTime(localMidnight.toISOString()), '00:00 Uhr')
})
