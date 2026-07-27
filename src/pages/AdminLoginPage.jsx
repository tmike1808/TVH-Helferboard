import { useRef, useState } from 'react'
import Topbar from '../components/Topbar'

export default function AdminLoginPage({
  loading = false,
  authError = null,
  onLogin,
  onBack
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const submittingRef = useRef(false)

  function updateField(field, value) {
    if (field === 'email') {
      setEmail(value)
    } else {
      setPassword(value)
    }

    setValidationErrors(currentErrors => {
      if (!currentErrors[field]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]
      return nextErrors
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (loading || submittingRef.current) {
      return
    }

    const normalizedEmail = email.trim()
    const nextErrors = {}

    if (!normalizedEmail) {
      nextErrors.email = 'Bitte geben Sie Ihre E-Mail-Adresse ein.'
    }

    if (!password) {
      nextErrors.password = 'Bitte geben Sie Ihr Passwort ein.'
    }

    setValidationErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    submittingRef.current = true

    try {
      await onLogin?.(normalizedEmail, password)
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <section>
      <Topbar
        title="Admin-Anmeldung"
        subtitle="Geschützter Zugang zur Spieleverwaltung"
      />

      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black">Anmelden</h2>
          <p className="mt-2 text-slate-600">
            Verwenden Sie ein in Supabase freigeschaltetes Admin-Konto.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {authError && (
            <div
              className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
              role="alert"
            >
              {authError}
            </div>
          )}

          <div className="space-y-5">
            <Field
              label="E-Mail"
              error={validationErrors.email}
              errorId="admin-email-error"
            >
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={event => updateField('email', event.target.value)}
                disabled={loading}
                autoComplete="username"
                aria-describedby={
                  validationErrors.email ? 'admin-email-error' : undefined
                }
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 disabled:cursor-wait disabled:bg-slate-100"
              />
            </Field>

            <Field
              label="Passwort"
              error={validationErrors.password}
              errorId="admin-password-error"
            >
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={event => updateField('password', event.target.value)}
                disabled={loading}
                autoComplete="current-password"
                aria-describedby={
                  validationErrors.password
                    ? 'admin-password-error'
                    : undefined
                }
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 disabled:cursor-wait disabled:bg-slate-100"
              />
            </Field>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="h-12 rounded-2xl border border-slate-300 px-5 font-bold hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
            >
              Zurück zum Dashboard
            </button>

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-2xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-400"
            >
              {loading ? 'Anmeldung läuft …' : 'Anmelden'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

function Field({ label, error, errorId, children }) {
  return (
    <div>
      <label
        className="mb-2 block text-sm font-bold text-slate-700"
        htmlFor={children.props.id}
      >
        {label}
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
