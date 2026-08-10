let bulkDeleteRunning = false

export class BulkDeleteError extends Error {
  constructor(code, message, cause, details = {}) {
    super(message, { cause })
    this.name = 'BulkDeleteError'
    this.code = code
    this.details = details
  }
}

function normalizeGameIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new BulkDeleteError(
      'INVALID_GAME_IDS',
      'Wählen Sie mindestens ein Spiel zum Löschen aus.'
    )
  }

  const normalizedIds = ids.map(id => {
    if (typeof id !== 'string' || !id.trim()) {
      throw new BulkDeleteError(
        'INVALID_GAME_IDS',
        'Die Auswahl enthält eine ungültige Spiel-ID.'
      )
    }

    return id.trim()
  })

  return [...new Set(normalizedIds)]
}

export async function executeBulkDelete(
  ids,
  {
    deleteOne,
    onProgress,
    refresh
  } = {}
) {
  const gameIds = normalizeGameIds(ids)

  if (typeof deleteOne !== 'function') {
    throw new BulkDeleteError(
      'DELETE_HANDLER_MISSING',
      'Die Sammellöschung ist nicht korrekt konfiguriert.'
    )
  }

  if (bulkDeleteRunning) {
    throw new BulkDeleteError(
      'BULK_DELETE_IN_PROGRESS',
      'Eine Sammellöschung wird bereits ausgeführt.'
    )
  }

  bulkDeleteRunning = true

  try {
    const successful = []
    const failed = []

    for (let index = 0; index < gameIds.length; index += 1) {
      const id = gameIds[index]

      try {
        const deletedGame = await deleteOne(id)
        successful.push({ id, game: deletedGame })
      } catch (error) {
        failed.push({
          id,
          code: error?.code || 'BULK_DELETE_ITEM_FAILED',
          message: 'Das ausgewählte Spiel konnte nicht gelöscht werden.',
          error
        })
      }

      onProgress?.({
        processed: index + 1,
        total: gameIds.length,
        successful: successful.length,
        failed: failed.length
      })
    }

    const result = {
      requestedIds: gameIds,
      successful,
      failed,
      refreshAttempted: false,
      refreshError: null
    }

    if (successful.length > 0 && typeof refresh === 'function') {
      result.refreshAttempted = true

      try {
        await refresh(result)
      } catch (error) {
        result.refreshError = new BulkDeleteError(
          'BULK_DELETE_REFRESH_FAILED',
          'Die Daten konnten nach der Sammellöschung nicht vollständig aktualisiert werden.',
          error
        )
      }
    }

    return result
  } finally {
    bulkDeleteRunning = false
  }
}
