import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Badge,
  HStack,
  VStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  CircularProgress,
  CircularProgressLabel,
  StatHelpText,
  StatArrow,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Spinner
} from '@chakra-ui/react'
import { 
  BeakerIcon, 
  ArrowLeftIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  LinkIcon,
  PhotoIcon,
  ShieldCheckIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts'
import PageHeader from '../components/layout/PageHeader'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const BACKEND_URL = 'http://localhost:5000'

function PreReleaseReport() {
  const navigate = useNavigate()
  const location = useLocation()
  const highlightUrl = location.state?.highlightUrl
  const toast = useToast()
  
  const [analyzedPages, setAnalyzedPages] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedScreenshot, setSelectedScreenshot] = useState(null)
  const [selectedLiveScreenshot, setSelectedLiveScreenshot] = useState(null)
  const [selectedUrl, setSelectedUrl] = useState('')
  const [selectedLiveUrl, setSelectedLiveUrl] = useState('')
  const [selectedPageIssues, setSelectedPageIssues] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('desktop')

  // --- Helper: Safe Image with fallback rotation ---
  const SafeScreenshot = ({ src, url, alt, ...props }) => {
      const [currentSrc, setCurrentSrc] = useState(src)
      const [providerIdx, setProviderIdx] = useState(0)
      const [isError, setIsError] = useState(false)
      const [isRetrying, setIsRetrying] = useState(false)

      // Sync state with props when they change
      useEffect(() => {
          setCurrentSrc(src)
          setProviderIdx(0)
          setIsError(false)
          setIsRetrying(false)
      }, [src, url])

      const handleLocalRetry = async () => {
          setIsRetrying(true)
          try {
              const params = new URLSearchParams({
                  url: url,
                  fullPage: 'true',
                  device: selectedDevice,
                  width: selectedDevice === 'mobile' ? '375' : selectedDevice === 'tablet' ? '768' : '1440'
              })
              const res = await axios.get(`${BACKEND_URL}/api/screenshots/capture?${params.toString()}`, { 
                  responseType: 'arraybuffer',
                  timeout: 60000 
              })
              const base64 = btoa(
                  new Uint8Array(res.data).reduce(
                      (data, byte) => data + String.fromCharCode(byte),
                      '',
                  ),
              )
              setCurrentSrc(`data:image/jpeg;base64,${base64}`)
              setIsError(false)
          } catch (e) {
              console.error("Local retry failed", e)
              toast({ 
                  title: 'Local capture failed', 
                  description: 'Ensure backend is running and puppeteer is installed.',
                  status: 'error',
                  duration: 3000
              })
              setIsError(true)
          } finally {
              setIsRetrying(false)
          }
      }

      const handleError = () => {
          setIsError(true)
      }

      if (!currentSrc && !isError) {
          return (
              <Box py={20} textAlign="center" bg="gray.50" borderRadius="md">
                  <Spinner size="xl" color="vrv.500" thickness="4px" />
                  <Text mt={4} color="gray.500">Initializing Screenshot...</Text>
              </Box>
          )
      }

      if (isError) {
          return (
              <Box py={20} textAlign="center" bg="gray.50" borderRadius="md" border="1px dashed" borderColor="gray.300">
                  <VStack spacing={3} px={4}>
                      <PhotoIcon className="h-10 w-10 text-gray-300" />
                      <Text color="gray.500" fontSize="sm" fontWeight="bold">Screenshot Unavailable</Text>
                      <Text color="gray.400" fontSize="xs" maxW="300px">
                          Puppeteer capture failed. Ensure the backend is running and the URL is accessible.
                      </Text>
                      <Button 
                        size="sm" 
                        colorScheme="vrv" 
                        leftIcon={<ArrowPathIcon className="h-4 w-4" />}
                        onClick={handleLocalRetry}
                        isLoading={isRetrying}
                        loadingText="Capturing..."
                      >
                        Try Capture Again
                      </Button>
                  </VStack>
              </Box>
          )
      }

      return (
          <Box position="relative" minH="200px">
              <Image 
                src={currentSrc} 
                alt={alt} 
                onError={handleError} 
                {...props} 
                fallbackStrategy="beforeLoadOrError"
                fallback={
                    <Box py={20} textAlign="center" w="full" bg="gray.50">
                        <Spinner size="xl" color="vrv.500" thickness="4px" />
                        <Text mt={4} color="gray.500" fontSize="sm">
                            Loading Screenshot...
                        </Text>
                    </Box>
                } 
              />
          </Box>
      )
  }

  useEffect(() => {
      const storedData = localStorage.getItem('qa_report_data')
      const storedProject = localStorage.getItem('qa_report_project')
      
      if (storedData) {
          try {
              setAnalyzedPages(JSON.parse(storedData))
          } catch (e) {
              console.error("Failed to parse report data", e)
          }
      }
      
      if (storedProject) {
          try {
              setSelectedProject(JSON.parse(storedProject))
          } catch (e) {
              console.error("Failed to parse project data", e)
          }
      }
  }, [])

  if (analyzedPages.length === 0) {
      return (
          <Box p={8} textAlign="center">
              <Heading size="lg" mb={4}>No Report Found</Heading>
              <Text mb={4}>Please run a scan from the Pre-Release module first.</Text>
              <Button colorScheme="vrv" onClick={() => navigate('/pre-release')}>Go to Scanner</Button>
          </Box>
      )
  }

  // Calculate Summary Stats
  const totalErrors = analyzedPages.reduce((acc, p) => acc + p.issues.filter(i => i.type === 'error').length, 0)
  const totalWarnings = analyzedPages.reduce((acc, p) => acc + p.issues.filter(i => i.type === 'warning').length, 0)
  const avgScore = Math.round(analyzedPages.reduce((acc, p) => {
      const e = p.issues.filter(i => i.type === 'error').length
      const w = p.issues.filter(i => i.type === 'warning').length
      return acc + Math.max(0, 100 - (e * 10) - (w * 2))
  }, 0) / analyzedPages.length)

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1600px" mx="auto">
      <PageHeader 
        title={selectedProject ? `QA Report: ${selectedProject.name}` : "Pre-Release QA Report"}
        description={`Scan Results for ${analyzedPages.length} pages generated on ${new Date().toLocaleDateString()}`}
        buttonLabel="Back to Scanner"
        onButtonClick={() => navigate('/pre-release')}
      />

        <Box mb={8}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Overall Health Score</StatLabel>
                            <StatNumber fontSize="3xl" color={avgScore > 80 ? 'green.500' : avgScore > 50 ? 'orange.500' : 'red.500'}>
                                {avgScore}/100
                            </StatNumber>
                            <StatHelpText>
                                <StatArrow type={avgScore > 80 ? 'increase' : 'decrease'} />
                                Based on {analyzedPages.length} pages
                            </StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Critical Errors</StatLabel>
                            <StatNumber fontSize="3xl" color="red.500">{totalErrors}</StatNumber>
                            <StatHelpText>Needs immediate attention</StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Warnings</StatLabel>
                            <StatNumber fontSize="3xl" color="orange.500">{totalWarnings}</StatNumber>
                            <StatHelpText>Improvements needed</StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
                <Card variant="outline">
                    <CardHeader pb={0}>
                        <Heading size="sm">Issue Distribution</Heading>
                    </CardHeader>
                    <CardBody h="300px">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={(() => {
                                        const data = Object.entries(analyzedPages.reduce((acc, page) => {
                                            page.issues.forEach(issue => {
                                                const cat = issue.category || 'Other'
                                                if (!acc[cat]) acc[cat] = 0
                                                acc[cat]++
                                            })
                                            return acc
                                        }, {})).map(([name, value]) => ({ name, value }))
                                        
                                        return data.length > 0 ? data : [{ name: 'No Issues', value: 1 }]
                                    })()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(() => {
                                        const data = Object.entries(analyzedPages.reduce((acc, page) => {
                                            page.issues.forEach(issue => {
                                                const cat = issue.category || 'Other'
                                                if (!acc[cat]) acc[cat] = 0
                                                acc[cat]++
                                            })
                                            return acc
                                        }, {})).map(([name, value]) => ({ name, value }))

                                        if (data.length === 0) return <Cell key="cell-0" fill="#48BB78" /> // Green for no issues
                                        
                                        return data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#F56565', '#ED8936', '#ECC94B', '#4299E1', '#9F7AEA', '#ED64A6'][index % 6]} />
                                        ))
                                    })()}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>

                <Card variant="outline">
                    <CardHeader pb={0}>
                        <Heading size="sm">Page Health Scores</Heading>
                    </CardHeader>
                    <CardBody h="300px">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={analyzedPages.slice(0, 10).map(page => { // Show top 10
                                    const errorCount = page.issues.filter(i => i.type === 'error').length
                                    const warningCount = page.issues.filter(i => i.type === 'warning').length
                                    const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 2))
                                    return { 
                                        name: page.url.split('/').pop() || 'Home', 
                                        score: score 
                                    }
                                })}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <XAxis dataKey="name" fontSize={10} interval={0} angle={-45} textAnchor="end" height={60} />
                                <YAxis domain={[0, 100]} />
                                <RechartsTooltip />
                                <Bar dataKey="score" name="Health Score">
                                    {analyzedPages.slice(0, 10).map((page, index) => {
                                        const errorCount = page.issues.filter(i => i.type === 'error').length
                                        const warningCount = page.issues.filter(i => i.type === 'warning').length
                                        const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 2))
                                        return <Cell key={`cell-${index}`} fill={score > 80 ? '#48BB78' : score > 50 ? '#ED8936' : '#F56565'} />
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>
            </SimpleGrid>
        </Box>

        <Card>
            <CardHeader>
                <HStack justify="space-between">
                    <Heading size="md">Detailed Results</Heading>
                </HStack>
            </CardHeader>
            <CardBody>
                <Accordion allowMultiple defaultIndex={analyzedPages.map((p, i) => p.url === highlightUrl ? i : -1).filter(i => i !== -1)}>
                            {analyzedPages.map((page, index) => {
                                const errorCount = page.issues.filter(i => i.type === 'error').length
                                const warningCount = page.issues.filter(i => i.type === 'warning').length
                                const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 2))
                                
                                // Group issues by category
                                const issuesByCategory = page.issues.reduce((acc, issue) => {
                                    const cat = issue.category || 'Other'
                                    if (!acc[cat]) acc[cat] = []
                                    acc[cat].push(issue)
                                    return acc
                                }, {})

                                return (
                                    <AccordionItem key={index} borderLeftWidth="4px" borderLeftColor={page.status === 'Error' ? 'red.500' : page.status === 'Warning' ? 'orange.500' : 'green.500'} mb={4} borderRadius="md" bg="white" shadow="sm">
                                        <h2>
                                            <AccordionButton py={4}>
                                                <Box flex="1" textAlign="left">
                                                    <HStack spacing={4}>
                                                        <CircularProgress value={score} color={score > 80 ? 'green.400' : score > 50 ? 'orange.400' : 'red.400'} size="40px">
                                                            <CircularProgressLabel fontSize="xs" fontWeight="bold">{score}</CircularProgressLabel>
                                                        </CircularProgress>
                                                        
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontWeight="bold" fontSize="md">{page.title}</Text>
                                                            <Text fontSize="xs" color="gray.500" isTruncated maxW="400px">{page.url}</Text>
                                                        </VStack>
                                                        
                                                        <HStack ml="auto" spacing={4} mr={4}>
                                                            {page.screenshots && (Object.values(page.screenshots).some(s => s !== null)) && (
                                                                <Button size="xs" leftIcon={<PhotoIcon className="h-3 w-3" />} onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setSelectedScreenshot(page.screenshots)
                                                                    setSelectedLiveScreenshot(page.liveScreenshots)
                                                                    setSelectedUrl(page.url)
                                                                    setSelectedLiveUrl(page.liveUrl || (selectedProject && page.url ? (new URL(selectedProject.live_site_url).origin + new URL(page.url).pathname) : ''))
                                                                    setSelectedPageIssues(page.issues)
                                                                    onOpen()
                                                                }}>
                                                                    {page.liveScreenshots ? 'Compare Screenshots' : 'View Screenshot'}
                                                                </Button>
                                                            )}
                                                            {errorCount > 0 && (
                                                                <Badge colorScheme="red" variant="subtle" px={2} py={1} borderRadius="full">
                                                                    {errorCount} Errors
                                                                </Badge>
                                                            )}
                                                            {warningCount > 0 && (
                                                                <Badge colorScheme="orange" variant="subtle" px={2} py={1} borderRadius="full">
                                                                    {warningCount} Warnings
                                                                </Badge>
                                                            )}
                                                        </HStack>
                                                    </HStack>
                                                </Box>
                                                <AccordionIcon />
                                            </AccordionButton>
                                        </h2>
                                        <AccordionPanel pb={6} pt={2}>
                                            {page.issues.length > 0 ? (
                                                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                                                    {Object.entries(issuesByCategory).map(([category, issues]) => (
                                                        <Box key={category} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                                                            <HStack mb={3} spacing={2}>
                                                                <Icon as={
                                                                    category === 'SEO' ? EyeIcon :
                                                                    category === 'Accessibility' ? BeakerIcon :
                                                                    category === 'Security' ? ShieldCheckIcon :
                                                                    category === 'Links' ? LinkIcon :
                                                                    category === 'Assets' ? PhotoIcon :
                                                                    category === 'Content' ? DocumentTextIcon :
                                                                    category === 'Standards' ? CodeBracketIcon :
                                                                    ExclamationTriangleIcon
                                                                } color="vrv.500" />
                                                                <Heading size="xs" textTransform="uppercase" color="gray.600">{category}</Heading>
                                                                <Badge ml="auto" size="sm">{issues.length}</Badge>
                                                            </HStack>
                                                            
                                                            <VStack align="start" spacing={2} maxH="200px" overflowY="auto" pr={1}>
                                                                {issues.map((issue, i) => (
                                                                    <HStack key={i} w="full" alignItems="start" spacing={2}>
                                                                        <Box mt={1}>
                                                                            {issue.type === 'error' ? 
                                                                                <XCircleIcon className="h-4 w-4 text-red-500" /> : 
                                                                                <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
                                                                            }
                                                                        </Box>
                                                                        <Text fontSize="sm" color="gray.700" lineHeight="short">{issue.message}</Text>
                                                                    </HStack>
                                                                ))}
                                                            </VStack>
                                                        </Box>
                                                    ))}
                                                </SimpleGrid>
                                            ) : (
                                                <VStack py={8} spacing={4}>
                                                    <CheckCircleIcon className="h-12 w-12 text-green-500" />
                                                    <Text color="green.600" fontWeight="medium">Perfect Score! No issues found.</Text>
                                                </VStack>
                                            )}
                                        </AccordionPanel>
                                    </AccordionItem>
                                )
                            })}
                </Accordion>
            </CardBody>
        </Card>

        <Modal isOpen={isOpen} onClose={onClose} size="full">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <VStack align="stretch" spacing={4}>
                        <HStack justify="space-between" pr={10}>
                            <Text>Visual Comparison</Text>
                            <HStack spacing={4}>
                                <Badge colorScheme="green">Live Site</Badge>
                                <Text fontSize="sm" color="gray.400">vs</Text>
                                <Badge colorScheme="vrv">Beta Site</Badge>
                            </HStack>
                        </HStack>
                        
                        <HStack justify="center" spacing={4} pb={2}>
                            <Button 
                                size="sm" 
                                leftIcon={<ComputerDesktopIcon className="h-4 w-4" />}
                                colorScheme={selectedDevice === 'desktop' ? 'vrv' : 'gray'}
                                variant={selectedDevice === 'desktop' ? 'solid' : 'outline'}
                                onClick={() => setSelectedDevice('desktop')}
                            >
                                Desktop
                            </Button>
                            <Button 
                                size="sm" 
                                leftIcon={<DeviceTabletIcon className="h-4 w-4" />}
                                colorScheme={selectedDevice === 'tablet' ? 'vrv' : 'gray'}
                                variant={selectedDevice === 'tablet' ? 'solid' : 'outline'}
                                onClick={() => setSelectedDevice('tablet')}
                            >
                                Tablet
                            </Button>
                            <Button 
                                size="sm" 
                                leftIcon={<DevicePhoneMobileIcon className="h-4 w-4" />}
                                colorScheme={selectedDevice === 'mobile' ? 'vrv' : 'gray'}
                                variant={selectedDevice === 'mobile' ? 'solid' : 'outline'}
                                onClick={() => setSelectedDevice('mobile')}
                            >
                                Mobile
                            </Button>
                        </HStack>
                    </VStack>
                </ModalHeader>
                <ModalCloseButton mt={4} />
                <ModalBody pb={6}>
                    <SimpleGrid columns={{ base: 1, md: selectedLiveScreenshot?.[selectedDevice] ? 2 : 1 }} spacing={6}>
                        {/* LIVE SITE SCREENSHOT */}
                        {selectedLiveScreenshot?.[selectedDevice] && (
                            <VStack align="stretch" h="full">
                                <Badge alignSelf="center" colorScheme="green" mb={2}>Live Version ({selectedDevice})</Badge>
                                <Box 
                                    border="2px solid" 
                                    borderColor="green.100" 
                                    borderRadius="md" 
                                    overflowY="auto" 
                                    maxH="70vh"
                                    bg="gray.50"
                                >
                                    <SafeScreenshot 
                                        key={`${selectedLiveUrl}-${selectedDevice}`}
                                        src={selectedLiveScreenshot[selectedDevice]} 
                                        url={selectedLiveUrl}
                                        alt={`Live Site ${selectedDevice} Screenshot`} 
                                        w="full" 
                                    />
                                </Box>
                            </VStack>
                        )}

                        {/* BETA SITE SCREENSHOT */}
                        <VStack align="stretch" h="full">
                            <Badge alignSelf="center" colorScheme="vrv" mb={2}>{selectedLiveScreenshot?.[selectedDevice] ? `Beta Version (${selectedDevice})` : `Page Screenshot (${selectedDevice})`}</Badge>
                            <Box 
                                position="relative" 
                                border="2px solid" 
                                borderColor="vrv.100" 
                                borderRadius="md" 
                                overflowY="auto" 
                                maxH="70vh"
                                bg="gray.50"
                            >
                                {selectedScreenshot?.[selectedDevice] ? (
                                    <SafeScreenshot 
                                        key={`${selectedUrl}-${selectedDevice}`}
                                        src={selectedScreenshot[selectedDevice]} 
                                        url={selectedUrl}
                                        alt={`Beta Site ${selectedDevice} Screenshot`} 
                                        w="full" 
                                    />
                                ) : (
                                    <Box py={20} textAlign="center">
                                        <Text color="gray.500">No {selectedDevice} screenshot available</Text>
                                    </Box>
                                )}
                            </Box>
                            
                            {selectedPageIssues.filter(i => i.category === 'Visual').length > 0 && (
                                <Box mt={4} p={4} bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
                                    <Heading size="xs" mb={3} color="red.700" textTransform="uppercase">Detected Visual Issues (Beta)</Heading>
                                    <VStack align="start" spacing={2}>
                                        {selectedPageIssues.filter(i => i.category === 'Visual').map((issue, idx) => (
                                            <HStack key={idx} spacing={2} align="start">
                                                <XCircleIcon className="h-4 w-4 text-red-500 mt-0.5" />
                                                <Text fontSize="xs" color="red.800">{issue.message}</Text>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </Box>
                            )}
                        </VStack>
                    </SimpleGrid>
                </ModalBody>
            </ModalContent>
        </Modal>
    </Box>
  )
}

export default PreReleaseReport