import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatGameDate,
  formatGameTime
} from '../src/utils/formatDateTime.js'

test('formatiert die Anwurfzeit ohne Verschiebung aus lokaler Hallenzeit', () => {
  assert.equal(formatGameTime('2026-08-29T16:30:00.000Z'), '18:30 Uhr')
  assert.equal(formatGameDate('2026-08-29T16:30:00.000Z'), '29.08.2026')
  assert.equal(formatGameTime('2026-12-05T17:30:00.000Z'), '18:30 Uhr')
})

test('liefert für fehlende oder ungültige Startzeiten einen Platzhalter', () => {
  assert.equal(formatGameTime(null), '–')
  assert.equal(formatGameTime('kein Datum'), '–')
  assert.equal(formatGameDate(undefined), '–')
})

test('formatiert Mitternacht im geforderten 00:00-Format', () => {
  assert.equal(formatGameTime('2026-08-29T22:00:00.000Z'), '00:00 Uhr')
})
