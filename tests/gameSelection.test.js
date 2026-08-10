import assert from 'node:assert/strict'
import test from 'node:test'
import {
  pruneGameSelection,
  toggleAllDisplayedGames,
  toggleGameSelection
} from '../src/services/gameSelection.js'

const GAMES = [
  { id: 'game-1' },
  { id: 'game-2' },
  { id: 'game-3' }
]

test('wählt einzelne Spiele aus und wieder ab', () => {
  const selected = toggleGameSelection(new Set(), 'game-2', true)
  const unselected = toggleGameSelection(selected, 'game-2', false)

  assert.deepEqual([...selected], ['game-2'])
  assert.deepEqual([...unselected], [])
})

test('wählt ausschließlich alle dargestellten Spiele aus und wieder ab', () => {
  const selected = toggleAllDisplayedGames(new Set(), GAMES)
  const unselected = toggleAllDisplayedGames(selected, GAMES)

  assert.deepEqual([...selected], ['game-1', 'game-2', 'game-3'])
  assert.deepEqual([...unselected], [])
})

test('entfernt nach einem Reload nicht mehr dargestellte IDs', () => {
  const selected = new Set(['game-1', 'game-deleted', 'game-3'])
  const pruned = pruneGameSelection(selected, GAMES)

  assert.deepEqual([...pruned], ['game-1', 'game-3'])
})
