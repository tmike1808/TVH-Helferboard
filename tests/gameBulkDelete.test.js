import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BulkDeleteError,
  executeBulkDelete
} from '../src/services/gameBulkDelete.js'

test('weist eine leere Auswahl vor jeder Mutation zurück', async () => {
  let deleteCalls = 0

  await assert.rejects(
    executeBulkDelete([], {
      deleteOne: async () => {
        deleteCalls += 1
      }
    }),
    error =>
      error instanceof BulkDeleteError
      && error.code === 'INVALID_GAME_IDS'
  )

  assert.equal(deleteCalls, 0)
})

test('weist ungültige IDs ab, bevor ein ausgewähltes Spiel verarbeitet wird', async () => {
  const processedIds = []

  await assert.rejects(
    executeBulkDelete(['game-1', '  '], {
      deleteOne: async id => processedIds.push(id)
    }),
    error => error.code === 'INVALID_GAME_IDS'
  )

  assert.deepEqual(processedIds, [])
})

test('verarbeitet ausschließlich die explizit ausgewählten eindeutigen IDs', async () => {
  const processedIds = []

  const result = await executeBulkDelete(
    ['game-2', 'game-1', 'game-2'],
    {
      deleteOne: async id => {
        processedIds.push(id)
        return { id }
      }
    }
  )

  assert.deepEqual(processedIds, ['game-2', 'game-1'])
  assert.deepEqual(result.requestedIds, ['game-2', 'game-1'])
  assert.deepEqual(
    result.successful.map(item => item.id),
    ['game-2', 'game-1']
  )
  assert.deepEqual(result.failed, [])
})

test('meldet vollständigen Erfolg und aktualisiert genau einmal', async () => {
  let refreshCalls = 0
  let refreshedIds = []

  const result = await executeBulkDelete(['game-1', 'game-2'], {
    deleteOne: async id => ({ id }),
    refresh: async deleteResult => {
      refreshCalls += 1
      refreshedIds = deleteResult.successful.map(item => item.id)
    }
  })

  assert.equal(result.successful.length, 2)
  assert.equal(result.failed.length, 0)
  assert.equal(result.refreshAttempted, true)
  assert.equal(result.refreshError, null)
  assert.equal(refreshCalls, 1)
  assert.deepEqual(refreshedIds, ['game-1', 'game-2'])
})

test('weist einen Teilfehler eindeutig der betroffenen ID zu', async () => {
  const failure = Object.assign(new Error('Technischer Testfehler'), {
    code: 'DELETE_FAILED'
  })

  const result = await executeBulkDelete(
    ['game-ok', 'game-failed', 'game-ok-2'],
    {
      deleteOne: async id => {
        if (id === 'game-failed') {
          throw failure
        }

        return { id }
      }
    }
  )

  assert.deepEqual(
    result.successful.map(item => item.id),
    ['game-ok', 'game-ok-2']
  )
  assert.equal(result.failed.length, 1)
  assert.equal(result.failed[0].id, 'game-failed')
  assert.equal(result.failed[0].code, 'DELETE_FAILED')
  assert.equal(
    result.failed[0].message,
    'Das ausgewählte Spiel konnte nicht gelöscht werden.'
  )
})

test('verhindert eine parallele zweite Sammellöschung', async () => {
  let releaseFirstDelete
  const firstDeleteGate = new Promise(resolve => {
    releaseFirstDelete = resolve
  })

  const firstRun = executeBulkDelete(['game-1'], {
    deleteOne: async id => {
      await firstDeleteGate
      return { id }
    }
  })

  await Promise.resolve()

  try {
    await assert.rejects(
      executeBulkDelete(['game-2'], {
        deleteOne: async id => ({ id })
      }),
      error => error.code === 'BULK_DELETE_IN_PROGRESS'
    )
  } finally {
    releaseFirstDelete()
  }

  const firstResult = await firstRun
  assert.deepEqual(
    firstResult.successful.map(item => item.id),
    ['game-1']
  )
})
