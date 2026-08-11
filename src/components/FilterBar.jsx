import MultiSelectFilter from './MultiSelectFilter'
import { useDashboardStore } from '../store/useDashboardStore'

export default function FilterBar() {
  const {
    selectedCategory,
    selectedTeamIds,
    showPastGames,
    selectedMatchdayIds,
    selectedRoleNames,
    openSelectedRolesOnly,
    hasSavedPreferences,
    preferencesMessage,
    preferencesError,
    setSelectedCategory,
    toggleSelectedTeam,
    clearSelectedTeams,
    setShowPastGames,
    toggleSelectedMatchday,
    clearSelectedMatchdays,
    toggleSelectedRole,
    clearSelectedRoles,
    setOpenSelectedRolesOnly,
    resetFilters,
    saveCurrentDashboardPreferences,
    deleteCurrentDashboardPreferences,
    getAvailableTeams,
    getAvailableMatchdayOptions,
    getAvailableRoleOptions
  } = useDashboardStore()

  const teamOptions = getAvailableTeams().map(team => ({
    value: team.id,
    label: team.name
  }))
  const roleOptions = getAvailableRoleOptions()
  const matchdayOptions = getAvailableMatchdayOptions()
  const openFilterDisabled = selectedRoleNames.length === 0

  return (
    <section
      aria-label="Dashboard-Filter"
      className="mb-6 min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <label className="min-w-0">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Kategorie
          </span>
          <select
            value={selectedCategory}
            onChange={event => setSelectedCategory(event.target.value)}
            aria-label="Kategorie filtern"
            className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-bold outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <option value="all">Alle</option>
            <option value="Aktive">Aktive</option>
            <option value="Jugend">Jugend</option>
          </select>
        </label>

        <MultiSelectFilter
          label="Mannschaften"
          options={teamOptions}
          selectedValues={selectedTeamIds}
          allLabel="Alle Mannschaften"
          selectedPluralLabel="Mannschaften"
          onChange={toggleSelectedTeam}
          onClear={clearSelectedTeams}
        />

        <div className="min-w-0">
          <div className="mb-2 text-sm font-bold text-slate-700">
            Zeitraum
          </div>
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-800">
            <input
              type="checkbox"
              checked={showPastGames}
              onChange={event => setShowPastGames(event.target.checked)}
              className="h-5 w-5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="min-w-0 break-words text-sm font-bold leading-5">
              Vergangene Spiele anzeigen
            </span>
          </label>
        </div>

        <MultiSelectFilter
          label="Spieltage"
          options={matchdayOptions}
          selectedValues={selectedMatchdayIds}
          allLabel="Alle Spieltage"
          selectedPluralLabel="Spieltage"
          onChange={toggleSelectedMatchday}
          onClear={clearSelectedMatchdays}
        />

        <MultiSelectFilter
          label="Helferrollen"
          options={roleOptions}
          selectedValues={selectedRoleNames}
          allLabel="Alle Helferrollen"
          selectedPluralLabel="Rollen"
          onChange={toggleSelectedRole}
          onClear={clearSelectedRoles}
        />

        <div className="min-w-0">
          <div className="mb-2 text-sm font-bold text-slate-700">
            Offene Rollen
          </div>
          <label
            className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-2 ${
              openFilterDisabled
                ? 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400'
                : 'cursor-pointer border-slate-200 bg-slate-50 text-slate-800'
            }`}
          >
            <input
              type="checkbox"
              checked={!openFilterDisabled && openSelectedRolesOnly}
              onChange={event => setOpenSelectedRolesOnly(event.target.checked)}
              disabled={openFilterDisabled}
              className="h-5 w-5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed"
            />
            <span className="min-w-0 break-words text-sm font-bold leading-5">
              Nur Spiele mit offenen ausgewählten Rollen
            </span>
          </label>
          {openFilterDisabled && (
            <p className="mt-2 text-xs text-slate-500">
              Zuerst mindestens eine Helferrolle auswählen.
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:col-span-2 sm:flex-row sm:flex-wrap xl:col-span-6">
          <button
            type="button"
            onClick={saveCurrentDashboardPreferences}
            className="min-h-12 min-w-0 rounded-2xl bg-[#8B1E2D] px-5 font-bold text-white outline-none hover:bg-[#741826] focus-visible:ring-2 focus-visible:ring-[#8B1E2D] focus-visible:ring-offset-2"
          >
            Meine Ansicht speichern
          </button>

          {hasSavedPreferences && (
            <button
              type="button"
              onClick={deleteCurrentDashboardPreferences}
              className="min-h-12 min-w-0 rounded-2xl border border-slate-300 px-5 font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Meine Ansicht löschen
            </button>
          )}

          <button
            type="button"
            onClick={resetFilters}
            className="min-h-12 min-w-0 rounded-2xl border border-slate-300 px-5 font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-5 text-sm" aria-live="polite">
        {preferencesError ? (
          <p className="font-semibold text-red-700" role="alert">
            {preferencesError}
          </p>
        ) : preferencesMessage ? (
          <p className="font-semibold text-emerald-700" role="status">
            {preferencesMessage}
          </p>
        ) : hasSavedPreferences ? (
          <p className="text-slate-500">Meine Ansicht gespeichert</p>
        ) : null}
      </div>
    </section>
  )
}
