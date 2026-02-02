import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  IconButton,
  Card,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Spinner,
  useToast,
  Input,
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  Select,
} from '@chakra-ui/react'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import PageHeader from '../components/layout/PageHeader'
import { projectService } from '../services/projectService'
import { authService } from '../services/authService'

function Projects() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const navigate = useNavigate()
  const user = authService.getCurrentUser()

  // Permissions check
  const canCreate = user?.permissions?.includes('projects.create') || user?.role === 'Admin'
  const canEdit = user?.permissions?.includes('projects.edit') || user?.role === 'Admin'
  const canDelete = user?.permissions?.includes('projects.delete') || user?.role === 'Admin'

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const data = await projectService.getProjects()
      setProjects(data)
    } catch (error) {
      toast({
        title: 'Error fetching projects',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProject = () => {
    navigate('/projects/new')
  }

  const handleEditProject = (project) => {
    navigate(`/projects/${project.id}`)
  }

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return
    
    try {
      await projectService.deleteProject(id)
      toast({
        title: 'Project deleted successfully',
        status: 'success',
        duration: 3000,
      })
      loadProjects()
    } catch (error) {
      toast({
        title: 'Error deleting project',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const projectData = {
      name: formData.get('name'),
      description: formData.get('description'),
      status: formData.get('status'),
    }

    try {
      if (selectedProject) {
        await projectService.updateProject(selectedProject.id, projectData)
        toast({ title: 'Project updated', status: 'success' })
      } else {
        await projectService.createProject(projectData)
        toast({ title: 'Project created', status: 'success' })
      }
      onClose()
      loadProjects()
    } catch (error) {
      console.error('Project save error:', error)
      toast({
        title: 'Error saving project',
        description: error.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box p={8}>
      <Card variant="outline" bg="white" border="1px solid" borderColor="gray.200">
        <Box px={6} py={4}>
          <PageHeader
            title="Projects"
            description="Manage your team's projects"
            buttonLabel={canCreate ? "Add Project" : undefined}
            buttonIcon={PlusIcon}
            onButtonClick={handleAddProject}
          />

          {isLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner />
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Status</Th>
                    <Th>Description</Th>
                    <Th>Created At</Th>
                    {(canEdit || canDelete) && <Th>Actions</Th>}
                  </Tr>
                </Thead>
                <Tbody>
                  {projects.map((project) => (
                    <Tr key={project.id} _hover={{ bg: 'gray.50', cursor: 'pointer' }} onClick={() => navigate(`/projects/${project.id}`)}>
                      <Td fontWeight="medium">{project.name}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            project.status === 'Completed' ? 'green' :
                            project.status === 'Active' ? 'blue' :
                            project.status === 'On Hold' ? 'orange' : 'gray'
                          }
                        >
                          {project.status}
                        </Badge>
                      </Td>
                      <Td>{project.description}</Td>
                      <Td>{new Date(project.created_at).toLocaleDateString()}</Td>
                      {(canEdit || canDelete) && (
                        <Td onClick={(e) => e.stopPropagation()}>
                        <HStack spacing={2}>
                          {canEdit && (
                            <IconButton
                              icon={<PencilSquareIcon className="h-4 w-4" />}
                              aria-label="Edit"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditProject(project)}
                            />
                          )}
                          {canDelete && (
                            <IconButton
                              icon={<TrashIcon className="h-4 w-4" />}
                              aria-label="Delete"
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteProject(project.id)}
                            />
                          )}
                        </HStack>
                      </Td>
                      )}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  )
}

export default Projects
