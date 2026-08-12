import {
  canExportDashboardGames,
  createDashboardExportFilename,
  createDashboardExportModel
} from '../utils/dashboardExportModel.js'

const HEADER_BACKGROUND = '#8B1E2D'
const HEADER_TEXT = '#FFFFFF'
const ROLE_COLUMN_START = 4

export async function downloadDashboardExport({
  games,
  teams,
  roles,
  assignments,
  now = new Date()
}) {
  if (!canExportDashboardGames(games)) {
    throw new Error('Keine Spiele zum Exportieren.')
  }

  const model = createDashboardExportModel({
    games,
    teams,
    roles,
    assignments
  })
  const workbook = createDashboardWorkbook(model)
  const { default: writeExcelFile } = await import('write-excel-file/browser')

  await writeExcelFile(
    workbook.data,
    workbook.sheetOptions,
    workbook.options
  ).toFile(createDashboardExportFilename(now))
}

export function createDashboardWorkbook(model) {
  const columns = Array.isArray(model?.columns) ? model.columns : []
  const rows = Array.isArray(model?.rows) ? model.rows : []
  const header = columns.map(column => ({
    value: column.header,
    height: 26,
    fontWeight: 'bold',
    textColor: HEADER_TEXT,
    backgroundColor: HEADER_BACKGROUND,
    align: 'center',
    verticalAlign: 'center',
    wrap: true
  }))
  const dataRows = rows.map(row => {
    const height = getExportRowHeight(row)

    return row.map((value, index) => ({
      value,
      height,
      align: index < 2 ? 'center' : 'left',
      verticalAlign: 'top',
      wrap: index >= 2
    }))
  })

  return {
    data: [header, ...dataRows],
    sheetOptions: {
      sheet: 'Helferplan',
      columns: columns.map(column => ({ width: column.width })),
      stickyRowsCount: 1,
      orientation: 'landscape'
    },
    options: {
      fontFamily: 'Calibri',
      fontSize: 11
    }
  }
}

function getExportRowHeight(row) {
  const lineCount = (Array.isArray(row) ? row : [])
    .slice(ROLE_COLUMN_START)
    .reduce((maximum, value) => (
      Math.max(maximum, String(value ?? '').split('\n').length)
    ), 1)

  return 24 + ((lineCount - 1) * 15)
}
