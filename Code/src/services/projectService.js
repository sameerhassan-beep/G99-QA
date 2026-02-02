import { supabase } from '../lib/supabaseClient'

class ProjectService {
  async getProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching projects:', error)
      return []
    }
  }

  async getProjectById(id) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching project:', error)
      throw error
    }
  }

  async createProject(project) {
    try {
      // Try to get user from session first (local check)
      const { data: { session } } = await supabase.auth.getSession()
      let user = session?.user

      // If no session user, try server verification
      if (!user) {
        const { data: { user: serverUser } } = await supabase.auth.getUser()
        user = serverUser
      }
      
      if (!user) {
        console.error('No authenticated user found')
        throw new Error('User not authenticated - Please try logging out and back in')
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...project,
          owner_id: user.id,
          status: project.status || 'Active'
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  async updateProject(id, updates) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  async deleteProject(id) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }
}

export const projectService = new ProjectService()
