import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Button,
  Icon,
} from '@chakra-ui/react'
import { authService } from '../services/authService'
import { useNavigate } from 'react-router-dom'
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'

function EmployeeDashboard() {
  const navigate = useNavigate()
  const user = authService.getCurrentUser()
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const activities = [
    { id: 1, type: 'Task', title: 'Project Review', status: 'Pending' },
    { id: 2, type: 'Meeting', title: 'Team Sync', status: 'Scheduled' },
    { id: 3, type: 'Report', title: 'Monthly Update', status: 'Completed' },
  ]

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        {/* Welcome Section */}
        <Card bg={cardBg} borderColor={borderColor} shadow="sm">
          <CardBody>
            <VStack align="start" spacing={2}>
              <Heading size="md">Welcome, {user?.name}</Heading>
              <HStack>
                <Badge colorScheme="vrv">{user?.department}</Badge>
                <Badge colorScheme="purple">{user?.role}</Badge>
              </HStack>
              <Text color={textColor}>
                Here's an overview of your activities and tasks
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card bg={cardBg} borderColor={borderColor} shadow="sm">
          <CardBody>
            <Heading size="md" mb={4}>Quick Actions</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              <Button 
                leftIcon={<Icon as={ClipboardDocumentCheckIcon} boxSize={5} />} 
                colorScheme="vrv" 
                variant="outline"
                onClick={() => navigate('/qa-testing')}
                justifyContent="flex-start"
                height="auto"
                p={4}
                _hover={{ bg: 'vrv.50' }}
              >
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">Start QA Testing</Text>
                  <Text fontSize="xs" fontWeight="normal" color={textColor}>Test projects & report issues</Text>
                </VStack>
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Activities Section */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {activities.map((activity) => (
            <Card key={activity.id} bg={cardBg} borderColor={borderColor} shadow="sm">
              <CardBody>
                <VStack align="start" spacing={3}>
                  <HStack justify="space-between" width="full">
                    <Badge colorScheme="blue">{activity.type}</Badge>
                    <Badge
                      colorScheme={
                        activity.status === 'Completed'
                          ? 'green'
                          : activity.status === 'Pending'
                          ? 'yellow'
                          : 'purple'
                      }
                    >
                      {activity.status}
                    </Badge>
                  </HStack>
                  <Heading size="sm">{activity.title}</Heading>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {/* Recent Updates */}
        <Card bg={cardBg} borderColor={borderColor} shadow="sm">
          <CardBody>
            <VStack align="start" spacing={4}>
              <Heading size="md">Recent Updates</Heading>
              <Box width="full">
                {[
                  'New project guidelines have been published',
                  'Team meeting scheduled for next week',
                  'Updated security protocols are now in effect',
                ].map((update, index) => (
                  <Box
                    key={index}
                    p={3}
                    borderBottom={index !== 2 ? '1px' : '0'}
                    borderColor={borderColor}
                  >
                    <Text color={textColor}>{update}</Text>
                  </Box>
                ))}
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}

export default EmployeeDashboard 