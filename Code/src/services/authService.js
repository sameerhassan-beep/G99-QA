import { supabase } from '../lib/supabaseClient'

class AuthService {
  async login(email, password) {
    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      // 2. Fetch user profile from public.users table AND their role permissions
      // We join with 'roles' table using the foreign key on 'role' column.
      
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select(`
          *,
          roles:role (
            permissions
          )
        `)
        .eq('auth_id', authData.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "Row not found"
        throw profileError
      }

      // If not found by auth_id, try email (legacy/fallback)
      let finalProfile = userProfile
      if (!finalProfile) {
         const { data: userProfileByEmail, error: emailError } = await supabase
          .from('users')
          .select(`
            *,
            roles:role (
              permissions
            )
          `)
          .eq('email', email)
          .single()
          
         if (emailError) throw new Error('User profile not found')
         finalProfile = userProfileByEmail
      }

      // 3. Prepare user object for the app
      // Flatten permissions from the joined relationship
      const permissions = finalProfile.roles?.permissions || []
      
      const user = {
        ...finalProfile,
        permissions, // Add flattened permissions array
        email: authData.user.email,
        auth_id: authData.user.id
      }
      
      // Remove nested roles object to keep it clean if desired, or keep it.
      // delete user.roles 

      // 4. Store in localStorage for app compatibility
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', authData.session.access_token)
      
      return user
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async logout() {
    await supabase.auth.signOut()
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  getCurrentUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  isAuthenticated() {
    const token = localStorage.getItem('token')
    const user = this.getCurrentUser()
    return !!token && !!user
  }

  hasRole(roles) {
    const user = this.getCurrentUser()
    return user && roles.includes(user.role)
  }
  
  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  }
}

export const authService = new AuthService()
