import { supabase } from './supabaseClient'
import { createAdminAuth, isAdminUser } from './adminAuthCore'

const auth = createAdminAuth(supabase)

export const login = auth.login
export const getAdminUser = auth.getAdminUser
export const logout = auth.logout
export const subscribeAuthState = auth.subscribe
export { isAdminUser }
