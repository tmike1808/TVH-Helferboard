import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatGameStaffingStatus,
  formatRoleStaffingStatus,
  getGameStaffingStatus,
  getRoleStaffingStatus,
  STAFFING_STATUS
} from '../src/utils/staffingStatus.js'

const reducedRole = {
  id: 'sale',
  slots: 4,
  minimum_staff: 3
}

test('reduzierte Mindestbesetzung unterscheidet 0/4 bis 4/4 korrekt', () => {
  const results = [0, 1, 2, 3, 4]
    .map(count => getRoleStaffingStatus(reducedRole, count))

  assert.deepEqual(
    results.map(result => [result.status, result.openSlots]),
    [
      [STAFFING_STATUS.NEEDS_STAFF, 4],
      [STAFFING_STATUS.NEEDS_STAFF, 3],
      [STAFFING_STATUS.NEEDS_STAFF, 2],
      [STAFFING_STATUS.VIABLE, 1],
      [STAFFING_STATUS.FULL, 0]
    ]
  )
})

test('normale Rollen sind erst bei vollständiger Besetzung durchführbar', () => {
  const oneSlotRole = { slots: 1, minimum_staff: 1 }
  const twoSlotRole = { slots: 2, minimum_staff: 2 }

  assert.equal(
    getRoleStaffingStatus(oneSlotRole, 0).status,
    STAFFING_STATUS.NEEDS_STAFF
  )
  assert.equal(
    getRoleStaffingStatus(oneSlotRole, 1).status,
    STAFFING_STATUS.FULL
  )
  assert.deepEqual(
    [0, 1, 2].map(count => getRoleStaffingStatus(twoSlotRole, count).status),
    [
      STAFFING_STATUS.NEEDS_STAFF,
      STAFFING_STATUS.NEEDS_STAFF,
      STAFFING_STATUS.FULL
    ]
  )
})

test('fehlendes minimum_staff fällt sicher auf slots zurück', () => {
  assert.equal(
    getRoleStaffingStatus({ slots: 4 }, 3).status,
    STAFFING_STATUS.NEEDS_STAFF
  )
})

test('Überbelegung erzeugt keine negativen offenen Slots', () => {
  const result = getRoleStaffingStatus(reducedRole, 5)

  assert.equal(result.status, STAFFING_STATUS.FULL)
  assert.equal(result.openSlots, 0)
})

test('Spiel ist nur durchführbar, wenn jede erforderliche Rolle ihr Minimum erreicht', () => {
  const roles = [
    reducedRole,
    { id: 'time', slots: 1, minimum_staff: 1 }
  ]
  const assignments = [
    { id: 's1', role_id: 'sale' },
    { id: 's2', role_id: 'sale' },
    { id: 's3', role_id: 'sale' },
    { id: 't1', role_id: 'time' }
  ]

  const needsStaff = getGameStaffingStatus(roles, assignments.slice(0, 3))
  const viable = getGameStaffingStatus(roles, assignments)
  const full = getGameStaffingStatus(roles, [
    ...assignments,
    { id: 's4', role_id: 'sale' }
  ])

  assert.equal(needsStaff.status, STAFFING_STATUS.NEEDS_STAFF)
  assert.equal(
    formatGameStaffingStatus(needsStaff),
    '3/5 besetzt – Helfer benötigt'
  )
  assert.deepEqual(viable, {
    status: STAFFING_STATUS.VIABLE,
    filledSlots: 4,
    totalSlots: 5,
    openSlots: 1,
    neededForMinimum: 0
  })
  assert.equal(formatGameStaffingStatus(viable), '4/5 besetzt – Durchführbar, 1 Platz offen')
  assert.equal(full.status, STAFFING_STATUS.FULL)
  assert.equal(formatGameStaffingStatus(full), '5/5 besetzt – Vollständig besetzt')
})

test('Statusformulierungen unterscheiden Bedarf, Durchführbarkeit und Vollbelegung', () => {
  assert.equal(
    formatRoleStaffingStatus(getRoleStaffingStatus(reducedRole, 2)),
    '2/4 besetzt – noch 1 benötigt'
  )
  assert.equal(
    formatRoleStaffingStatus(getRoleStaffingStatus(reducedRole, 3)),
    '3/4 besetzt – durchführbar – 1 Platz offen'
  )
  assert.equal(
    formatRoleStaffingStatus(getRoleStaffingStatus(reducedRole, 4)),
    '4/4 besetzt'
  )

  const gameResult = getGameStaffingStatus([reducedRole], [
    { role_id: 'sale' },
    { role_id: 'sale' },
    { role_id: 'sale' }
  ])
  assert.equal(
    formatGameStaffingStatus(gameResult),
    '3/4 besetzt – Durchführbar, 1 Platz offen'
  )
})
