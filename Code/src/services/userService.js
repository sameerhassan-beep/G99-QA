import { supabase } from '../lib/supabaseClient'

class UserService {
  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error)
      return []
    }
  }

  async getUserById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  async createUser(userData) {
    try {
      // Generate a simple ID or use UUID. Here we try to match the format USR...
      // For simplicity, using a timestamp based ID or just relying on what's passed if any.
      // If the schema expects 'USR...', we can generate it.
      const id = userData.id || `USR${Date.now().toString().slice(-6)}`
      
      const { data, error } = await supabase
        .from('users')
        .insert([{ ...userData, id }])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  async updateUser(id, userData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  async deleteUser(id) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      this.handleError(error)
    }
  }

  handleError(error) {
    console.error('API Error:', error)
    // Don't throw to prevent app crash, or handle UI feedback elsewhere
    // throw error 
  }
}

export const userService = new UserService()