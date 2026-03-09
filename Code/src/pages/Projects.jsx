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
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  ButtonGroup,
} from '@chakra-ui/react'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  QueueListIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'
import PageHeader from '../components/layout/PageHeader'
import { projectService } from '../services/projectService'
import { authService } from '../services/authService'

function Projects() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)
  
  // Advanced Features State
  const [viewMode, setViewMode] = useState('grid') // 'table' or 'grid'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  
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

  // Filter Logic
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'Active').length,
    completed: projects.filter(p => p.status === 'Completed').length,
    onHold: projects.filter(p => p.status === 'On Hold').length
  }

  return (
    <Box p={8}>
        {/* Stats Row */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
            <Card p={4} variant="outline">
                <Stat>
                    <StatLabel>Total Projects</StatLabel>
                    <StatNumber>{stats.total}</StatNumber>
                    <StatHelpText>All time</StatHelpText>
                </Stat>
            </Card>
            <Card p={4} variant="outline" borderTop="4px solid" borderColor="blue.400">
                <Stat>
                    <StatLabel>Active</StatLabel>
                    <StatNumber>{stats.active}</StatNumber>
                    <StatHelpText>In progress</StatHelpText>
                </Stat>
            </Card>
            <Card p={4} variant="outline" borderTop="4px solid" borderColor="green.400">
                <Stat>
                    <StatLabel>Completed</StatLabel>
                    <StatNumber>{stats.completed}</StatNumber>
                    <StatHelpText>Delivered</StatHelpText>
                </Stat>
            </Card>
            <Card p={4} variant="outline" borderTop="4px solid" borderColor="orange.400">
                <Stat>
                    <StatLabel>On Hold</StatLabel>
                    <StatNumber>{stats.onHold}</StatNumber>
                    <StatHelpText>Paused</StatHelpText>
                </Stat>
            </Card>
        </SimpleGrid>

      <Card variant="outline" bg="white" border="1px solid" borderColor="gray.200">
        <Box px={6} py={4}>
          <PageHeader
            title="Projects"
            description="Manage your team's projects"
            buttonLabel={canCreate ? "Add Project" : undefined}
            buttonIcon={PlusIcon}
            onButtonClick={handleAddProject}
          />

          {/* Controls Bar */}
          <HStack mb={6} spacing={4} wrap="wrap">
            <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                    <MagnifyingGlassIcon style={{ width: '20px', color: 'gray' }} />
                </InputLeftElement>
                <Input 
                    placeholder="Search projects..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </InputGroup>
            
            <Select maxW="200px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
            </Select>

            <Box flex={1} />

            <ButtonGroup isAttached variant="outline" size="md">
                <IconButton 
                    aria-label="Grid View" 
                    icon={<Squares2X2Icon style={{ width: '20px' }} />} 
                    isActive={viewMode === 'grid'}
                    onClick={() => setViewMode('grid')}
                />
                <IconButton 
                    aria-label="Table View" 
                    icon={<QueueListIcon style={{ width: '20px' }} />} 
                    isActive={viewMode === 'table'}
                    onClick={() => setViewMode('table')}
                />
            </ButtonGroup>
          </HStack>

          {isLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner />
            </Box>
          ) : viewMode === 'table' ? (
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
                  {filteredProjects.map((project) => (
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
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {filteredProjects.map((project) => (
                    <Card 
                        key={project.id} 
                        variant="outline" 
                        p={6} 
                        cursor="pointer"
                        _hover={{ shadow: 'md', borderColor: 'blue.400' }}
                        onClick={() => navigate(`/projects/${project.id}`)}
                    >
                        <HStack justify="space-between" mb={4}>
                            <Badge
                                colorScheme={
                                    project.status === 'Completed' ? 'green' :
                                    project.status === 'Active' ? 'blue' :
                                    project.status === 'On Hold' ? 'orange' : 'gray'
                                }
                                borderRadius="full"
                                px={3}
                            >
                                {project.status}
                            </Badge>
                            {(canEdit || canDelete) && (
                                <HStack onClick={(e) => e.stopPropagation()}>
                                    {canEdit && (
                                        <IconButton
                                            icon={<PencilSquareIcon className="h-4 w-4" />}
                                            aria-label="Edit"
                                            size="xs"
                                            variant="ghost"
                                            onClick={() => handleEditProject(project)}
                                        />
                                    )}
                                    {canDelete && (
                                        <IconButton
                                            icon={<TrashIcon className="h-4 w-4" />}
                                            aria-label="Delete"
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="red"
                                            onClick={() => handleDeleteProject(project.id)}
                                        />
                                    )}
                                </HStack>
                            )}
                        </HStack>
                        
                        <Text fontWeight="bold" fontSize="lg" mb={2} noOfLines={1}>
                            {project.name}
                        </Text>
                        
                        <Text color="gray.600" fontSize="sm" mb={6} noOfLines={2} h="40px">
                            {project.description || 'No description provided.'}
                        </Text>
                        
                        <HStack justify="space-between" pt={4} borderTop="1px solid" borderColor="gray.100">
                            <Text fontSize="xs" color="gray.400">
                                Created: {new Date(project.created_at).toLocaleDateString()}
                            </Text>
                            <Button size="xs" colorScheme="blue" variant="link">
                                View Details
                            </Button>
                        </HStack>
                    </Card>
                ))}
            </SimpleGrid>
          )}
        </Box>
      </Card>
    </Box>
  )
}

export default Projects
