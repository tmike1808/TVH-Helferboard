import { useEffect, useRef, useState } from 'react'

const EMPTY_VALUES = {
  date: '',
  time: '',
  teamId: '',
  opponent: '',
  venue: 'home'
}

function buildStartTime(dateValue, timeValue) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue)
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue)

  if (!dateMatch || !timeMatch) {
    return null
  }

  const [, year, month, day] = dateMatch.map(Number)
  const [, hour, minute] = timeMatch.map(Number)
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0)

  if (
    localDate.getFullYear() !== year
    || localDate.getMonth() !== month - 1
    || localDate.getDate() !== day
    || localDate.getHours() !== hour
    || localDate.getMinutes() !== minute
  ) {
    return null
  }

  // Datum und Uhrzeit werden als lokale Hallenzeit erfasst. toISOString()
  // speichert denselben Zeitpunkt eindeutig; die Anzeige wandelt ihn lokal zurück.
  return localDate.toISOString()
}

export default function GameForm({
  teams = [],
  saving = false,
  error = null,
  onSubmit,
  onCancel
}) {
  const [values, setValues] = useState(EMPTY_VALUES)
  const [validationErrors, setValidationErrors] = useState({})
  const dateInputRef = useRef(null)

  useEffect(() => {
    dateInputRef.current?.focus()
  }, [])

  function updateValue(field, value) {
    setValues(currentValues => ({
      ...currentValues,
      [field]: value
    }))

    setValidationErrors(currentErrors => {
      if (!currentErrors[field] && !currentErrors.teams) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]
      delete nextErrors.teams
      return nextErrors
    })
  }

  function validate() {
    const nextErrors = {}
    const selectedTeam = teams.find(
      team => String(team.id) === values.teamId
    )
    const selectedTeamName = selectedTeam?.name?.trim() ?? ''
    const opponent = values.opponent.trim()
    const startTime = buildStartTime(values.date, values.time)

    if (!values.date) {
      nextErrors.date = 'Bitte wählen Sie ein Datum aus.'
    }

    if (!values.time) {
      nextErrors.time = 'Bitte wählen Sie eine Uhrzeit aus.'
    }

    if (values.date && values.time && !startTime) {
      nextErrors.time = 'Datum und Uhrzeit ergeben keinen gültigen Zeitpunkt.'
    }

    if (!selectedTeam) {
      nextErrors.teamId = 'Bitte wählen Sie eine TVH-Mannschaft aus.'
    }

    if (!opponent) {
      nextErrors.opponent = values.venue === 'home'
        ? 'Bitte geben Sie die Gastmannschaft an.'
        : 'Bitte geben Sie die Heimmannschaft an.'
    }

    if (
      selectedTeamName
      && opponent
      && selectedTeamName.localeCompare(
        opponent,
        'de',
        { sensitivity: 'base' }
      ) === 0
    ) {
      nextErrors.teams =
        'Heim- und Gastmannschaft dürfen nicht identisch sein.'
    }

    setValidationErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return null
    }

    return {
      team_id: selectedTeam.id,
      start_time: startTime,
      opponent,
      is_home: values.venue === 'home'
    }
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (saving) {
      return
    }

    const payload = validate()

    if (payload) {
      onSubmit?.(payload)
    }
  }

  const ownTeamField = (
    <Field
      key="own-team"
      label={values.venue === 'home'
        ? 'Heimmannschaft (TVH)'
        : 'Gastmannschaft (TVH)'}
      error={validationErrors.teamId}
      errorId="team-error"
    >
      <select
        id="team"
        value={values.teamId}
        onChange={event => updateValue('teamId', event.target.value)}
        disabled={saving}
        aria-describedby={validationErrors.teamId ? 'team-error' : undefined}
        className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 disabled:cursor-wait disabled:bg-slate-100"
      >
        <option value="">Mannschaft auswählen</option>
        {teams.map(team => (
          <option key={team.id} value={String(team.id)}>
            {team.name || 'Unbenannte Mannschaft'}
          </option>
        ))}
      </select>
    </Field>
  )

  const opponentField = (
    <Field
      key="opponent"
      label={values.venue === 'home'
        ? 'Gastmannschaft'
        : 'Heimmannschaft'}
      error={validationErrors.opponent}
      errorId="opponent-error"
    >
      <input
        id="opponent"
        type="text"
        value={values.opponent}
        onChange={event => updateValue('opponent', event.target.value)}
        disabled={saving}
        autoComplete="organization"
        aria-describedby={
          validationErrors.opponent ? 'opponent-error' : undefined
        }
        className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 disabled:cursor-wait disabled:bg-slate-100"
        placeholder="Name der gegnerischen Mannschaft"
      />
    </Field>
  )

  return (
    <div className="mb-6 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6">
        <h2 className="text-2xl font-black">Neues Spiel</h2>
        <p className="mt-1 text-slate-600">
          Pflichtfelder sind mit einem Sternchen gekennzeichnet.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {(validationErrors.teams || error) && (
          <div
            className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
            role="alert"
          >
            {validationErrors.teams || error}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Datum"
            error={validationErrors.date}
            errorId="date-error"
          >
            <input
              ref={dateInputRef}
              id="date"
              type="date"
              value={values.date}
              onChange={event => updateValue('date', event.target.value)}
              disabled={saving}
              aria-describedby={validationErrors.date ? 'date-error' : undefined}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 disabled:cursor-wait disabled:bg-slate-100"
            />
          </Field>

          <Field
            label="Uhrzeit"
            error={validationErrors.time}
            errorId="time-error"
          >
            <input
              id="time"
              type="time"
              value={values.time}
              onChange={event => updateValue('time', event.target.value)}
              disabled={saving}
              aria-describedby={validationErrors.time ? 'time-error' : undefined}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 disabled:cursor-wait disabled:bg-slate-100"
            />
          </Field>

          <Field label="Spielort">
            <select
              id="venue"
              value={values.venue}
              onChange={event => updateValue('venue', event.target.value)}
              disabled={saving}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 disabled:cursor-wait disabled:bg-slate-100"
            >
              <option value="home">Heimspiel</option>
              <option value="away">Auswärtsspiel</option>
            </select>
          </Field>

          <div className="hidden sm:block" aria-hidden="true" />

          {values.venue === 'home'
            ? [ownTeamField, opponentField]
            : [opponentField, ownTeamField]}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-12 rounded-2xl border border-slate-300 px-5 font-bold hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            Abbrechen
          </button>

          <button
            type="submit"
            disabled={saving}
            className="h-12 rounded-2xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-400"
          >
            {saving ? 'Spiel wird gespeichert …' : 'Spiel speichern'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, error, errorId, children }) {
  return (
    <div>
      <label
        className="mb-2 block text-sm font-bold text-slate-700"
        htmlFor={children.props.id}
      >
        {label} *
      </label>
      {children}
      {error && (
        <p id={errorId} className="mt-2 text-sm font-bold text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
