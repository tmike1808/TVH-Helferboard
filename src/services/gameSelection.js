function getGameIds(games) {
  return (Array.isArray(games) ? games : [])
    .map(game => game?.id)
    .filter(id => typeof id === 'string' && id.trim())
    .map(id => id.trim())
}

export function pruneGameSelection(selectedIds, games) {
  const availableIds = new Set(getGameIds(games))

  return new Set(
    [...selectedIds].filter(id => availableIds.has(String(id)))
  )
}

export function toggleGameSelection(selectedIds, gameId, selected) {
  const nextIds = new Set(selectedIds)
  const id = String(gameId)

  if (selected) {
    nextIds.add(id)
  } else {
    nextIds.delete(id)
  }

  return nextIds
}

export function toggleAllDisplayedGames(selectedIds, games) {
  const displayedIds = getGameIds(games)
  const allSelected = displayedIds.length > 0
    && displayedIds.every(id => selectedIds.has(id))

  return allSelected ? new Set() : new Set(displayedIds)
}
