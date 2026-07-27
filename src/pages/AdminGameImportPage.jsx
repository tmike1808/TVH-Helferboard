import { useEffect, useMemo, useRef, useState } from 'react'
import GameImportConfirmDialog from '../components/admin/GameImportConfirmDialog'
import GameImportPreview from '../components/admin/GameImportPreview'
import GameImportResult from '../components/admin/GameImportResult'
import Topbar from '../components/Topbar'
import {
  getGames,
  getTeams,
  importGames,
  saveTeamImportName
} from '../services/gameService'
import {
  GameImportError,
  analyzeImportRows,
  getImportSummary,
  normalizeComparisonText
} from '../services/gameImportParser'
import { readGameImportFile } from '../services/gameImportService'
import { createImportController } from '../services/gameImportWorkflow'
import { useDashboardStore } from '../store/useDashboardStore'

function getImportErrorMessage(error) {
  if (error instanceof GameImportError) {
    return error.message
  }

  return (
    'Die Excel-Datei konnte nicht verarbeitet werden. '
    + 'Bitte prüfen Sie die Datei und versuchen Sie es erneut.'
  )
}

function getMutationErrorMessage() {
  return (
    'Der Import konnte nicht vorbereitet oder abgeschlossen werden. '
    + 'Es wurden nur eindeutig bestätigte Einzelzeilen verarbeitet. '
    + 'Bitte laden Sie die Daten erneut und versuchen Sie es nochmals.'
  )
}

