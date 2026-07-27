import readExcelFile from 'read-excel-file/browser'
import {
  GameImportError,
  parseImportSheet,
  validateImportFile
} from './gameImportParser'

function hasAnyData(rows) {
  return rows.some(row =>
    Array.isArray(row)
    && row.some(value => String(value ?? '').trim() !== '')
  )
}

export async function readGameImportFile(file) {
  validateImportFile(file)

  let sheets

  try {
    sheets = await readExcelFile(file)
  } catch (error) {
    throw new GameImportError(
      'READ_FAILED',
      'Die Excel-Datei konnte nicht gelesen werden.',
      { cause: error }
    )
  }

  const nonEmptySheets = sheets.filter(sheet => hasAnyData(sheet.data ?? []))

  if (nonEmptySheets.length === 0) {
    throw new GameImportError(
      'EMPTY_WORKBOOK',
      'Die Excel-Datei enthält kein befülltes Tabellenblatt.'
    )
  }

  let firstValidationError = null

  for (const sheet of nonEmptySheets) {
    try {
      return parseImportSheet(sheet.data, sheet.sheet)
    } catch (error) {
      if (
        error instanceof GameImportError
        && ['MISSING_COLUMNS', 'EMPTY_SHEET'].includes(error.code)
      ) {
        firstValidationError ??= error
        continue
      }

      throw error
    }
  }

  throw firstValidationError ?? new GameImportError(
    'NO_IMPORT_SHEET',
    'Es wurde kein geeignetes Tabellenblatt gefunden.'
  )
}
