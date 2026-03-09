import { userService } from './userService'
import { supabase } from '../lib/supabaseClient'

class DepartmentService {
  async getDepartments() {
    try {
      const { data: departments, error } = await supabase
        .from('departments')
        .select('*')
        .order('id')
      
      if (error) throw error

      // Update employee counts based on user data
      const users = await userService.getUsers()
      const departmentsWithCounts = departments.map(dept => ({
        ...dept,
        employeeCount: users.filter(user => user.department === dept.name).length
      }))
      
      return departmentsWithCounts
    } catch (error) {
      this.handleError(error)
      return []
    }
  }

  async getDepartmentById(id) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  async createDepartment(departmentData) {
    try {
      // Generate ID
      const id = departmentData.id || `DEP${Date.now().toString().slice(-6)}`

      const newDepartment = {
        id,
        ...departmentData,
        employeeCount: 0,
        budgetSpent: 0,
      }
      
      const { data, error } = await supabase
        .from('departments')
        .insert([newDepartment])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  async updateDepartment(id, departmentData) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .update(departmentData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  async deleteDepartment(id) {
    try {
      const { error } = await supabase
        .from('departments')
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

export const departmentService = new DepartmentService() 