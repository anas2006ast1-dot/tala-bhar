export const ADMIN_ROLE = 'admin'

/** Only a server-managed app_metadata claim can grant administrator access. */
export function isAdminUser(user) {
  return user?.app_metadata?.role === ADMIN_ROLE
}

export function createAdminAuth(client) {
  return {
    async login(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password })
      if (error) return { user: null, error }
      const user = data?.user || null
      if (!isAdminUser(user)) {
        await client.auth.signOut({ scope: 'local' })
        return { user: null, error: new Error('Admin access is required for this account.') }
      }
      return { user, error: null }
    },
    async getAdminUser() {
      const { data: sessionData, error: sessionError } = await client.auth.getSession()
      if (sessionError) return { user: null, error: sessionError }
      if (!sessionData?.session) return { user: null, error: null }
      const { data, error } = await client.auth.getUser()
      if (error) return { user: null, error }
      return { user: isAdminUser(data?.user) ? data.user : null, error: null }
    },
    logout() {
      return client.auth.signOut({ scope: 'local' })
    },
    subscribe(onChange) {
      const { data } = client.auth.onAuthStateChange((_event, session) => onChange(session?.user || null))
      return () => data.subscription.unsubscribe()
    },
  }
}
