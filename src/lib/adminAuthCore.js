export const ADMIN_ROLE = 'admin'

/** Authorization data is trusted only from server-managed app_metadata. */
export function isAdminUser(user) {
  return user?.app_metadata?.role === ADMIN_ROLE
}

/** Small injectable wrapper so the Auth boundary can be tested without Supabase. */
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
      const { data, error } = await client.auth.getUser()
      if (error) return { user: null, error }
      return {
        user: isAdminUser(data?.user) ? data.user : null,
        error: null,
      }
    },

    logout() {
      // The app stores the session per tab, so local sign-out clears the active
      // browser session without affecting other administrator devices.
      return client.auth.signOut({ scope: 'local' })
    },

    subscribe(onChange) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        onChange(session?.user || null)
      })
      return () => data.subscription.unsubscribe()
    },
  }
}