export default function AdminGameImportPage() {
  const [teams, setTeams] = useState([])
  const [games, setGames] = useState([])
  const [loadingReferenceData, setLoadingReferenceData] = useState(true)
  const [referenceError, setReferenceError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [parsedImport, setParsedImport] = useState(null)
  const [manualMappings, setManualMappings] = useState({})
  const [rememberedMappings, setRememberedMappings] = useState({})
  const [readingFile, setReadingFile] = useState(false)
  const [fileError, setFileError] = useState(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState(null)
  const importControllerRef = useRef(createImportController())
  const importingRef = useRef(false)
  const loadDashboardData = useDashboardStore(state => state.loadData)

  useEffect(() => {
    let cancelled = false

    async function loadReferenceData() {
      let loadedTeams

      try {
        loadedTeams = await getTeams()
      } catch (error) {
        console.error('Supabase-Teams konnten nicht geladen werden.', error)

        if (!cancelled) {
          setReferenceError(
            'Die Supabase-Teams konnten nicht geladen werden. '
            + 'Bitte versuchen Sie es später erneut.'
          )
          setLoadingReferenceData(false)
        }
        return
      }

      try {
        const loadedGames = await getGames(loadedTeams)

        if (!cancelled) {
          setTeams(loadedTeams)
          setGames(loadedGames)
        }
      } catch (error) {
        console.error('Vorhandene Spiele konnten nicht geladen werden.', error)

        if (!cancelled) {
          setReferenceError(
            'Die vorhandenen Spiele konnten nicht geladen werden. '
            + 'Bitte versuchen Sie es später erneut.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingReferenceData(false)
        }
      }
    }

    loadReferenceData()

    return () => {
      cancelled = true
    }
  }, [])

  const analyzedRows = useMemo(
    () => parsedImport
      ? analyzeImportRows(
        parsedImport.rows,
        teams,
        games,
        manualMappings
      )
      : [],
    [games, manualMappings, parsedImport, teams]
  )
  const importSummary = useMemo(
    () => getImportSummary(analyzedRows),
    [analyzedRows]
  )
  const manualMappingEntries = useMemo(
    () => Object.entries(manualMappings)
      .map(([normalizedName, teamId]) => {
        const row = parsedImport?.rows.find(
          candidate =>
            normalizeComparisonText(candidate.importTeamName)
            === normalizedName
        )
        const team = teams.find(
          candidate => String(candidate.id) === String(teamId)
        )

        return row?.importTeamName && team
          ? {
            normalizedName,
            importName: row.importTeamName,
            team
          }
          : null
      })
      .filter(Boolean),
    [manualMappings, parsedImport, teams]
  )

  async function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file || importing) {
      return
    }

    setSelectedFile(file)
    setParsedImport(null)
    setManualMappings({})
    setRememberedMappings({})
    setFileError(null)
    setImportError(null)
    setImportResult(null)
    setReadingFile(true)

    try {
      const result = await readGameImportFile(file)
      setParsedImport(result)
    } catch (error) {
      console.error('Excel-Datei konnte nicht verarbeitet werden.', error)
      setFileError(getImportErrorMessage(error))
    } finally {
      setReadingFile(false)
    }
  }

  function resetFile() {
    if (readingFile || importing) {
      return
    }

    setSelectedFile(null)
    setParsedImport(null)
    setManualMappings({})
    setRememberedMappings({})
    setFileError(null)
    setImportError(null)
    setImportResult(null)
    setConfirmOpen(false)
    setProgress(null)
    setFileInputKey(currentKey => currentKey + 1)
  }

  function updateManualMapping(importTeamName, teamId) {
    if (importing) {
      return
    }

    const key = normalizeComparisonText(importTeamName)

    setManualMappings(currentMappings => {
      if (!teamId) {
        const nextMappings = { ...currentMappings }
        delete nextMappings[key]
        return nextMappings
      }

      return {
        ...currentMappings,
        [key]: teamId
      }
    })
    setRememberedMappings(currentMappings => {
      const nextMappings = { ...currentMappings }
      delete nextMappings[key]
      return nextMappings
    })
    setImportResult(null)
  }

  function toggleRememberMapping(normalizedName, checked) {
    if (importing) {
      return
    }

    setRememberedMappings(currentMappings => ({
      ...currentMappings,
      [normalizedName]: checked
    }))
  }

  function openConfirmDialog() {
    if (
      importing
      || readingFile
      || !parsedImport
      || importSummary.ready === 0
    ) {
      return
    }

    setImportError(null)
    setConfirmOpen(true)
  }

  function closeConfirmDialog() {
    if (importing) {
      return
    }

    setConfirmOpen(false)
  }

  async function handleConfirmedImport() {
    if (importingRef.current || !parsedImport) {
      return
    }

    importingRef.current = true
    setImporting(true)
    setImportError(null)
    setImportResult(null)
    setProgress(null)

    try {
      const result = await importControllerRef.current.execute({
        confirmed: true,
        parsedRows: parsedImport.rows,
        teams,
        manualMappings,
        rememberedMappings,
        loadGames: getGames,
        insertGames: importGames,
        saveTeamImportName,
        refreshDashboard: loadDashboardData,
        onProgress: setProgress
      })

      if (result.status === 'already-running') {
        return
      }

      setGames(result.refreshedGames)
      setImportResult(result)

      if (result.aliases.successful.length > 0) {
        const updatedTeams = new Map(
          result.aliases.successful.map(alias => [
            String(alias.team.id),
            alias.team
          ])
        )

        setTeams(currentTeams => currentTeams.map(team =>
          updatedTeams.get(String(team.id)) ?? team
        ))
      }
    } catch (error) {
      console.error('Spielimport konnte nicht abgeschlossen werden.', error)
      setImportError(getMutationErrorMessage())
    } finally {
      importingRef.current = false
      setImporting(false)
      setConfirmOpen(false)
      setProgress(null)
    }
  }

  const pageReady = !loadingReferenceData && !referenceError
  const inputsLocked = readingFile || importing
  const importButtonDisabled =
    !parsedImport
    || importSummary.ready === 0
    || inputsLocked

  return (
    <section>
      <Topbar
        title="Spielimport"
        subtitle="Excel-Datei prüfen und Mannschaften zuordnen"
      />

      {loadingReferenceData && (
        <div
          className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm"
          role="status"
        >
          Teams und vorhandene Spiele werden geladen …
        </div>
      )}

      {!loadingReferenceData && referenceError && (
        <div
          className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-800 shadow-sm"
          role="alert"
        >
          <h2 className="text-lg font-black">Laden fehlgeschlagen</h2>
          <p className="mt-2">{referenceError}</p>
        </div>
      )}

      {pageReady && (
        <>
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-2xl font-black">Excel-Datei auswählen</h2>
            <p className="mt-2 text-slate-600">
              Erlaubtes Format: .xlsx. Die Datei wird ausschließlich in
              diesem Browser gelesen und nicht hochgeladen.
            </p>

            <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="game-import-file"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Excel-Datei
                </label>
                <input
                  key={fileInputKey}
                  id="game-import-file"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  disabled={inputsLocked}
                  className="block w-full rounded-2xl border border-slate-300 bg-white text-sm file:mr-4 file:border-0 file:bg-slate-900 file:px-4 file:py-3 file:font-bold file:text-white hover:file:bg-slate-800 disabled:cursor-wait disabled:bg-slate-100"
                />
              </div>

              <button
                type="button"
                onClick={resetFile}
                disabled={!selectedFile || inputsLocked}
                className="h-12 rounded-2xl border border-slate-300 px-5 font-bold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Auswahl zurücksetzen
              </button>
            </div>

            {selectedFile && (
              <p className="mt-4 break-all text-sm text-slate-700">
                Ausgewählt: <strong>{selectedFile.name}</strong>
              </p>
            )}

            {readingFile && (
              <div className="mt-4 font-bold text-slate-700" role="status">
                Excel-Datei wird eingelesen …
              </div>
            )}

            {fileError && (
              <div
                className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
                role="alert"
              >
                {fileError}
              </div>
            )}

            {parsedImport && (
              <div
                className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
                role="status"
              >
                Tabellenblatt <strong>{parsedImport.sheetName}</strong> mit{' '}
                <strong>{parsedImport.rows.length}</strong> Datenzeilen
                eingelesen.
              </div>
            )}
          </div>

          {parsedImport && (
            <>
              <GameImportPreview
                rows={analyzedRows}
                teams={teams}
                disabled={inputsLocked}
                onMappingChange={updateManualMapping}
              />

              {manualMappingEntries.length > 0 && (
                <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <h2 className="text-xl font-black">
                    Manuelle Zuordnungen
                  </h2>
                  <p className="mt-2 text-slate-600">
                    Das Speichern ist freiwillig und überschreibt keinen
                    vorhandenen Importnamen.
                  </p>
                  <div className="mt-4 space-y-3">
                    {manualMappingEntries.map(mapping => (
                      <label
                        key={mapping.normalizedName}
                        className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4"
                      >
                        <input
                          type="checkbox"
                          checked={
                            rememberedMappings[mapping.normalizedName] === true
                          }
                          disabled={inputsLocked}
                          onChange={event => toggleRememberMapping(
                            mapping.normalizedName,
                            event.target.checked
                          )}
                          className="mt-1 h-4 w-4"
                        />
                        <span>
                          <strong>{mapping.importName}</strong> künftig{' '}
                          <strong>{mapping.team.name}</strong> zuordnen und
                          diese Zuordnung für zukünftige Importe merken.
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {importError && (
                <div
                  className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
                  role="alert"
                >
                  {importError}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={openConfirmDialog}
                  disabled={importButtonDisabled}
                  className="h-12 rounded-2xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                  {importing
                    ? 'Import läuft …'
                    : `${importSummary.ready} ${
                      importSummary.ready === 1 ? 'Spiel' : 'Spiele'
                    } importieren`}
                </button>
              </div>

              <GameImportResult
                result={importResult}
                onReset={resetFile}
              />
            </>
          )}
        </>
      )}

      <GameImportConfirmDialog
        open={confirmOpen}
        importableCount={importSummary.ready}
        skippedCount={importSummary.total - importSummary.ready}
        importing={importing}
        progress={progress}
        onConfirm={handleConfirmedImport}
        onCancel={closeConfirmDialog}
      />
    </section>
  )
}
