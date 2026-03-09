import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  VStack,
  Text,
  Progress,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Icon,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Checkbox,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  Divider,
  Switch,
  FormControl,
  FormLabel,
  CircularProgress,
  CircularProgressLabel,
  StatHelpText,
  StatArrow,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react'
import { 
  BeakerIcon, 
  ArrowLeftIcon, 
  PlayIcon, 
  StopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  LinkIcon,
  PhotoIcon,
  LanguageIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  PlusIcon
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
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts'
import PageHeader from '../components/layout/PageHeader'
import { projectService } from '../services/projectService'
import axios from 'axios'

function PreRelease() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)
  
  // Workflow State
  const [activeStep, setActiveStep] = useState(0) // 0: Select Project, 1: Project Overview, 2: Active Scan
  const steps = [
      { title: 'Select Project', description: 'Choose a project' },
      { title: 'Project Overview', description: 'Review & Configure' },
      { title: 'Active Scan', description: 'Scan & Analyze' }
  ]

  // Discovery State
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [discoveredUrls, setDiscoveredUrls] = useState([]) // Array of strings
  const [selectedUrls, setSelectedUrls] = useState(new Set())
  
  // --- Advanced Config ---
  const [advConfig, setAdvConfig] = useState({
      concurrentScans: 3,
      discoveryDepth: 2,
      maxPages: 50,
      customSelectors: '',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) QA-Scanner/1.0',
      checkA11y: true,
      checkPerformance: true,
      checkSecurity: true,
      autoExport: false
  })

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analyzedPages, setAnalyzedPages] = useState([]) // Detailed results
  const [currentAnalyzingUrl, setCurrentAnalyzingUrl] = useState('')
  const [abortController, setAbortController] = useState(null)
  const [scanHistory, setScanHistory] = useState([])

  // Config
  const [config, setConfig] = useState({
      checkGrammar: false,
      checkBrokenLinks: true,
      checkImages: true,
      checkDummyContent: true,
      checkVisualQuality: true,
      checkForms: true,
      checkMobile: true
  })

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedScreenshot, setSelectedScreenshot] = useState(null) // Now stores the screenshots object
  const [selectedLiveScreenshot, setSelectedLiveScreenshot] = useState(null) // Now stores the screenshots object
  const [selectedUrl, setSelectedUrl] = useState('')
  const [selectedLiveUrl, setSelectedLiveUrl] = useState('')
  const [selectedPageIssues, setSelectedPageIssues] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('desktop') // 'desktop', 'tablet', 'mobile' // For showing issues in modal

  // Refs for Export
  const reportRef = useRef(null)

  const handleExportReport = async () => {
    if (!reportRef.current) return
    
    toast({
      title: 'Generating Report',
      description: 'Capturing visual report...',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })

    try {
      // @ts-ignore - html2canvas is loaded via CDN in index.html
      const canvas = await window.html2canvas(reportRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      })
      
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `QA-Report-${selectedProject?.name || 'Project'}-${new Date().toISOString().split('T')[0]}.png`
      link.click()

      toast({
        title: 'Report Exported',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: 'Export Failed',
        description: 'Could not generate visual report.',
        status: 'error',
        duration: 4000,
      })
    }
  }

  const toast = useToast()

  useEffect(() => {
    loadProjects()
    
    // Restore scanner state but ONLY if it's not the first load
    const savedState = localStorage.getItem('qa_scanner_state')
    const lastSession = localStorage.getItem('qa_last_session')
    
    // If we have a saved state AND it's from today/recent, restore it
    if (savedState && lastSession) {
        try {
            const parsed = JSON.parse(savedState)
            // Check if we were in the middle of a project
            if (parsed.selectedProject && parsed.activeStep > 0) {
                setSelectedProject(parsed.selectedProject)
                setActiveStep(parsed.activeStep)
                if (parsed.discoveredUrls) setDiscoveredUrls(parsed.discoveredUrls)
                if (parsed.selectedUrls) setSelectedUrls(new Set(parsed.selectedUrls))
                if (parsed.analyzedPages) setAnalyzedPages(parsed.analyzedPages)
                if (parsed.config) setConfig(parsed.config)
                if (parsed.advConfig) setAdvConfig(parsed.advConfig)
            }
        } catch (e) {
            console.error("Failed to restore state", e)
        }
    }
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

  const handleSelectProject = (project) => {
    if (!project.beta_site_url) {
      toast({ title: 'No Beta Site URL', status: 'warning' })
      return
    }
    setSelectedProject(project)
    setActiveStep(1)
    setDiscoveredUrls([])
    setAnalyzedPages([])
    
    // Auto-start discovery when project is selected
    setTimeout(() => {
        startDiscovery()
    }, 500)
    
    // Mark that we have an active session
    localStorage.setItem('qa_last_session', Date.now().toString())
  }

  // --- Helper: Proxy Fetch ---
  const fetchWithProxy = async (url) => {
    const proxies = [
        async (u) => {
            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(u)}`)
            if (!res.ok) throw new Error('Status ' + res.status)
            return await res.text()
        },
        async (u) => {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(u)}&timestamp=${Date.now()}`)
            if (!res.ok) throw new Error('Status ' + res.status)
            const data = await res.json()
            if (!data.contents) throw new Error('No content')
            return data.contents
        },
        async (u) => {
            const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`)
            if (!res.ok) throw new Error('Status ' + res.status)
            return await res.text()
        }
    ]

    let lastError = null
    for (const proxyFn of proxies) {
        try {
            const html = await proxyFn(url)
            if (html && html.length > 50) return html
        } catch (e) {
            lastError = e
        }
    }
    throw lastError || new Error('Failed to fetch content')
  }

  // --- Step 1: Discover Pages ---
  const startDiscovery = async () => {
    setIsDiscovering(true)
    setDiscoveredUrls([])
    setSelectedUrls(new Set())
    
    try {
        const startUrl = selectedProject.beta_site_url
        const baseDomain = new URL(startUrl).hostname
        const visited = new Set()
        const queue = [{ url: startUrl, depth: 0 }]
        const discovered = new Set([startUrl])

        while (queue.length > 0 && discovered.size < advConfig.maxPages) {
            const { url, depth } = queue.shift()
            if (visited.has(url) || depth > advConfig.discoveryDepth) continue
            visited.add(url)

            try {
                const html = await fetchWithProxy(url)
                const parser = new DOMParser()
                const doc = parser.parseFromString(html, 'text/html')
                const links = Array.from(doc.querySelectorAll('a'))

                links.forEach(a => {
                    const href = a.getAttribute('href')
                    if (!href) return
                    try {
                        const fullUrl = new URL(href, startUrl).href
                        const parsedUrl = new URL(fullUrl)
                        
                        if (parsedUrl.hostname === baseDomain && 
                            !parsedUrl.hash && 
                            !parsedUrl.pathname.match(/\.(pdf|jpg|png|zip|exe)$/i) &&
                            !fullUrl.startsWith('mailto:') && 
                            !fullUrl.startsWith('tel:')) {
                            
                            const normalizedUrl = parsedUrl.origin + parsedUrl.pathname
                            if (!discovered.has(normalizedUrl)) {
                                discovered.add(normalizedUrl)
                                if (depth + 1 <= advConfig.discoveryDepth) {
                                    queue.push({ url: normalizedUrl, depth: depth + 1 })
                                }
                            }
                        }
                    } catch (e) {}
                })
            } catch (e) {
                console.warn(`Discovery failed for ${url}:`, e.message)
            }
        }

        const sortedLinks = Array.from(discovered).sort()
        setDiscoveredUrls(sortedLinks)
        setSelectedUrls(new Set(sortedLinks))

    } catch (error) {
        toast({ title: 'Discovery Failed', description: error.message, status: 'error' })
    } finally {
        setIsDiscovering(false)
    }
  }

  // Optional: Add your Google PageSpeed Insights API Key here to avoid rate limits
  const GOOGLE_PAGESPEED_API_KEY = '' 
  // Backend URL for Puppeteer screenshots (Local or Server)
  const BACKEND_URL = 'http://localhost:5000'

  // --- Step 2: Intelligent Analysis ---
  const checkVisualQuality = async (url, isLive = false) => {
      const issues = []
      let screenshots = {
          mobile: null,
          tablet: null,
          desktop: null
      }

      // Try Local Puppeteer Backend ONLY
      try {
          const devices = [
              { name: 'mobile', width: 375 },
              { name: 'tablet', width: 768 },
              { name: 'desktop', width: 1440 }
          ]

          await Promise.all(devices.map(async (dev) => {
              try {
                  const params = new URLSearchParams({
                      url: url,
                      fullPage: 'true',
                      device: dev.name,
                      width: dev.width.toString()
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
                  screenshots[dev.name] = `data:image/jpeg;base64,${base64}`
              } catch (e) {
                  console.warn(`Local Puppeteer failed for ${dev.name}:`, e.message)
              }
          }))
          
          if (!isLive && (screenshots.mobile || screenshots.tablet || screenshots.desktop)) {
              issues.push({ 
                  type: 'success', 
                  category: 'Visual', 
                  message: 'Multi-device screenshots captured via local Puppeteer.' 
              })
          } else if (!isLive) {
              issues.push({ 
                  type: 'error', 
                  category: 'Visual', 
                  message: 'Local Puppeteer failed to capture screenshots. Ensure backend is running.' 
              })
          }
      } catch (e) {
          console.error("Local Puppeteer service error:", e.message)
      }

      return { screenshots, issues }
  }

  // --- New: DOM-based Visual Heuristics (Local) ---
  const analyzeVisualHeuristics = (doc) => {
      const visualIssues = []
      
      // 1. Check for overlapping elements (heuristic: absolute positioned elements)
      const absoluteElements = doc.querySelectorAll('*[style*="position: absolute"], *[style*="position: fixed"]')
      if (absoluteElements.length > 20) {
          visualIssues.push({ 
              type: 'warning', 
              category: 'Visual', 
              message: `High number of absolute/fixed elements (${absoluteElements.length}). Potential for layout overlaps.` 
          })
      }

      // 2. Check for potential text overflow
      const elementsWithLongText = Array.from(doc.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6'))
          .filter(el => el.innerText.length > 500)
      if (elementsWithLongText.length > 0) {
          visualIssues.push({ 
              type: 'info', 
              category: 'Visual', 
              message: `Found ${elementsWithLongText.length} blocks with long text. Check for truncation.` 
          })
      }

      // 3. Check for empty visible elements that might be layout errors
      const emptyDivs = Array.from(doc.querySelectorAll('div'))
          .filter(div => !div.innerText.trim() && !div.querySelector('img, svg, iframe') && div.offsetHeight > 50)
      if (emptyDivs.length > 5) {
          visualIssues.push({ 
              type: 'warning', 
              category: 'Visual', 
              message: `Found ${emptyDivs.length} large empty containers. Could be missing content.` 
          })
      }

      return visualIssues
  }

  const checkGrammar = async (text) => {
      if (!text || text.length < 10) return []
      try {
          // Limit text length to avoid timeouts/large payloads
          const textSample = text.substring(0, 1000) 
          const response = await axios.post(
            'https://api.languagetool.org/v2/check',
            new URLSearchParams({
                text: textSample,
                language: 'en-US'
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        return response.data.matches || []
      } catch (e) {
          console.error("Grammar check failed", e)
          return []
      }
  }

  const analyzeSinglePage = async (url) => {
      try {
          const html = await fetchWithProxy(url)
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')
          const issues = []

          // 1. SEO & Viewport
          const title = doc.querySelector('title')?.innerText
          if (!title) issues.push({ type: 'error', category: 'SEO', message: 'Missing <title> tag' })
          else if (title.length < 10) issues.push({ type: 'warning', category: 'SEO', message: 'Title too short (< 10 chars)' })
          
          if (!doc.querySelector('h1')) issues.push({ type: 'error', category: 'SEO', message: 'Missing <h1> tag' })
          if (!doc.querySelector('meta[name="description"]')) issues.push({ type: 'warning', category: 'SEO', message: 'Missing Meta Description' })
          if (!doc.querySelector('meta[name="viewport"]')) issues.push({ type: 'error', category: 'SEO', message: 'Missing Viewport Meta Tag (Mobile Responsiveness)' })

          // 1b. Heading Hierarchy
          const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          let lastLevel = 0
          headings.forEach(h => {
              const level = parseInt(h.tagName.substring(1))
              if (level > lastLevel + 1) {
                   const prev = lastLevel === 0 ? 'Start' : `H${lastLevel}`
                   issues.push({ type: 'warning', category: 'Accessibility', message: `Skipped heading level: ${prev} -> H${level} (should be H${lastLevel + 1})` })
              }
              lastLevel = level
          })

          // 1c. Deprecated Tags
          const deprecated = doc.querySelectorAll('center, font, marquee, blink, frame')
          deprecated.forEach(el => {
              issues.push({ type: 'error', category: 'Standards', message: `Deprecated HTML tag used: <${el.tagName.toLowerCase()}>` })
          })

          // 1d. Local Visual Heuristics (Always run as a base visual check)
          const localVisualIssues = analyzeVisualHeuristics(doc)
          issues.push(...localVisualIssues)

          // 2. Dummy Content
          const textContent = doc.body.innerText
          if (config.checkDummyContent) {
              const dummyPatterns = [/lorem ipsum/i, /coming soon/i, /add text here/i, /test content/i]
              dummyPatterns.forEach(pattern => {
                  if (pattern.test(textContent)) {
                      issues.push({ type: 'warning', category: 'Content', message: `Potential Dummy Content found: "${pattern.source}"` })
                  }
              })
          }

          // 3. Images
          if (config.checkImages) {
              const images = doc.querySelectorAll('img')
              images.forEach(img => {
                  if (!img.getAttribute('alt')) issues.push({ type: 'warning', category: 'Accessibility', message: `Image missing alt text: ${img.src.substring(img.src.lastIndexOf('/')+1)}` })
                  
                  const src = img.src.toLowerCase()
                  const filename = src.substring(src.lastIndexOf('/')+1)
                  
                  // Suspicious names
                  if (src.includes('screenshot') || src.includes('untitled') || src.includes('ds_store')) {
                      issues.push({ type: 'warning', category: 'Assets', message: `Suspicious image filename: ${filename}` })
                  }

                  // Extensions
                  if (!src.match(/\.(jpg|jpeg|png|gif|svg|webp|avif)$/)) {
                       issues.push({ type: 'warning', category: 'Assets', message: `Image has weird extension or no extension: ${filename}` })
                  }
                  
                  // Mixed Content Check (Images)
                  if (img.src.startsWith('http://') && url.startsWith('https://')) {
                      issues.push({ type: 'error', category: 'Security', message: `Mixed Content: Image loads over HTTP: ${filename}` })
                  }
              })
          }

          // 4. Broken Links, Accessibility & Security
          if (config.checkBrokenLinks) {
              const links = doc.querySelectorAll('a')
              const buttons = doc.querySelectorAll('button')
              const inputs = doc.querySelectorAll('input, select, textarea')
              const linksToCheck = new Set()
              
              // Form Accessibility
              inputs.forEach(input => {
                  if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return
                  const id = input.id
                  let hasLabel = false
                  if (id && doc.querySelector(`label[for="${id}"]`)) hasLabel = true
                  if (input.closest('label')) hasLabel = true
                  if (input.getAttribute('aria-label') || input.getAttribute('aria-labelledby')) hasLabel = true
                  
                  if (!hasLabel) {
                      issues.push({ type: 'warning', category: 'Accessibility', message: `Form input missing label or aria-label` })
                  }
              })

              // Button Checks
              let unlinkedButtons = 0
              buttons.forEach(btn => {
                  const parentA = btn.closest('a')
                  const hasOnClick = btn.getAttribute('onclick') || btn.getAttribute('ng-click') || btn.getAttribute('@click')
                  const isSubmit = btn.getAttribute('type') === 'submit'
                  const hasForm = btn.closest('form')
                  
                  // If it's a button NOT in an anchor, NOT a submit button in a form, and has NO visible JS handler
                  if (!parentA && !isSubmit && !hasForm && !hasOnClick) {
                      unlinkedButtons++
                  }
              })
              if (unlinkedButtons > 0) {
                  issues.push({ type: 'warning', category: 'Accessibility', message: `Found ${unlinkedButtons} buttons with no clear action (link/form/click)` })
              }
              
              links.forEach(a => {
                  const href = a.getAttribute('href')
                  if (!href || href === '#') {
                      if (!a.getAttribute('onclick') && !a.getAttribute('role')) {
                          issues.push({ type: 'warning', category: 'Links', message: `Empty link found` })
                      }
                  } else {
                      try {
                          const linkUrl = new URL(href, url)
                          // External Link Check
                          if (linkUrl.hostname !== new URL(url).hostname) {
                              if (a.getAttribute('target') !== '_blank') {
                                  issues.push({ type: 'warning', category: 'Links', message: `External link opens in same tab: ${linkUrl.hostname}` })
                              }
                              // Security: Target blank vulnerability
                              if (a.getAttribute('target') === '_blank' && (!a.getAttribute('rel') || !a.getAttribute('rel').includes('noopener'))) {
                                   issues.push({ type: 'warning', category: 'Security', message: `External link unsafe: missing rel="noopener": ${linkUrl.hostname}` })
                              }
                          } else {
                              // Collect internal links for broken check (limit 3 per page to save time)
                              if (!href.startsWith('mailto:') && !href.startsWith('tel:')) {
                                  linksToCheck.add(linkUrl.href)
                              }
                          }
                      } catch(e) {}
                  }
              })

              // Check a few links
              const subset = Array.from(linksToCheck).slice(0, 3)
              await Promise.all(subset.map(async (linkUrl) => {
                  try {
                      await fetchWithProxy(linkUrl)
                  } catch (e) {
                      issues.push({ type: 'error', category: 'Links', message: `Broken Link Detected: ${linkUrl}` })
                  }
              }))
          }

          // 5. Grammar (Optional)
          if (config.checkGrammar) {
              const grammarIssues = await checkGrammar(textContent)
              if (grammarIssues.length > 0) {
                  issues.push({ type: 'warning', category: 'Grammar', message: `Found ${grammarIssues.length} potential grammar/spelling issues (first 1000 chars)` })
              }
          }

          // 6. Visual Quality (Optional)
          let screenshots = null
          let liveScreenshots = null
          if (config.checkVisualQuality) {
              // Skip if localhost
              if (url.includes('localhost') || url.includes('127.0.0.1')) {
                   issues.push({ type: 'warning', category: 'Visual', message: 'Visual check skipped for localhost (requires public URL)' })
              } else {
                  // Capture Beta Screenshots (Multi-device)
                  const visualResult = await checkVisualQuality(url)
                  if (visualResult.issues.length > 0) {
                      issues.push(...visualResult.issues)
                  }
                  screenshots = visualResult.screenshots

                  // Capture Live Screenshots if available
                  if (selectedProject.live_site_url) {
                      try {
                          // Try to find equivalent page on live site
                          const betaUrlObj = new URL(url)
                          const liveUrlObj = new URL(selectedProject.live_site_url)
                          const livePageUrl = liveUrlObj.origin + betaUrlObj.pathname
                          
                          const liveResult = await checkVisualQuality(livePageUrl, true)
                          liveScreenshots = liveResult.screenshots
                      } catch (e) {
                          console.warn("Failed to capture live screenshot", e.message)
                      }
                  }
              }
          }

          return {
              url,
              title: title || 'No Title',
              status: issues.some(i => i.type === 'error') ? 'Error' : issues.length > 0 ? 'Warning' : 'Pass',
              issues,
              screenshots,
              liveScreenshots
          }

      } catch (error) {
          return {
              url,
              title: 'Fetch Failed',
              status: 'Error',
              issues: [{ type: 'error', message: `Could not fetch page: ${error.message}` }]
          }
      }
  }

  const handleScanSinglePage = async (url) => {
      if (currentAnalyzingUrl) return 
      
      setCurrentAnalyzingUrl(url)
      
      try {
          const result = await analyzeSinglePage(url)
          
          const newAnalyzedPages = [...analyzedPages.filter(p => p.url !== url), result]
          setAnalyzedPages(newAnalyzedPages)

          // Save Report Data for Report Page
          localStorage.setItem('qa_report_data', JSON.stringify(newAnalyzedPages))
          localStorage.setItem('qa_report_project', JSON.stringify(selectedProject))

          // Save Scanner State for Restoration
          const stateToSave = {
              selectedProject,
              activeStep,
              discoveredUrls,
              selectedUrls: Array.from(selectedUrls),
              analyzedPages: newAnalyzedPages,
              config,
              advConfig
          }
          localStorage.setItem('qa_scanner_state', JSON.stringify(stateToSave))
          
          toast({ title: 'Page Scanned', status: 'success', duration: 1000 })
          
          // Navigate to report and highlight this page
          navigate('/pre-release/report', { state: { highlightUrl: url } })

      } catch (e) {
          toast({ title: 'Scan Failed', description: e.message, status: 'error' })
      } finally {
          setCurrentAnalyzingUrl('')
      }
  }

  const startAnalysis = async () => {
      setIsAnalyzing(true)
      setActiveStep(2)
      setAnalyzedPages([])
      setAnalysisProgress(0)
      
      const queue = Array.from(selectedUrls)
      const controller = new AbortController()
      setAbortController(controller)

      let completed = 0
      const results = []
      
      // Advanced: Concurrent Scanning
      const concurrentLimit = advConfig.concurrentScans || 3
      const chunks = []
      for (let i = 0; i < queue.length; i += concurrentLimit) {
          chunks.push(queue.slice(i, i + concurrentLimit))
      }

      for (const chunk of chunks) {
          if (controller.signal.aborted) break
          
          const chunkResults = await Promise.all(chunk.map(async (url) => {
              setCurrentAnalyzingUrl(url)
              const result = await analyzeSinglePage(url)
              completed++
              setAnalysisProgress(Math.floor((completed / queue.length) * 100))
              return result
          }))
          
          results.push(...chunkResults)
          setAnalyzedPages([...results])
          
          // Small delay between chunks to avoid proxy/API bans
          await new Promise(r => setTimeout(r, 1000))
      }
      
      setIsAnalyzing(false)
      setCurrentAnalyzingUrl('')
      toast({ title: 'Analysis Complete', status: 'success' })

      // Persist results and navigate to report page
      localStorage.setItem('qa_report_data', JSON.stringify(results))
      localStorage.setItem('qa_report_project', JSON.stringify(selectedProject))
      navigate('/pre-release/report')
  }

  const stopAnalysis = () => {
      if (abortController) abortController.abort()
      setIsAnalyzing(false)
  }

  // --- Render ---

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
                  isMobile: 'true',
                  width: '375'
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
          // If it's a data URI, it shouldn't really fail, but if it does, it's a hard error
          if (currentSrc && currentSrc.startsWith('data:')) {
              setIsError(true)
              return
          }

          const nextIdx = providerIdx + 1
          const providers = [
              // WordPress mShots - Support full height via &h=-1 (experimental) or just high width
              (u) => `https://s.wordpress.com/mshots/v1/${encodeURIComponent(u)}?w=1280&v=${Date.now()}`,
              // S-Shot - Support full height via Z100 (full page) and height 0 or high value
              (u) => `https://mini.s-shot.ru/1280x0/JPEG/1280/Z100/?${u}`,
              // Thum.io - Support full height via /fullpage/
              (u) => `https://image.thum.io/get/width/1024/crop/800/fullpage/${u}`
          ]

          if (nextIdx < providers.length && url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
              console.log(`Switching screenshot provider to index ${nextIdx} for ${url}`)
              setProviderIdx(nextIdx)
              setCurrentSrc(providers[nextIdx](url))
          } else {
              setIsError(true)
          }
      }

      if (!currentSrc && !isError) {
          return (
              <Box py={20} textAlign="center" bg="gray.50" borderRadius="md">
                  <Spinner size="xl" color="vrv.500" thickness="4px" />
                  <Text mt={4} color="gray.500">Initializing Screenshot...</Text>
              </Box>
          )
      }

      if (isError || (url && (url.includes('localhost') || url.includes('127.0.0.1')))) {
          return (
              <Box py={20} textAlign="center" bg="gray.50" borderRadius="md" border="1px dashed" borderColor="gray.300">
                  <VStack spacing={3} px={4}>
                      <PhotoIcon className="h-10 w-10 text-gray-300" />
                      <Text color="gray.500" fontSize="sm" fontWeight="bold">Screenshot Unavailable</Text>
                      <Text color="gray.400" fontSize="xs" maxW="300px">
                          {url && (url.includes('localhost') || url.includes('127.0.0.1')) 
                            ? "External providers cannot access localhost. Try the local Puppeteer service."
                            : "External providers failed. This usually means the site blocks automated access."}
                      </Text>
                      <Button 
                        size="sm" 
                        colorScheme="vrv" 
                        leftIcon={<ArrowPathIcon className="h-4 w-4" />}
                        onClick={handleLocalRetry}
                        isLoading={isRetrying}
                        loadingText="Capturing..."
                      >
                        Capture with Local Puppeteer
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
                            {providerIdx === 0 ? "Generating Screenshot..." : `Trying alternative provider (${providerIdx}/3)...`}
                        </Text>
                    </Box>
                } 
              />
          </Box>
      )
  }

  if (selectedProject) {
    return (
      <Box p={{ base: 4, md: 8 }} maxW="1600px" mx="auto">
        <Button 
          leftIcon={<ArrowLeftIcon className="h-4 w-4" />} 
          variant="ghost" 
          mb={6} 
          onClick={() => {
              setSelectedProject(null)
              setActiveStep(0)
              setDiscoveredUrls([])
              setAnalyzedPages([])
              localStorage.removeItem('qa_last_session')
              localStorage.removeItem('qa_scanner_state')
          }}
        >
          Back to Projects
        </Button>
        
        <PageHeader 
          title={`Pre-Release QA: ${selectedProject.name}`} 
          description="Intelligent Page-by-Page Analysis"
        />

        <Stepper index={activeStep} colorScheme="vrv" mb={8}>
            {steps.map((step, index) => (
            <Step key={index}>
                <StepIndicator>
                <StepStatus
                    complete={<StepIcon />}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                />
                </StepIndicator>
                <Box flexShrink='0'>
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
                </Box>
                <StepSeparator />
            </Step>
            ))}
        </Stepper>

        {/* STEP 1: PROJECT OVERVIEW */}
        {activeStep === 1 && (
            <VStack spacing={8} align="stretch">
                <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
                    {/* Left Column: Project Identity */}
                    <VStack spacing={6} align="stretch">
                        <Card shadow="md" variant="outline" borderTop="4px solid" borderTopColor="vrv.500">
                            <CardHeader pb={2}>
                                <HStack>
                                    <Icon as={DocumentTextIcon} className="h-5 w-5 text-vrv.500" />
                                    <Heading size="md">Project Overview</Heading>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                <VStack align="stretch" spacing={4}>
                                    <Box>
                                        <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Project Name</Text>
                                        <Text fontWeight="bold" fontSize="lg">{selectedProject.name}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Beta Environment</Text>
                                        <HStack>
                                            <LinkIcon className="h-3 w-3 text-vrv.500" />
                                            <Text fontSize="sm" color="vrv.600" fontWeight="medium" noOfLines={1}>{selectedProject.beta_site_url}</Text>
                                        </HStack>
                                    </Box>
                                    <Box>
                                        <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Production/Live</Text>
                                        <HStack>
                                            <LinkIcon className="h-3 w-3 text-green.500" />
                                            <Text fontSize="sm" color="green.600" fontWeight="medium" noOfLines={1}>{selectedProject.live_site_url || 'Not Set'}</Text>
                                        </HStack>
                                    </Box>
                                </VStack>
                            </CardBody>
                        </Card>

                        <Card shadow="sm">
                            <CardHeader pb={2}>
                                <HStack>
                                    <Icon as={ArrowPathIcon} className="h-5 w-5 text-vrv.500" />
                                    <Heading size="md">Scan Scope</Heading>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                <VStack align="stretch" spacing={4}>
                                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                        <FormLabel htmlFor="check-links" mb="0" fontSize="sm">Broken Links</FormLabel>
                                        <Switch id="check-links" size="md" colorScheme="vrv" isChecked={config.checkBrokenLinks} onChange={(e) => setConfig({...config, checkBrokenLinks: e.target.checked})} />
                                    </FormControl>
                                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                        <FormLabel htmlFor="check-images" mb="0" fontSize="sm">Image Assets</FormLabel>
                                        <Switch id="check-images" size="md" colorScheme="vrv" isChecked={config.checkImages} onChange={(e) => setConfig({...config, checkImages: e.target.checked})} />
                                    </FormControl>
                                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                        <FormLabel htmlFor="check-dummy" mb="0" fontSize="sm">Dummy Content</FormLabel>
                                        <Switch id="check-dummy" size="md" colorScheme="vrv" isChecked={config.checkDummyContent} onChange={(e) => setConfig({...config, checkDummyContent: e.target.checked})} />
                                    </FormControl>
                                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                        <FormLabel htmlFor="check-visual" mb="0" fontSize="sm">Visual Quality</FormLabel>
                                        <Switch id="check-visual" size="md" colorScheme="vrv" isChecked={config.checkVisualQuality} onChange={(e) => setConfig({...config, checkVisualQuality: e.target.checked})} />
                                    </FormControl>
                                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                        <FormLabel htmlFor="check-grammar" mb="0" fontSize="sm">Grammar Check</FormLabel>
                                        <Switch id="check-grammar" size="md" colorScheme="vrv" isChecked={config.checkGrammar} onChange={(e) => setConfig({...config, checkGrammar: e.target.checked})} />
                                    </FormControl>
                                </VStack>
                            </CardBody>
                        </Card>
                    </VStack>

                    {/* Right Column: Page Selection */}
                    <Box gridColumn={{ lg: "span 2" }}>
                        <Card shadow="md" h="full">
                            <CardHeader borderBottom="1px" borderColor="gray.100">
                                <HStack justify="space-between">
                                    <Box>
                                        <Heading size="md">Select Pages to Analyze</Heading>
                                        <Text fontSize="sm" color="gray.500">
                                            {isDiscovering ? 'Searching for pages...' : `${discoveredUrls.length} pages discovered`}
                                        </Text>
                                    </Box>
                                    <HStack>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            leftIcon={<ArrowPathIcon className={isDiscovering ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />}
                                            onClick={startDiscovery}
                                            isLoading={isDiscovering}
                                        >
                                            Rescan
                                        </Button>
                                        <Divider orientation="vertical" h="20px" />
                                        <Button size="xs" variant="link" color="vrv.500" onClick={() => setSelectedUrls(new Set(discoveredUrls))}>Select All</Button>
                                        <Button size="xs" variant="link" color="gray.500" onClick={() => setSelectedUrls(new Set())}>Deselect All</Button>
                                    </HStack>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                {isDiscovering && discoveredUrls.length === 0 ? (
                                    <VStack py={20} spacing={4}>
                                        <Spinner size="xl" color="vrv.500" thickness="4px" />
                                        <Text color="gray.500">Crawling {selectedProject.beta_site_url}...</Text>
                                    </VStack>
                                ) : discoveredUrls.length > 0 ? (
                                    <VStack align="stretch" spacing={6}>
                                        <Box maxH="450px" overflowY="auto" pr={2} className="custom-scrollbar">
                                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                                {discoveredUrls.map(url => (
                                                    <HStack 
                                                        key={url} 
                                                        p={3} 
                                                        borderRadius="lg" 
                                                        borderWidth="1px"
                                                        borderColor={selectedUrls.has(url) ? 'vrv.200' : 'transparent'}
                                                        bg={selectedUrls.has(url) ? 'vrv.50' : 'gray.50'}
                                                        transition="all 0.2s"
                                                        _hover={{ bg: selectedUrls.has(url) ? 'vrv.100' : 'gray.100' }}
                                                    >
                                                        <Checkbox 
                                                            colorScheme="vrv"
                                                            isChecked={selectedUrls.has(url)}
                                                            onChange={(e) => {
                                                                const next = new Set(selectedUrls)
                                                                if (e.target.checked) next.add(url)
                                                                else next.delete(url)
                                                                setSelectedUrls(next)
                                                            }}
                                                        />
                                                        <Text fontSize="xs" fontWeight="medium" noOfLines={1} color={selectedUrls.has(url) ? 'vrv.700' : 'gray.700'}>
                                                            {url.replace(selectedProject.beta_site_url, '') || '/'}
                                                        </Text>
                                                    </HStack>
                                                ))}
                                            </SimpleGrid>
                                        </Box>
                                        
                                        <Box p={6} bg="vrv.500" borderRadius="xl" color="white" shadow="lg">
                                            <HStack justify="space-between" mb={4}>
                                                <VStack align="start" spacing={0}>
                                                    <Text fontSize="sm" opacity={0.9}>Ready to scan</Text>
                                                    <Text fontSize="2xl" fontWeight="bold">{selectedUrls.size} Pages Selected</Text>
                                                </VStack>
                                                <Icon as={ShieldCheckIcon} className="h-10 w-10 opacity={0.3}" />
                                            </HStack>
                                            <Button 
                                                bg="white" 
                                                color="vrv.500" 
                                                size="lg" 
                                                w="full" 
                                                _hover={{ bg: 'gray.50', transform: 'translateY(-2px)' }}
                                                _active={{ bg: 'gray.100' }}
                                                leftIcon={<PlayIcon className="h-5 w-5" />}
                                                isDisabled={selectedUrls.size === 0}
                                                onClick={() => {
                                                    setActiveStep(2)
                                                    startAnalysis()
                                                }}
                                            >
                                                Begin Comprehensive Analysis
                                            </Button>
                                        </Box>
                                    </VStack>
                                ) : (
                                    <Box py={20} textAlign="center" border="2px dashed" borderColor="gray.100" borderRadius="lg">
                                        <VStack spacing={4}>
                                            <DocumentTextIcon className="h-12 w-12 text-gray-200" />
                                            <Text color="gray.400">No pages found. Try rescanning or check the URL.</Text>
                                            <Button size="sm" onClick={startDiscovery} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>Retry Discovery</Button>
                                        </VStack>
                                    </Box>
                                )}
                            </CardBody>
                        </Card>
                    </Box>
                </SimpleGrid>
            </VStack>
        )}

        {/* STEP 2: ACTIVE SCAN */}
        {activeStep === 2 && (
            <VStack spacing={8} align="stretch" animation="fadeIn 0.5s ease-out">
                {/* Progress Header */}
                <Card variant="outline" bg="white" shadow="sm" borderRadius="xl">
                    <CardBody py={6}>
                        <VStack spacing={6}>
                            <HStack w="full" justify="space-between">
                                <VStack align="start" spacing={1}>
                                    <Heading size="md" color="vrv.700">
                                        {isAnalyzing ? 'Scanning in Progress...' : 'Scan Complete'}
                                    </Heading>
                                    <Text color="gray.500" fontSize="sm">
                                        {isAnalyzing 
                                            ? `Analyzing ${analyzedPages.length} of ${selectedUrls.size} pages` 
                                            : `Finished analyzing ${analyzedPages.length} pages`}
                                    </Text>
                                </VStack>
                                {isAnalyzing && (
                                    <Button 
                                        leftIcon={<StopIcon className="h-5 w-5" />} 
                                        colorScheme="red" 
                                        variant="ghost"
                                        onClick={stopAnalysis}
                                        size="sm"
                                    >
                                        Stop Scan
                                    </Button>
                                )}
                            </HStack>
                            
                            <Box w="full">
                                <Progress 
                                    value={analysisProgress} 
                                    size="md" 
                                    colorScheme="vrv" 
                                    borderRadius="full"
                                    hasStripe
                                    isAnimated={isAnalyzing}
                                />
                                <HStack justify="space-between" mt={2} fontSize="xs" color="gray.400" fontWeight="medium">
                                    <Text>{Math.round(analysisProgress)}% Complete</Text>
                                    <Text>{analyzedPages.length} / {selectedUrls.size} Pages</Text>
                                </HStack>
                            </Box>
                        </VStack>
                    </CardBody>
                </Card>

                {analyzedPages.length > 0 && (
                    <Box ref={reportRef} p={4} bg="gray.50" borderRadius="xl">
                        {/* Scan Metrics Grid */}
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                            <Card variant="outline" bg="white" shadow="sm">
                                <CardBody>
                                    <Stat>
                                        <StatLabel fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Total Issues</StatLabel>
                                        <StatNumber fontSize="3xl" color="red.500">
                                            {analyzedPages.reduce((acc, page) => acc + page.issues.length, 0)}
                                        </StatNumber>
                                        <StatHelpText>
                                            Avg {Math.round(analyzedPages.reduce((acc, page) => acc + page.issues.length, 0) / (analyzedPages.length || 1))} per page
                                        </StatHelpText>
                                    </Stat>
                                </CardBody>
                            </Card>
                            <Card variant="outline" bg="white" shadow="sm">
                                <CardBody>
                                    <Stat>
                                        <StatLabel fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Avg. Health</StatLabel>
                                        <StatNumber fontSize="3xl" color="green.500">
                                            {Math.round(analyzedPages.reduce((acc, page) => {
                                                const errorCount = page.issues.filter(i => i.type === 'error').length
                                                const warningCount = page.issues.filter(i => i.type === 'warning').length
                                                return acc + Math.max(0, 100 - (errorCount * 10) - (warningCount * 2))
                                            }, 0) / (analyzedPages.length || 1))}%
                                        </StatNumber>
                                        <StatHelpText>Across all pages</StatHelpText>
                                    </Stat>
                                </CardBody>
                            </Card>
                            <Card variant="outline" bg="white" shadow="sm">
                                <CardBody>
                                    <Stat>
                                        <StatLabel fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Critical Issues</StatLabel>
                                        <StatNumber fontSize="3xl" color="red.600">
                                            {analyzedPages.reduce((acc, page) => acc + page.issues.filter(i => i.type === 'error').length, 0)}
                                        </StatNumber>
                                        <StatHelpText>Requires immediate attention</StatHelpText>
                                    </Stat>
                                </CardBody>
                            </Card>
                        </SimpleGrid>

                        {/* Visual Analytics */}
                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                            <Card variant="outline" bg="white" shadow="sm" borderRadius="xl">
                                <CardHeader borderBottomWidth="1px" borderColor="gray.50" py={4}>
                                    <Heading size="sm" color="vrv.700">Issue Distribution</Heading>
                                </CardHeader>
                                <CardBody h="350px">
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
                                                    if (data.length === 0) return <Cell key="cell-0" fill="#48BB78" />
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

                            <Card variant="outline" bg="white" shadow="sm" borderRadius="xl">
                                <CardHeader borderBottomWidth="1px" borderColor="gray.50" py={4}>
                                    <Heading size="sm" color="vrv.700">Page Health Scores</Heading>
                                </CardHeader>
                                <CardBody h="350px">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={analyzedPages.slice(0, 10).map(page => {
                                                const errorCount = page.issues.filter(i => i.type === 'error').length
                                                const warningCount = page.issues.filter(i => i.type === 'warning').length
                                                return { 
                                                    name: page.url.split('/').pop() || 'Home', 
                                                    score: Math.max(0, 100 - (errorCount * 10) - (warningCount * 2))
                                                }
                                            })}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="name" fontSize={10} interval={0} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 100]} fontSize={12} axisLine={false} tickLine={false} />
                                            <RechartsTooltip 
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                                {analyzedPages.slice(0, 10).map((page, index) => {
                                                    const errorCount = page.issues.filter(i => i.type === 'error').length
                                                    const warningCount = page.issues.filter(i => i.type === 'warning').length
                                                    const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 2))
                                                    return <Cell key={`cell-${index}`} fill={score > 80 ? '#10B981' : score > 50 ? '#F59E0B' : '#EF4444'} />
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardBody>
                            </Card>
                        </SimpleGrid>
                    </Box>
                )}

                {/* Detailed Results */}
                <Card variant="outline" bg="white" shadow="sm" borderRadius="xl">
                    <CardHeader borderBottomWidth="1px" borderColor="gray.50" py={4} display="flex" justifyContent="space-between" alignItems="center">
                        <Heading size="sm" color="vrv.700">Detailed Analysis Results</Heading>
                        {!isAnalyzing && (
                            <HStack spacing={2}>
                                <Button size="sm" variant="ghost" onClick={() => setActiveStep(1)} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
                                    New Selection
                                </Button>
                                <Button 
                                    size="sm" 
                                    colorScheme="vrv" 
                                    leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                                    onClick={handleExportReport}
                                >
                                    Export Report
                                </Button>
                            </HStack>
                        )}
                    </CardHeader>
                    <CardBody p={0}>
                        <Accordion allowMultiple>
                            {analyzedPages.map((page, index) => {
                                const errorCount = page.issues.filter(i => i.type === 'error').length
                                const warningCount = page.issues.filter(i => i.type === 'warning').length
                                const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 2))
                                const issuesByCategory = page.issues.reduce((acc, issue) => {
                                    const cat = issue.category || 'Other'
                                    if (!acc[cat]) acc[cat] = []
                                    acc[cat].push(issue)
                                    return acc
                                }, {})

                                return (
                                    <AccordionItem key={index} border="none" _hover={{ bg: 'gray.50' }}>
                                        <h2>
                                            <AccordionButton py={4}>
                                                <Box flex="1" textAlign="left">
                                                    <HStack spacing={4}>
                                                        <CircularProgress value={score} color={score > 80 ? 'green.400' : score > 50 ? 'orange.400' : 'red.400'} size="40px">
                                                            <CircularProgressLabel fontSize="xs" fontWeight="bold">{score}</CircularProgressLabel>
                                                        </CircularProgress>
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontWeight="bold" fontSize="sm" color="gray.700">{page.title}</Text>
                                                            <Text fontSize="xs" color="gray.400" isTruncated maxW="400px">{page.url}</Text>
                                                        </VStack>
                                                    </HStack>
                                                </Box>
                                                <HStack spacing={4} mr={4}>
                                                    {page.screenshots && (Object.values(page.screenshots).some(s => s !== null)) && (
                                                        <Button size="xs" variant="ghost" leftIcon={<PhotoIcon className="h-3 w-3" />} onClick={(e) => {
                                                            e.stopPropagation()
                                                            setSelectedScreenshot(page.screenshots)
                                                            setSelectedLiveScreenshot(page.liveScreenshots)
                                                            setSelectedUrl(page.url)
                                                            setSelectedLiveUrl(page.liveUrl || (selectedProject && page.url ? (new URL(selectedProject.live_site_url).origin + new URL(page.url).pathname) : ''))
                                                            setSelectedPageIssues(page.issues)
                                                            onOpen()
                                                        }}>
                                                            Compare
                                                        </Button>
                                                    )}
                                                    {errorCount > 0 && <Badge colorScheme="red" variant="subtle">{errorCount} Errors</Badge>}
                                                    {warningCount > 0 && <Badge colorScheme="orange" variant="subtle">{warningCount} Warnings</Badge>}
                                                </HStack>
                                                <AccordionIcon />
                                            </AccordionButton>
                                        </h2>
                                        <AccordionPanel pb={6} px={6}>
                                            {page.issues.length > 0 ? (
                                                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                                                    {Object.entries(issuesByCategory).map(([category, issues]) => (
                                                        <Box key={category} p={4} borderRadius="lg" bg="white" borderWidth="1px" borderColor="gray.100" shadow="sm">
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
                                                                <Badge ml="auto" borderRadius="full">{issues.length}</Badge>
                                                            </HStack>
                                                            <VStack align="start" spacing={2}>
                                                                {issues.map((issue, i) => (
                                                                    <HStack key={i} w="full" alignItems="start" spacing={2} p={2} borderRadius="md" _hover={{ bg: 'gray.50' }}>
                                                                        <Box mt={1}>
                                                                            {issue.type === 'error' ? 
                                                                                <XCircleIcon className="h-4 w-4 text-red-500" /> : 
                                                                                <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
                                                                            }
                                                                        </Box>
                                                                        <Text fontSize="sm" color="gray.700">{issue.message}</Text>
                                                                    </HStack>
                                                                ))}
                                                            </VStack>
                                                        </Box>
                                                    ))}
                                                </SimpleGrid>
                                            ) : (
                                                <VStack py={8} spacing={2}>
                                                    <CheckCircleIcon className="h-10 w-10 text-green-500" />
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

                {/* Scan Actions */}
                {!isAnalyzing && (
                    <HStack justify="center" spacing={4} pt={4}>
                        <Button 
                            colorScheme="vrv" 
                            size="lg"
                            px={8}
                            onClick={() => {
                                setAnalyzedPages([])
                                startAnalysis()
                            }}
                            leftIcon={<PlayIcon className="h-5 w-5" />}
                        >
                            Restart Full Scan
                        </Button>
                    </HStack>
                )}
            </VStack>
        )}

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
                                        <Button 
                                            mt={4} 
                                            size="sm" 
                                            onClick={() => {
                                                // Handle single device fallback or retry logic
                                            }}
                                        >
                                            Try Capture
                                        </Button>
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

  // --- Initial View: Project List ---
  return (
    <Box p={{ base: 4, md: 8 }} maxW="1400px" mx="auto">
      <PageHeader 
        title="Pre-Release QA" 
        description="Select a project to start a comprehensive page-by-page quality analysis."
        buttonLabel="Manage Projects"
        onButtonClick={() => navigate('/projects')}
      />

      {isLoading ? (
          <Box textAlign="center" py={20}>
              <Spinner size="xl" color="vrv.500" thickness="4px" />
              <Text mt={4} color="gray.500">Loading your projects...</Text>
          </Box>
      ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {projects.map(project => (
                  <Card 
                    key={project.id} 
                    shadow="sm" 
                    borderWidth="1px" 
                    borderColor="gray.100"
                    _hover={{ shadow: 'md', borderColor: 'vrv.200', transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                    cursor="pointer"
                    onClick={() => handleSelectProject(project)}
                  >
                      <CardBody>
                          <VStack align="stretch" spacing={4}>
                              <HStack justify="space-between">
                                  <Badge colorScheme={project.status === 'Active' ? 'green' : 'gray'} borderRadius="full" px={2}>
                                      {project.status}
                                  </Badge>
                                  <Icon as={BeakerIcon} className="h-5 w-5 text-vrv.500" />
                              </HStack>
                              
                              <Box>
                                  <Heading size="md" mb={1}>{project.name}</Heading>
                                  <Text fontSize="sm" color="gray.500" noOfLines={1}>
                                      {project.beta_site_url || 'No URL configured'}
                                  </Text>
                              </Box>

                              <Divider />

                              <HStack justify="space-between" fontSize="xs" color="gray.400">
                                  <Text>Last scan: Never</Text>
                                  <HStack spacing={1}>
                                      <LinkIcon className="h-3 w-3" />
                                      <Text>Beta Site</Text>
                                  </HStack>
                              </HStack>

                              <Button 
                                  colorScheme="vrv" 
                                  width="full"
                                  isDisabled={!project.beta_site_url}
                                  leftIcon={<PlayIcon className="h-4 w-4" />}
                              >
                                  Start New Scan
                              </Button>
                          </VStack>
                      </CardBody>
                  </Card>
              ))}
              
              {/* Add Project Placeholder */}
              <Box 
                border="2px dashed" 
                borderColor="gray.200" 
                borderRadius="xl" 
                p={8} 
                textAlign="center"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                cursor="pointer"
                _hover={{ borderColor: 'vrv.300', bg: 'gray.50' }}
                onClick={() => navigate('/projects')}
              >
                  <PlusIcon className="h-8 w-8 text-gray-300 mb-2" />
                  <Text fontWeight="medium" color="gray.500">Add New Project</Text>
              </Box>
          </SimpleGrid>
      )}
    </Box>
  )
}

export default PreRelease
