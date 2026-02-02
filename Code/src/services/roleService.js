import { userService } from './userService'
import { supabase } from '../lib/supabaseClient'

class RoleService {
  async getRoles() {
    try {
      const { data: roles, error } = await supabase
        .from('roles')
        .select('*')
        .order('id')
      
      if (error) throw error

      // Get all users to calculate role counts
      const users = await userService.getUsers()
      
      // Calculate user count for each role
      const rolesWithCounts = roles.map(role => ({
        ...role,
        userCount: users.filter(user => user.role === role.name).length
      }))

      return rolesWithCounts
    } catch (error) {
      this.handleError(error)
      return []
    }
  }

  async getRoleById(id) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  async createRole(roleData) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert([roleData])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  async updateRole(id, roleData) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .update(roleData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  async deleteRole(id) {
    try {
      const { error } = await supabase
        .from('roles')
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
    // throw error
  }
}

export const roleService = new RoleService() 