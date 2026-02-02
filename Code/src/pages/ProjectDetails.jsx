
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Divider,
  SimpleGrid,
  Select,
  Textarea,
  InputGroup,
  InputLeftAddon,
  Badge,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react'
import { ArrowLeftIcon } from '@chakra-ui/icons'
import PageHeader from '../components/layout/PageHeader'
import { projectService } from '../services/projectService'
import { authService } from '../services/authService'
import FileUpload from '../components/common/FileUpload'

function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const user = authService.getCurrentUser()
  const canEdit = user?.permissions?.includes('projects.edit') || user?.role === 'Admin' || user?.role === 'Manager'

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active',
    live_site_url: '',
    beta_site_url: '',
    basecamp_link: '',
    figma_file_url: '',
    figma_preview_url: '',
    approved_design_url: '',
    website_content_docs_url: '',
    basecamp_pre_release_task_link: '',
    basecamp_post_release_task_link: '',
    assigned_pm_email: '',
    assigned_qa_email: '',
    assigned_dev_email: '',
  })

  useEffect(() => {
    if (id === 'new') {
      setIsLoading(false)
    } else {
      loadProject()
    }
  }, [id])

  const loadProject = async () => {
    setIsLoading(true)
    try {
      const data = await projectService.getProjectById(id)
      setProject(data)
      setFormData({
        name: data.name || '',
        description: data.description || '',
        status: data.status || 'Active',
        live_site_url: data.live_site_url || '',
        beta_site_url: data.beta_site_url || '',
        basecamp_link: data.basecamp_link || '',
        figma_file_url: data.figma_file_url || '',
        figma_preview_url: data.figma_preview_url || '',
        approved_design_url: data.approved_design_url || '',
        website_content_docs_url: data.website_content_docs_url || '',
        basecamp_pre_release_task_link: data.basecamp_pre_release_task_link || '',
        basecamp_post_release_task_link: data.basecamp_post_release_task_link || '',
        assigned_pm_email: data.assigned_pm_email || '',
        assigned_qa_email: data.assigned_qa_email || '',
        assigned_dev_email: data.assigned_dev_email || '',
      })
    } catch (error) {
      toast({
        title: 'Error loading project',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
      navigate('/projects')
    } finally {
      setIsLoading(false)
    }
  }

  const [docsMode, setDocsMode] = useState('link')

  const handleUpload = (fieldName, url) => {
    setFormData(prev => ({ ...prev, [fieldName]: url }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (id === 'new') {
        await projectService.createProject(formData)
        toast({
          title: 'Project created',
          status: 'success',
          duration: 3000,
        })
      } else {
        await projectService.updateProject(id, formData)
        toast({
          title: 'Project updated',
          status: 'success',
          duration: 3000,
        })
      }
      navigate('/projects')
    } catch (error) {
      toast({
        title: 'Error saving project',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <Box p={4}>Loading...</Box>
  }

  return (
    <Box p={8}>
      <PageHeader 
        title={id === 'new' ? 'New Project' : 'Project Details'} 
        breadcrumbs={[
          { label: 'Projects', to: '/projects' },
          { label: id === 'new' ? 'New' : formData.name || 'Details', isCurrentPage: true }
        ]}
      />

      <Card mt={4} variant="outline" bg="white" border="1px solid" borderColor="gray.200">
        <CardBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              
              {/* Basic Info */}
              <Box>
                <Heading size="md" mb={4}>Basic Information</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl isRequired>
                    <FormLabel>Project Name</FormLabel>
                    <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Website Redesign" isReadOnly={!canEdit} />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Status</FormLabel>
                    <Select name="status" value={formData.status} onChange={handleChange} isDisabled={!canEdit}>
                      <option value="Active">Active</option>
                      <option value="Planning">Planning</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </Select>
                  </FormControl>

                  <FormControl gridColumn={{ md: "span 2" }}>
                    <FormLabel>Description</FormLabel>
                    <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Project goals and scope..." isReadOnly={!canEdit} />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* URLs & Links */}
              <Box>
                <Heading size="md" mb={4}>Project Links</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl>
                    <FormLabel>Live Site URL</FormLabel>
                    <Input name="live_site_url" value={formData.live_site_url} onChange={handleChange} placeholder="https://" isReadOnly={!canEdit} />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Beta Site URL</FormLabel>
                    <Input name="beta_site_url" value={formData.beta_site_url} onChange={handleChange} placeholder="https://" isReadOnly={!canEdit} />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Basecamp Link</FormLabel>
                    <Input name="basecamp_link" value={formData.basecamp_link} onChange={handleChange} placeholder="https://basecamp.com/..." isReadOnly={!canEdit} />
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Design & Assets */}
              <Box>
                <Heading size="md" mb={4}>Design & Assets</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FileUpload
                    label="Figma File (Upload)"
                    value={formData.figma_file_url}
                    onUpload={(url) => handleUpload('figma_file_url', url)}
                    accept=".fig"
                    placeholder="Upload Figma File"
                    isReadOnly={!canEdit}
                  />

                  <FormControl>
                    <FormLabel>Figma Preview URL</FormLabel>
                    <Input name="figma_preview_url" value={formData.figma_preview_url} onChange={handleChange} placeholder="https://figma.com/proto/..." isReadOnly={!canEdit} />
                  </FormControl>

                  <FileUpload
                    label="Approved Design (Upload)"
                    value={formData.approved_design_url}
                    onUpload={(url) => handleUpload('approved_design_url', url)}
                    accept="image/*,.pdf"
                    placeholder="Upload Design"
                    isReadOnly={!canEdit}
                  />

                  <FormControl>
                    <FormLabel>Website Content Docs</FormLabel>
                    <RadioGroup onChange={setDocsMode} value={docsMode} mb={2} isDisabled={!canEdit}>
                      <Stack direction='row'>
                        <Radio value='link'>Link</Radio>
                        <Radio value='upload'>Upload</Radio>
                      </Stack>
                    </RadioGroup>
                    {docsMode === 'link' ? (
                      <Input 
                        name="website_content_docs_url" 
                        value={formData.website_content_docs_url} 
                        onChange={handleChange} 
                        placeholder="Google Drive / Doc link" 
                        isReadOnly={!canEdit} 
                      />
                    ) : (
                      <FileUpload
                        value={formData.website_content_docs_url}
                        onUpload={(url) => handleUpload('website_content_docs_url', url)}
                        accept=".doc,.docx,.pdf,.txt"
                        placeholder="Upload Document"
                        isReadOnly={!canEdit}
                      />
                    )}
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Tasks & Team */}
              <Box>
                <Heading size="md" mb={4}>Tasks & Team Assignment</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl>
                    <FormLabel>Pre-Release Task Link</FormLabel>
                    <Input name="basecamp_pre_release_task_link" value={formData.basecamp_pre_release_task_link} onChange={handleChange} placeholder="Basecamp task URL" isReadOnly={!canEdit} />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Post-Release Task Link</FormLabel>
                    <Input name="basecamp_post_release_task_link" value={formData.basecamp_post_release_task_link} onChange={handleChange} placeholder="Basecamp task URL" isReadOnly={!canEdit} />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Assigned Project Manager (Email)</FormLabel>
                    <Input type="email" name="assigned_pm_email" value={formData.assigned_pm_email} onChange={handleChange} placeholder="pm@company.com" isReadOnly={!canEdit} />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Assigned QA Analyst (Email)</FormLabel>
                    <Input type="email" name="assigned_qa_email" value={formData.assigned_qa_email} onChange={handleChange} placeholder="qa@company.com" isReadOnly={!canEdit} />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Assigned Developer (Email)</FormLabel>
                    <Input type="email" name="assigned_dev_email" value={formData.assigned_dev_email} onChange={handleChange} placeholder="dev@company.com" isReadOnly={!canEdit} />
                  </FormControl>
                </SimpleGrid>
              </Box>

              {canEdit && (
                <HStack spacing={4} justify="flex-end" pt={4}>
                  <Button variant="ghost" onClick={() => navigate('/projects')}>Cancel</Button>
                  <Button type="submit" colorScheme="vrv" isLoading={isSaving}>
                    {id === 'new' ? 'Create Project' : 'Save Changes'}
                  </Button>
                </HStack>
              )}
            </VStack>
          </form>
        </CardBody>
      </Card>
    </Box>
  )
}

export default ProjectDetails
