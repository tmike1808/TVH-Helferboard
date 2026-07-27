import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getCurrentSession,
  isCurrentUserAdmin,
  signInWithPassword,
  signOut,
  subscribeToAuthChanges
} from '../services/authService'

const NO_ADMIN_MESSAGE = 'Dieses Konto besitzt keine Adminberechtigung.'
const AUTH_CHECK_MESSAGE =
  'Die Adminberechtigung konnte nicht geprüft werden. Bitte melden Sie sich erneut an.'
const LOGIN_ERROR_MESSAGE =
  'Die Anmeldung ist fehlgeschlagen. Bitte prüfen Sie E-Mail und Passwort.'

function getLoginErrorMessage(error) {
  if (
    error?.code === 'invalid_credentials'
    || /invalid login credentials/i.test(error?.message ?? '')
  ) {
    return LOGIN_ERROR_MESSAGE
  }

  return 'Die Anmeldung ist derzeit nicht möglich. Bitte versuchen Sie es später erneut.'
}

export function useAdminAuth() {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)
  const authOperationRef = useRef(false)

  const lockLocalAdminAccess = useCallback((message = null) => {
    setSession(null)
    setIsAdmin(false)
    setError(message)
  }, [])

  const verifySession = useCallback(async nextSession => {
    const requestId = ++requestIdRef.current

    setLoading(true)
    setError(null)
    setSession(nextSession ?? null)
    setIsAdmin(false)

    if (!nextSession) {
      setLoading(false)
      return
    }

    try {
      const allowed = await isCurrentUserAdmin()

      if (requestId !== requestIdRef.current) {
        return
      }

      if (allowed) {
        setIsAdmin(true)
        setLoading(false)
        return
      }

      authOperationRef.current = true

      try {
        await signOut()
      } finally {
        authOperationRef.current = false
      }

      if (requestId === requestIdRef.current) {
        lockLocalAdminAccess(NO_ADMIN_MESSAGE)
        setLoading(false)
      }
    } catch {
      if (requestId !== requestIdRef.current) {
        return
      }

      authOperationRef.current = true

      try {
        await signOut()
      } catch {
        // Der lokale Zugriff bleibt auch dann gesperrt.
      } finally {
        authOperationRef.current = false
      }

      if (requestId === requestIdRef.current) {
        lockLocalAdminAccess(AUTH_CHECK_MESSAGE)
        setLoading(false)
      }
    }
  }, [lockLocalAdminAccess])

  useEffect(() => {
    let cancelled = false

    getCurrentSession()
      .then(currentSession => {
        if (!cancelled) {
          return verifySession(currentSession)
        }

        return undefined
      })
      .catch(() => {
        if (!cancelled) {
          lockLocalAdminAccess(AUTH_CHECK_MESSAGE)
          setLoading(false)
        }
      })

    const subscription = subscribeToAuthChanges(nextSession => {
      if (cancelled || authOperationRef.current) {
        return
      }

      window.setTimeout(() => {
        if (!cancelled && !authOperationRef.current) {
          verifySession(nextSession)
        }
      }, 0)
    })

    return () => {
      cancelled = true
      requestIdRef.current += 1
      subscription.unsubscribe()
    }
  }, [lockLocalAdminAccess, verifySession])

  const login = useCallback(async (email, password) => {
    if (authOperationRef.current) {
      return false
    }

    authOperationRef.current = true
    const requestId = ++requestIdRef.current
    let signedInSession = null

    setLoading(true)
    setError(null)
    setSession(null)
    setIsAdmin(false)

    try {
      signedInSession = await signInWithPassword(email, password)
      const allowed = await isCurrentUserAdmin()

      if (!allowed) {
        await signOut()
        lockLocalAdminAccess(NO_ADMIN_MESSAGE)
        return false
      }

      if (requestId === requestIdRef.current) {
        setSession(signedInSession)
        setIsAdmin(true)
      }

      return true
    } catch (loginError) {
      if (signedInSession) {
        try {
          await signOut()
        } catch {
          // Der lokale Zugriff bleibt unabhängig vom Remote-Fehler gesperrt.
        }
      }

      if (requestId === requestIdRef.current) {
        lockLocalAdminAccess(getLoginErrorMessage(loginError))
      }

      return false
    } finally {
      authOperationRef.current = false

      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [lockLocalAdminAccess])

  const logout = useCallback(async () => {
    ++requestIdRef.current
    authOperationRef.current = true
    lockLocalAdminAccess()
    setLoading(true)

    try {
      await signOut()
    } catch {
      setError(
        'Die Abmeldung konnte nicht vollständig bestätigt werden. ' +
        'Der Adminbereich wurde lokal gesperrt.'
      )
    } finally {
      authOperationRef.current = false
      setLoading(false)
    }
  }, [lockLocalAdminAccess])

  return {
    session,
    isAdmin,
    loading,
    error,
    login,
    logout
  }
}
