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
    Spinner,
    Checkbox,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Divider
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
    const [qaChecklist, setQaChecklist] = useState({
        'small-browser-chrome-desktop': false,
        'small-browser-chrome-ipad': false,
        'small-browser-chrome-iphone': false,
        'small-browser-safari-desktop': false,
        'small-browser-safari-tablet': false,
        'small-browser-safari-mobile': false,
        'small-browser-1024x768': false,
        'small-browser-1280x800': false,
        'small-browser-1366x768': false,
        'small-issue-dummy': false,
        'small-issue-404': false,
        'small-issue-malware': false,
        'small-issue-portfolio': false,
        'small-issue-images': false,
        'small-issue-header-footer': false,
        'small-issue-redirects': false,
        'small-func-manual': false,
        'small-func-spacing': false,
        'small-func-readmore': false,
        'small-func-watermarks': false,
        'small-func-favicon': false,
        'small-func-contact': false,
        'small-func-hamburger': false,
        'small-func-topbar': false,
        'small-func-header-sticky': false,
        'small-func-privacy': false,
        'small-func-footer-logo': false,
        'small-func-deadlinks': false,
        'medium-form-growth99': false,
        'medium-form-consultation': false,
        'medium-form-chatbot': false,
        'medium-form-script': false,
        'medium-url-match': false,
        'medium-url-sharing': false,
        'medium-blog-verify': false,
        'medium-blog-sidebar': false,
        'medium-blog-urls': false,
        'medium-map-address': false,
        'medium-hero-video': false,
        'medium-hero-icons': false,
        'medium-header-breakpoints': false,
        'post-live-validation': false,
        'post-g99-features': false,
        'post-ada': false,
        'post-gsr': false
    })

    useEffect(() => {
        const storedChecklist = localStorage.getItem('qa_checklist_data')
        if (storedChecklist) {
            try {
                setQaChecklist(JSON.parse(storedChecklist))
            } catch (e) {
                console.error("Failed to parse checklist data", e)
            }
        }
    }, [])

    const handleChecklistChange = (key) => {
        const updated = { ...qaChecklist, [key]: !qaChecklist[key] }
        setQaChecklist(updated)
        localStorage.setItem('qa_checklist_data', JSON.stringify(updated))
    }

    const getProgress = (prefix) => {
        const keys = Object.keys(qaChecklist).filter(k => k.startsWith(prefix))
        const completed = keys.filter(k => qaChecklist[k]).length
        return { completed, total: keys.length }
    }

    const toggleSection = (prefix, value) => {
        const keys = Object.keys(qaChecklist).filter(k => k.startsWith(prefix))
        const updated = { ...qaChecklist }
        keys.forEach(k => updated[k] = value)
        setQaChecklist(updated)
        localStorage.setItem('qa_checklist_data', JSON.stringify(updated))
    }

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
                title={selectedProject ? `QA Report: ${selectedProject.name} ` : "Pre-Release QA Report"}
                description={`Scan Results for ${analyzedPages.length} pages generated on ${new Date().toLocaleDateString()} `}
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
                                                <Cell key={`cell - ${index} `} fill={['#F56565', '#ED8936', '#ECC94B', '#4299E1', '#9F7AEA', '#ED64A6'][index % 6]} />
                                            ))
                                        })()}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend verticalAlign="bottom" height={36} />
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
                                            return <Cell key={`cell - ${index} `} fill={score > 80 ? '#48BB78' : score > 50 ? '#ED8936' : '#F56565'} />
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


            <Card mt={8}>
                <CardHeader>
                    <Heading size="md">QA Checklist</Heading>
                    <Text fontSize="sm" color="gray.500">Manual verification tasks</Text>
                </CardHeader>
                <CardBody>
                    <Tabs variant="enclosed">
                        <TabList>
                            <Tab>
                                Small Tasks
                                <Badge ml={2} colorScheme={getProgress('small').completed === getProgress('small').total ? 'green' : 'gray'}>
                                    {getProgress('small').completed}/{getProgress('small').total}
                                </Badge>
                            </Tab>
                            <Tab>
                                Medium Tasks
                                <Badge ml={2} colorScheme={getProgress('medium').completed === getProgress('medium').total ? 'green' : 'gray'}>
                                    {getProgress('medium').completed}/{getProgress('medium').total}
                                </Badge>
                            </Tab>
                            <Tab>
                                Post-Release
                                <Badge ml={2} colorScheme={getProgress('post').completed === getProgress('post').total ? 'green' : 'gray'}>
                                    {getProgress('post').completed}/{getProgress('post').total}
                                </Badge>
                            </Tab>
                        </TabList>
                        <TabPanels>
                            <TabPanel>
                                <VStack align="stretch" spacing={4}>
                                    <HStack justify="flex-end">
                                        <Button size="xs" onClick={() => toggleSection('small', true)}>Select All</Button>
                                        <Button size="xs" onClick={() => toggleSection('small', false)}>Clear All</Button>
                                    </HStack>
                                    <Box>
                                        <Heading size="sm" mb={2}>Browser & Device Testing</Heading>
                                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                            <Checkbox isChecked={qaChecklist['small-browser-chrome-desktop']} onChange={() => handleChecklistChange('small-browser-chrome-desktop')}>Chrome Desktop</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-browser-chrome-ipad']} onChange={() => handleChecklistChange('small-browser-chrome-ipad')}>iPad Pro (Inspect Mode)</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-browser-chrome-iphone']} onChange={() => handleChecklistChange('small-browser-chrome-iphone')}>iPhone 14 Pro Max (Inspect Mode)</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-browser-safari-desktop']} onChange={() => handleChecklistChange('small-browser-safari-desktop')}>Safari Desktop (MacOS 18)</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-browser-safari-tablet']} onChange={() => handleChecklistChange('small-browser-safari-tablet')}>Safari Tablet (iPad Pro 12.9")</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-browser-safari-mobile']} onChange={() => handleChecklistChange('small-browser-safari-mobile')}>Safari Mobile (iPhone 17 Pro Max)</Checkbox>
                                        </SimpleGrid>
                                    </Box>
                                    <Divider />
                                    <Box>
                                        <Heading size="sm" mb={2}>Functional & UI</Heading>
                                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                            <Checkbox isChecked={qaChecklist['small-func-manual']} onChange={() => handleChecklistChange('small-func-manual')}>Manual functionality check (buttons, links)</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-func-spacing']} onChange={() => handleChecklistChange('small-func-spacing')}>Spacing & Alignment</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-func-readmore']} onChange={() => handleChecklistChange('small-func-readmore')}>No 'Read More' buttons (if applicable)</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-func-watermarks']} onChange={() => handleChecklistChange('small-func-watermarks')}>No Images with Watermarks</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-func-favicon']} onChange={() => handleChecklistChange('small-func-favicon')}>Favicon Present</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-func-contact']} onChange={() => handleChecklistChange('small-func-contact')}>Contact Details (Header/Footer/Backend)</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-func-hamburger']} onChange={() => handleChecklistChange('small-func-hamburger')}>Mobile Hamburger Items (Tabs, Social, Contact, etc.)</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-func-topbar']} onChange={() => handleChecklistChange('small-func-topbar')}>Top Bar Elements</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-func-header-sticky']} onChange={() => handleChecklistChange('small-func-header-sticky')}>Sticky Header</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-func-privacy']} onChange={() => handleChecklistChange('small-func-privacy')}>Privacy Policy Page</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-func-footer-logo']} onChange={() => handleChecklistChange('small-func-footer-logo')}>Footer Logo (No tagline)</Checkbox>
                                            <Checkbox isChecked={qaChecklist['small-func-deadlinks']} onChange={() => handleChecklistChange('small-func-deadlinks')}>No Dead Links</Checkbox>
                                        </SimpleGrid>
                                    </Box>
                                </VStack>
                            </TabPanel>
                            <TabPanel>
                                <VStack align="stretch" spacing={4}>
                                    <HStack justify="flex-end">
                                        <Button size="xs" onClick={() => toggleSection('medium', true)}>Select All</Button>
                                        <Button size="xs" onClick={() => toggleSection('medium', false)}>Clear All</Button>
                                    </HStack>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                        <Checkbox isChecked={qaChecklist['medium-form-growth99']} onChange={() => handleChecklistChange('medium-form-growth99')}>Growth99 Form End-to-End</Checkbox>
                                        <Checkbox isChecked={qaChecklist['medium-form-consultation']} onChange={() => handleChecklistChange('medium-form-consultation')}>Self Assessment / Virtual Consultation</Checkbox>
                                        <Checkbox isChecked={qaChecklist['medium-form-chatbot']} onChange={() => handleChecklistChange('medium-form-chatbot')}>Chatbot (Logo, Functionality)</Checkbox>
                                        <Checkbox isChecked={qaChecklist['medium-form-script']} onChange={() => handleChecklistChange('medium-form-script')}>Single Script Functioning</Checkbox>
                                        <Checkbox isChecked={qaChecklist['medium-url-match']} onChange={() => handleChecklistChange('medium-url-match')}>URLs Match Page Names</Checkbox>
                                        <Checkbox isChecked={qaChecklist['medium-url-sharing']} onChange={() => handleChecklistChange('medium-url-sharing')}>Business Name in Shared Links</Checkbox>
                                        <Checkbox isChecked={qaChecklist['medium-blog-verify']} onChange={() => handleChecklistChange('medium-blog-verify')}>All Blogs Added</Checkbox>
                                        <Checkbox isChecked={qaChecklist['medium-blog-sidebar']} onChange={() => handleChecklistChange('medium-blog-sidebar')}>Blog Sidebar Widgets</Checkbox>
                                        <Checkbox isChecked={qaChecklist['medium-blog-urls']} onChange={() => handleChecklistChange('medium-blog-urls')}>Blog URLs Match</Checkbox>
                                        <Checkbox isChecked={qaChecklist['medium-map-address']} onChange={() => handleChecklistChange('medium-map-address')}>Map Address Matches GMB</Checkbox>
                                        <Checkbox isChecked={qaChecklist['medium-hero-video']} onChange={() => handleChecklistChange('medium-hero-video')}>Hero Video Loads (No YT Icons, Fallback)</Checkbox>
                                        <Checkbox isChecked={qaChecklist['medium-header-breakpoints']} onChange={() => handleChecklistChange('medium-header-breakpoints')}>Header False Breakpoints</Checkbox>
                                    </SimpleGrid>
                                </VStack>
                            </TabPanel>
                            <TabPanel>
                                <VStack align="stretch" spacing={4}>
                                    <HStack justify="flex-end">
                                        <Button size="xs" onClick={() => toggleSection('post', true)}>Select All</Button>
                                        <Button size="xs" onClick={() => toggleSection('post', false)}>Clear All</Button>
                                    </HStack>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                        <Checkbox isChecked={qaChecklist['post-live-validation']} onChange={() => handleChecklistChange('post-live-validation')}>Live Site vs Beta Validation</Checkbox>
                                        <Checkbox isChecked={qaChecklist['post-g99-features']} onChange={() => handleChecklistChange('post-g99-features')}>G99+ Feature Check (Forms, Chat, Script)</Checkbox>
                                        <Checkbox isChecked={qaChecklist['post-ada']} onChange={() => handleChecklistChange('post-ada')}>ADA Compliance Check</Checkbox>
                                        <Checkbox isChecked={qaChecklist['post-gsr']} onChange={() => handleChecklistChange('post-gsr')}>GSR (Google Search Result) Verification</Checkbox>
                                    </SimpleGrid>
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
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

                            <VStack align="stretch" spacing={3}>
                                <Text fontSize="sm" fontWeight="bold" color="gray.500">Standard Devices (Chrome Engine)</Text>
                                <HStack justify="start" spacing={3} pb={2}>
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

                                <Text fontSize="sm" fontWeight="bold" color="gray.500">Apple Devices (Safari Engine)</Text>
                                <HStack justify="start" spacing={3} pb={2}>
                                    <Button
                                        size="sm"
                                        leftIcon={<ComputerDesktopIcon className="h-4 w-4" />}
                                        colorScheme={selectedDevice === 'safari-desktop' ? 'vrv' : 'gray'}
                                        variant={selectedDevice === 'safari-desktop' ? 'solid' : 'outline'}
                                        onClick={() => setSelectedDevice('safari-desktop')}
                                    >
                                        MacOS 18
                                    </Button>
                                    <Button
                                        size="sm"
                                        leftIcon={<DeviceTabletIcon className="h-4 w-4" />}
                                        colorScheme={selectedDevice === 'safari-tablet' ? 'vrv' : 'gray'}
                                        variant={selectedDevice === 'safari-tablet' ? 'solid' : 'outline'}
                                        onClick={() => setSelectedDevice('safari-tablet')}
                                    >
                                        iPad Pro 12.9"
                                    </Button>
                                    <Button
                                        size="sm"
                                        leftIcon={<DeviceTabletIcon className="h-4 w-4" />}
                                        colorScheme={selectedDevice === 'ipad-pro' ? 'vrv' : 'gray'}
                                        variant={selectedDevice === 'ipad-pro' ? 'solid' : 'outline'}
                                        onClick={() => setSelectedDevice('ipad-pro')}
                                    >
                                        iPad Pro (Chrome)
                                    </Button>
                                    <Button
                                        size="sm"
                                        leftIcon={<DevicePhoneMobileIcon className="h-4 w-4" />}
                                        colorScheme={selectedDevice === 'safari-mobile' ? 'vrv' : 'gray'}
                                        variant={selectedDevice === 'safari-mobile' ? 'solid' : 'outline'}
                                        onClick={() => setSelectedDevice('safari-mobile')}
                                    >
                                        iPhone 17 Pro Max
                                    </Button>
                                    <Button
                                        size="sm"
                                        leftIcon={<DevicePhoneMobileIcon className="h-4 w-4" />}
                                        colorScheme={selectedDevice === 'iphone-14-pro-max' ? 'vrv' : 'gray'}
                                        variant={selectedDevice === 'iphone-14-pro-max' ? 'solid' : 'outline'}
                                        onClick={() => setSelectedDevice('iphone-14-pro-max')}
                                    >
                                        iPhone 14 Pro Max (Chrome)
                                    </Button>
                                </HStack>
                            </VStack>
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
                                            key={`${selectedLiveUrl} -${selectedDevice} `}
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
                                <Badge alignSelf="center" colorScheme="vrv" mb={2}>{selectedLiveScreenshot?.[selectedDevice] ? `Beta Version(${selectedDevice})` : `Page Screenshot(${selectedDevice})`}</Badge>
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
                                            key={`${selectedUrl} -${selectedDevice} `}
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