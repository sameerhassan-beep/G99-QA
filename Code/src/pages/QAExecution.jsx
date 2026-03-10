import { useState, useEffect } from 'react'
import { Readability } from '@mozilla/readability'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
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
  Badge,
  Textarea,
  Link,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Progress,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  InputGroup,
  InputLeftAddon,
  IconButton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  useSteps,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react'
import { ExternalLinkIcon, CheckCircleIcon, WarningIcon, ViewIcon, DownloadIcon, AttachmentIcon, AddIcon, RepeatIcon, DeleteIcon, CopyIcon } from '@chakra-ui/icons'
import PageHeader from '../components/layout/PageHeader'
import { projectService } from '../services/projectService'
import { authService } from '../services/authService'
import { ClipboardDocumentCheckIcon, BoltIcon, DocumentMagnifyingGlassIcon, LinkIcon, BeakerIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

const DEFAULT_PHASE_CHECKLISTS = {
  phase1: {
    'browser_chrome_desktop': { label: 'Chrome: Desktop (Default Resolution)', status: 'pending', comment: '', attachments: [] },
    'browser_chrome_ipad': { label: 'Chrome: iPad Pro (1024 x 1366)', status: 'pending', comment: '', attachments: [] },
    'browser_chrome_iphone': { label: 'Chrome: iPhone 14 Pro Max (414 x 736)', status: 'pending', comment: '', attachments: [] },
    'browser_safari_desktop': { label: 'Safari: 18 Desktop (macOS Sequoia 1440 x 900)', status: 'pending', comment: '', attachments: [] },
    'browser_safari_tablet': { label: 'Safari: iPad Pro 12.9" (iOS 26.0)', status: 'pending', comment: '', attachments: [] },
    'browser_safari_mobile': { label: 'Safari: iPhone 17 Pro Max (iOS 26.0)', status: 'pending', comment: '', attachments: [] },
    'screen_small_tablet': { label: 'Small Laptop / Tablet (1024 x 768)', status: 'pending', comment: '', attachments: [] },
    'screen_compact_laptop': { label: 'Compact Laptop 11" (1280 x 800)', status: 'pending', comment: '', attachments: [] },
    'screen_standard_laptop': { label: 'Standard Laptop 14" (1366 x 768)', status: 'pending', comment: '', attachments: [] },
    'issue_dummy_links': { label: 'Check for Dummy/Placeholder Links', status: 'pending', comment: '', attachments: [] },
    'issue_404_errors': { label: 'Check for 404 Errors', status: 'pending', comment: '', attachments: [] },
    'issue_malware': { label: 'Malware & Security Scan', status: 'pending', comment: '', attachments: [] },
    'issue_portfolio': { label: 'Portfolio Errors', status: 'pending', comment: '', attachments: [] },
    'issue_images': { label: 'Image Loading & Proportion Issues', status: 'pending', comment: '', attachments: [] },
    'issue_header_footer': { label: 'Header / Footer Layout Issues', status: 'pending', comment: '', attachments: [] },
    'issue_redirects': { label: 'Link Redirection Issues', status: 'pending', comment: '', attachments: [] },
    'ui_manual_func': { label: 'Manual Buttons & Links Check', status: 'pending', comment: '', attachments: [] },
    'ui_spacing_align': { label: 'Spacing & Alignment Check', status: 'pending', comment: '', attachments: [] },
    'ui_read_more': { label: 'Remove "Read More" (if required)', status: 'pending', comment: '', attachments: [] },
    'ui_watermarks': { label: 'Check for Watermarks in Images', status: 'pending', comment: '', attachments: [] },
    'ui_favicon': { label: 'Favicon Present', status: 'pending', comment: '', attachments: [] },
    'ui_hamburger_menu': { label: 'Hamburger Menu (Social, Contact, Book Now)', status: 'pending', comment: '', attachments: [] },
    'ui_sticky_header': { label: 'Sticky Header across breakpoints', status: 'pending', comment: '', attachments: [] },
    'ui_privacy_policy': { label: 'Privacy Policy Page Functional', status: 'pending', comment: '', attachments: [] },
    'ui_footer_logo': { label: 'Footer Logo (New, no tagline)', status: 'pending', comment: '', attachments: [] },
  },
  phase2: {
    'form_growth99': { label: 'Growth99 Form End-to-End Submission', status: 'pending', comment: '', attachments: [] },
    'form_consultation_assessment': { label: 'Self-Assessment / Virtual Consultation', status: 'pending', comment: '', attachments: [] },
    'form_chatbot_logo': { label: 'Chatbot (Correct Business Logo)', status: 'pending', comment: '', attachments: [] },
    'form_single_script': { label: 'Single Script Integration Check', status: 'pending', comment: '', attachments: [] },
    'url_metadata_match': { label: 'URL & Metadata Matches Page Name', status: 'pending', comment: '', attachments: [] },
    'url_social_preview': { label: 'Social Sharing Preview (Hangouts/SMS)', status: 'pending', comment: '', attachments: [] },
    'blog_beta_sync': { label: 'Blog Sync (Beta vs Live)', status: 'pending', comment: '', attachments: [] },
    'blog_sidebar_widget': { label: 'Blog Sidebar Widgets Functionality', status: 'pending', comment: '', attachments: [] },
    'map_address_gmb': { label: 'Map Address matches GMB', status: 'pending', comment: '', attachments: [] },
    'hero_video_fallback': { label: 'Hero Video / Fallback Image', status: 'pending', comment: '', attachments: [] },
    'hero_no_yt_icons': { label: 'Hero Video (No Youtube Icons)', status: 'pending', comment: '', attachments: [] },
    'header_breaking_points': { label: 'Header False Breaking Points Check', status: 'pending', comment: '', attachments: [] },
  },
  phase3: {
    'live_beta_exact_match': { label: 'Live vs Beta Exact Functionality', status: 'pending', comment: '', attachments: [] },
    'live_no_beta_urls': { label: 'No Beta URLs in Live Site', status: 'pending', comment: '', attachments: [] },
    'live_g99_features_recheck': { label: 'Re-check growth99 features on Live', status: 'pending', comment: '', attachments: [] },
    'ada_compliance_type': { label: 'ADA Compliance (Complete vs Basic)', status: 'pending', comment: '', attachments: [] },
    'gsr_search_preview': { label: 'GSR Search Preview Snippet Match', status: 'pending', comment: '', attachments: [] },
    'gsr_meta_title_desc': { label: 'GSR Meta Title & Description Check', status: 'pending', comment: '', attachments: [] },
    'monitoring_loading_speed': { label: 'Page Loading Speed Monitoring', status: 'pending', comment: '', attachments: [] },
    'monitoring_daily_manual': { label: 'Daily Manual Website Testing', status: 'pending', comment: '', attachments: [] },
  }
}

function QAExecution() {
  const toast = useToast()
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAutoChecking, setIsAutoChecking] = useState(false)
  const [autoCheckResults, setAutoCheckResults] = useState(null)

  // URL Comparison State
  const [betaUrlInput, setBetaUrlInput] = useState('')
  const [pagePaths, setPagePaths] = useState('/home\n/about\n/contact')
  const [comparisonResults, setComparisonResults] = useState(null)

  // Content Analysis State
  const [contentUrl, setContentUrl] = useState('')
  const [contentToAnalyze, setContentToAnalyze] = useState('')
  const [analysisResults, setAnalysisResults] = useState(null)
  const [pageAnalysis, setPageAnalysis] = useState(null)
  const [keywordStats, setKeywordStats] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Phase-based QA Workflow State
  const [currentPhase, setCurrentPhase] = useState(0)
  const phases = [
    { title: 'Pre-Release Testing', description: 'Browser & Device Testing' },
    { title: 'Medium Tasks', description: 'Functionality & Integrations' },
    { title: 'Post-Release', description: 'Live Validation & Compliance' }
  ]

  // QA Checklist State - Reorganized by Phase
  const [phaseChecklists, setPhaseChecklists] = useState(DEFAULT_PHASE_CHECKLISTS)

  const [newItemName, setNewItemName] = useState('')
  const [overallComment, setOverallComment] = useState('')

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // Load persistence
  useEffect(() => {
    if (selectedProjectId) {
      const savedData = localStorage.getItem(`qa_progress_${selectedProjectId}`)
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          if (parsed.phaseChecklists) setPhaseChecklists(parsed.phaseChecklists)
          if (parsed.currentPhase !== undefined) setCurrentPhase(parsed.currentPhase)
          setOverallComment(parsed.overallComment || '')
          if (parsed.pagePaths) setPagePaths(parsed.pagePaths)
          if (parsed.betaUrlInput) setBetaUrlInput(parsed.betaUrlInput)
          if (parsed.contentUrl) setContentUrl(parsed.contentUrl)
          if (parsed.contentToAnalyze) setContentToAnalyze(parsed.contentToAnalyze)
          if (parsed.pageAnalysis) setPageAnalysis(parsed.pageAnalysis)
          if (parsed.keywordStats) setKeywordStats(parsed.keywordStats)
        } catch (e) {
          console.error("Failed to load saved progress", e)
        }
      }
    }
  }, [selectedProjectId])

  // Save persistence
  useEffect(() => {
    if (selectedProjectId) {
      const dataToSave = {
        phaseChecklists,
        currentPhase,
        overallComment,
        pagePaths,
        betaUrlInput,
        contentUrl,
        contentToAnalyze,
        pageAnalysis,
        keywordStats,
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem(`qa_progress_${selectedProjectId}`, JSON.stringify(dataToSave))
    }
  }, [phaseChecklists, currentPhase, overallComment, pagePaths, betaUrlInput, contentUrl, contentToAnalyze, pageAnalysis, keywordStats, selectedProjectId])

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId)
      setSelectedProject(project)
      // Reset checklist when project changes - Persistence logic handles loading
      setAutoCheckResults(null)
      setComparisonResults(null)
      // Only reset if no saved data (handled by persistence effect, but we need to ensure we don't overwrite if switching)
      // Actually, persistence effect runs AFTER this because selectedProjectId changes. 
      // But we need to handle the "New Project Selection" cleanly.

      // Let's rely on the persistence effect to load data, but we need to set defaults if none exists.
      // The persistence effect depends on [selectedProjectId], so it will fire.
      // Reset phase checklists when project changes
      setPhaseChecklists(DEFAULT_PHASE_CHECKLISTS)
      setCurrentPhase(0)
      setOverallComment('')
      setBetaUrlInput(project?.beta_site_url || '')
      setContentUrl(project?.live_site_url || '')
      // setPagePaths defaults are fine
    } else {
      setSelectedProject(null)
      setContentUrl('')
    }
  }, [selectedProjectId, projects])

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const data = await projectService.getProjects()
      setProjects(data)
    } catch (error) {
      toast({
        title: 'Error loading projects',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetChecklist = () => {
    if (window.confirm('Are you sure? This will clear all current progress for this project.')) {
      setPhaseChecklists(DEFAULT_PHASE_CHECKLISTS)
      setCurrentPhase(0)
      setOverallComment('')
      setAutoCheckResults(null)
      localStorage.removeItem(`qa_progress_${selectedProjectId}`)
    }
  }

  // Phase Helper Functions
  const getCurrentPhaseKey = () => `phase${currentPhase + 1}`

  const getPhaseProgress = (phaseKey) => {
    const items = phaseChecklists[phaseKey]
    if (!items) return { completed: 0, total: 0, percentage: 0 }
    const total = Object.keys(items).length
    const completed = Object.values(items).filter(item => item.status !== 'pending').length
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 }
  }

  const canAdvancePhase = () => {
    const phaseKey = getCurrentPhaseKey()
    const progress = getPhaseProgress(phaseKey)
    return progress.percentage === 100
  }

  const handleNextPhase = () => {
    if (currentPhase < phases.length - 1 && canAdvancePhase()) {
      setCurrentPhase(currentPhase + 1)
      toast({ title: `Moved to ${phases[currentPhase + 1].title}`, status: 'success', duration: 2000 })
    } else if (!canAdvancePhase()) {
      toast({ title: 'Complete all items before advancing', status: 'warning', duration: 2000 })
    }
  }

  const handlePreviousPhase = () => {
    if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1)
    }
  }

  const handlePhaseChecklistChange = (key, field, value) => {
    const phaseKey = getCurrentPhaseKey()
    setPhaseChecklists(prev => {
      if (!prev[phaseKey] || !prev[phaseKey][key]) return prev
      return {
        ...prev,
        [phaseKey]: {
          ...prev[phaseKey],
          [key]: {
            ...prev[phaseKey][key],
            [field]: value
          }
        }
      }
    })
  }

  const handleUpdateTotalChecklist = (phaseKey, itemKey, field, value) => {
    setPhaseChecklists(prev => {
      if (!prev[phaseKey] || !prev[phaseKey][itemKey]) return prev
      return {
        ...prev,
        [phaseKey]: {
          ...prev[phaseKey],
          [itemKey]: {
            ...prev[phaseKey][itemKey],
            [field]: value
          }
        }
      }
    })
  }


  // UI Helper Functions
  const handleAddAttachment = (key) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const phaseKey = getCurrentPhaseKey()
        setPhaseChecklists(prev => {
          if (!prev[phaseKey] || !prev[phaseKey][key]) return prev
          return {
            ...prev,
            [phaseKey]: {
              ...prev[phaseKey],
              [key]: {
                ...prev[phaseKey][key],
                attachments: [...(prev[phaseKey][key].attachments || []), file.name]
              }
            }
          }
        })
        toast({ title: 'Attachment added', status: 'success', duration: 2000 })
      }
    }
    input.click()
  }

  const handleDeleteItem = (key) => {
    if (window.confirm('Delete this checklist item?')) {
      const phaseKey = getCurrentPhaseKey()
      setPhaseChecklists(prev => {
        const newPhase = { ...prev[phaseKey] }
        delete newPhase[key]
        return { ...prev, [phaseKey]: newPhase }
      })
    }
  }

  const handleAddCustomItem = () => {
    if (newItemName.trim()) {
      const phaseKey = getCurrentPhaseKey()
      const itemKey = `custom_${Date.now()}`
      setPhaseChecklists(prev => ({
        ...prev,
        [phaseKey]: {
          ...prev[phaseKey],
          [itemKey]: { label: newItemName, status: 'pending', comment: '', attachments: [] }
        }
      }))
      setNewItemName('')
      toast({ title: 'Item added', status: 'success', duration: 2000 })
    }
  }

  const handleExportReport = () => {
    const report = {
      project: selectedProject,
      phaseChecklists,
      currentPhase,
      overallComment,
      autoCheckResults,
      comparisonResults,
      pageAnalysis,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qa-report-${selectedProject?.name || 'project'}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    toast({ title: 'Report exported', status: 'success', duration: 2000 })
  }

  const handleSubmitReport = () => {
    toast({
      title: 'QA Report Submitted',
      description: 'Your QA report has been saved successfully.',
      status: 'success',
      duration: 3000,
    })
  }

  const runDeepAudit = async (url) => {
    try {
      const backendUrl = `http://localhost:5000/api/screenshots/content?url=${encodeURIComponent(url)}`
      const response = await fetch(backendUrl)
      if (!response.ok) return

      const html = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      // 1. Header & Footer
      const hasHeader = doc.querySelector('header') || doc.querySelector('[id*="header"]') || doc.querySelector('[class*="header"]')
      const hasFooter = doc.querySelector('footer') || doc.querySelector('[id*="footer"]') || doc.querySelector('[class*="footer"]')

      handleUpdateTotalChecklist('phase1', 'issue_header_footer', 'status', (hasHeader && hasFooter) ? 'pass' : 'fail')
      handleUpdateTotalChecklist('phase1', 'issue_header_footer', 'comment', `Auto-check: ${hasHeader ? 'Header found' : 'Header missing'}, ${hasFooter ? 'Footer found' : 'Footer missing'}.`)

      // 2. Images & Alt Tags
      const images = Array.from(doc.querySelectorAll('img'))
      const brokenImages = images.filter(img => !img.src || img.src.includes('placeholder'))
      const missingAlt = images.filter(img => !img.alt)

      if (images.length > 0) {
        const imgStatus = (brokenImages.length === 0 && missingAlt.length < images.length / 2) ? 'pass' : 'fail'
        handleUpdateTotalChecklist('phase1', 'issue_images', 'status', imgStatus)
        handleUpdateTotalChecklist('phase1', 'issue_images', 'comment', `Auto-check: Found ${images.length} images. ${brokenImages.length} placeholders, ${missingAlt.length} missing alt tags.`)
      }

      // 3. Privacy Policy
      const privacyLink = Array.from(doc.querySelectorAll('a')).find(a =>
        a.textContent.toLowerCase().includes('privacy') || (a.getAttribute('href') || '').toLowerCase().includes('privacy')
      )
      handleUpdateTotalChecklist('phase1', 'ui_privacy_policy', 'status', privacyLink ? 'pass' : 'fail')
      handleUpdateTotalChecklist('phase1', 'ui_privacy_policy', 'comment', privacyLink ? `Auto-check: Privacy link found (${privacyLink.getAttribute('href')}).` : 'Auto-check: Privacy link not found in home page.')

      // 4. Hamburger Menu (Mobile heuristic)
      const hasHamburger = doc.querySelector('[class*="hamburger"]') || doc.querySelector('[id*="hamburger"]') || doc.querySelector('[aria-label*="menu"]')
      handleUpdateTotalChecklist('phase1', 'ui_hamburger_menu', 'status', hasHamburger ? 'pass' : 'pending')
      handleUpdateTotalChecklist('phase1', 'ui_hamburger_menu', 'comment', hasHamburger ? 'Auto-check: Hamburger menu element detected.' : 'Auto-check: Could not detect hamburger menu programmatically.')

      // 5. Sticky Header
      const header = doc.querySelector('header')
      const isSticky = header && (header.classList.contains('sticky') || header.classList.contains('fixed'))
      handleUpdateTotalChecklist('phase1', 'ui_sticky_header', 'status', isSticky ? 'pass' : 'pending')
      handleUpdateTotalChecklist('phase1', 'ui_sticky_header', 'comment', isSticky ? 'Auto-check: Sticky/Fixed header detected.' : 'Auto-check: Visual sticky check required.')

      // 6. Read More
      const readMoreLinks = Array.from(doc.querySelectorAll('a')).filter(a => a.textContent.toLowerCase().includes('read more'))
      if (readMoreLinks.length > 0) {
        handleUpdateTotalChecklist('phase1', 'ui_read_more', 'status', 'pass')
        handleUpdateTotalChecklist('phase1', 'ui_read_more', 'comment', `Auto-check: Found ${readMoreLinks.length} "Read More" links.`)
      }

      // 7. Portfolio Check
      const hasPortfolio = doc.querySelector('[id*="portfolio"]') || doc.querySelector('[class*="portfolio"]') || Array.from(doc.querySelectorAll('a')).find(a => a.textContent.toLowerCase().includes('portfolio'))
      handleUpdateTotalChecklist('phase1', 'issue_portfolio', 'status', hasPortfolio ? 'pass' : 'pending')
      handleUpdateTotalChecklist('phase1', 'issue_portfolio', 'comment', hasPortfolio ? 'Auto-check: Portfolio section or link detected.' : 'Auto-check: Portfolio presence not confirmed.')

      // 8. Redirects & Placeholder Links
      const placeholderLinks = Array.from(doc.querySelectorAll('a')).filter(a => a.getAttribute('href') === '#' || a.getAttribute('href') === '')
      handleUpdateTotalChecklist('phase1', 'issue_redirects', 'status', placeholderLinks.length < 5 ? 'pass' : 'fail')
      handleUpdateTotalChecklist('phase1', 'issue_redirects', 'comment', `Auto-check: Found ${placeholderLinks.length} placeholder (#) links.`)

    } catch (error) {
      console.error('Deep Audit error:', error)
    }
  }

  const runAutoChecks = async () => {
    if (!selectedProject?.live_site_url) {
      toast({
        title: 'No Live Site URL',
        description: 'Please add a Live Site URL to the project to run automated checks.',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    setIsAutoChecking(true)
    const results = {
      https: { status: 'pending', message: 'Checking...' },
      response_time: { status: 'pending', message: 'Measuring...' },
      availability: { status: 'pending', message: 'Pinging...' },
    }

    try {
      const url = selectedProject.live_site_url

      // 1. HTTPS Check
      if (url.startsWith('https://')) {
        results.https = { status: 'pass', message: 'Secure (HTTPS)' }
        handleUpdateTotalChecklist('phase1', 'issue_malware', 'status', 'pass')
        handleUpdateTotalChecklist('phase1', 'issue_malware', 'comment', 'Auto-check: URL uses HTTPS.')
      } else {
        results.https = { status: 'fail', message: 'Insecure (HTTP)' }
        handleUpdateTotalChecklist('phase1', 'issue_malware', 'status', 'fail')
        handleUpdateTotalChecklist('phase1', 'issue_malware', 'comment', 'Auto-check: URL does not use HTTPS.')
      }

      // 2. Availability & Response Time (Simulated via fetch)
      const startTime = performance.now()
      try {
        await fetch(url, { mode: 'no-cors', method: 'HEAD' })
        const endTime = performance.now()
        const duration = Math.round(endTime - startTime)

        results.availability = { status: 'pass', message: 'Site is Reachable' }
        results.response_time = { status: 'pass', message: `${duration}ms` }

        // Update Phase 1: 404 Errors (Home Page Check)
        handleUpdateTotalChecklist('phase1', 'issue_404_errors', 'status', 'pass')
        handleUpdateTotalChecklist('phase1', 'issue_404_errors', 'comment', 'Auto-check: Home page is reachable.')

        // Auto-update performance checklist (Phase 3)
        if (duration < 1000) {
          handleUpdateTotalChecklist('phase3', 'monitoring_loading_speed', 'status', 'pass')
          handleUpdateTotalChecklist('phase3', 'monitoring_loading_speed', 'comment', `Auto-check: Fast response (${duration}ms).`)
        } else if (duration < 3000) {
          handleUpdateTotalChecklist('phase3', 'monitoring_loading_speed', 'status', 'pass')
          handleUpdateTotalChecklist('phase3', 'monitoring_loading_speed', 'comment', `Auto-check: Acceptable response (${duration}ms).`)
        } else {
          handleUpdateTotalChecklist('phase3', 'monitoring_loading_speed', 'status', 'fail')
          handleUpdateTotalChecklist('phase3', 'monitoring_loading_speed', 'comment', `Auto-check: Slow response (${duration}ms).`)
        }

        // 3. Quick Favicon Check
        try {
          const faviconUrl = new URL('/favicon.ico', url).href
          await fetch(faviconUrl, { mode: 'no-cors', method: 'HEAD' })
          handleUpdateTotalChecklist('phase1', 'ui_favicon', 'status', 'pass')
          handleUpdateTotalChecklist('phase1', 'ui_favicon', 'comment', 'Auto-check: favicon.ico found.')
        } catch (fErr) {
          // If favicon check fails, we don't necessarily mark as fail, but we don't mark as pass either
          console.log("Favicon check failed (ignore if not critical)")
        }

        // 4. Run Deep Heuristic Audit
        await runDeepAudit(url)

      } catch (err) {
        results.availability = { status: 'fail', message: 'Connection Failed (CORS or Offline)' }
        results.response_time = { status: 'fail', message: 'N/A' }
        handleUpdateTotalChecklist('phase1', 'issue_404_errors', 'status', 'fail')
        handleUpdateTotalChecklist('phase1', 'issue_404_errors', 'comment', 'Auto-check: Failed to reach home page.')
        handleUpdateTotalChecklist('phase3', 'monitoring_loading_speed', 'status', 'fail')
        handleUpdateTotalChecklist('phase3', 'monitoring_loading_speed', 'comment', 'Auto-check: Connection failed.')
      }

    } catch (error) {
      console.error('Auto-check error:', error)
      toast({
        title: 'Auto-check Failed',
        description: 'An unexpected error occurred during tests.',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setAutoCheckResults(results)
      setIsAutoChecking(false)
      toast({
        title: 'Automated Checks Completed',
        status: 'success',
        duration: 2000,
      })
    }
  }

  const [isBrowserTesting, setIsBrowserTesting] = useState(false)

  const runBrowserTests = async () => {
    if (!selectedProject?.live_site_url) {
      toast({
        title: 'No Live Site URL',
        description: 'Please select a project with a live site URL.',
        status: 'warning'
      })
      return
    }

    setIsBrowserTesting(true)
    const browserTests = [
      { key: 'browser_chrome_desktop', device: 'desktop' },
      { key: 'browser_chrome_ipad', device: 'ipad-pro' },
      { key: 'browser_chrome_iphone', device: 'iphone-14-pro-max' },
      { key: 'browser_safari_desktop', device: 'safari-desktop' },
      { key: 'browser_safari_tablet', device: 'safari-tablet' },
      { key: 'browser_safari_mobile', device: 'safari-mobile' },
      { key: 'screen_small_tablet', device: 'tablet', width: 1024, height: 768 },
      { key: 'screen_compact_laptop', width: 1280, height: 800 },
      { key: 'screen_standard_laptop', width: 1366, height: 768 },
    ]

    toast({
      title: 'Starting Browser Tests',
      description: 'Capturing 9 device screenshots. This may take a minute...',
      status: 'info',
      duration: 5000
    })

    try {
      const baseUrl = 'http://localhost:5000/api/screenshots/capture'
      const targetUrl = selectedProject.live_site_url

      for (const test of browserTests) {
        try {
          // Safety check: if phase1 or the item was deleted before starting this capture, skip
          setPhaseChecklists(prev => {
            if (!prev.phase1 || !prev.phase1[test.key]) return prev
            return {
              ...prev,
              phase1: {
                ...prev.phase1,
                [test.key]: {
                  ...prev.phase1[test.key],
                  comment: 'Auto-check: Capturing screenshot...'
                }
              }
            }
          })

          let queryParams = `?url=${encodeURIComponent(targetUrl)}&fullPage=true`
          if (test.device) queryParams += `&device=${test.device}`
          if (test.width) queryParams += `&width=${test.width}`
          if (test.height) queryParams += `&height=${test.height}`

          const response = await axios.get(`${baseUrl}${queryParams}`, {
            responseType: 'arraybuffer'
          })

          const blob = new Blob([response.data], { type: 'image/jpeg' })
          const imageUrl = URL.createObjectURL(blob)
          const filename = `${test.key}-${new Date().getTime()}.jpg`

          setPhaseChecklists(prev => {
            if (!prev.phase1 || !prev.phase1[test.key]) return prev
            return {
              ...prev,
              phase1: {
                ...prev.phase1,
                [test.key]: {
                  ...prev.phase1[test.key],
                  status: 'pass',
                  comment: `Auto-check: Screenshot captured successfully at ${new Date().toLocaleTimeString()}.`,
                  attachments: [...(prev.phase1[test.key].attachments || []), filename],
                  screenshotData: imageUrl
                }
              }
            }
          })

        } catch (err) {
          console.error(`Failed to capture for ${test.key}:`, err)
          handleUpdateTotalChecklist('phase1', test.key, 'status', 'fail')
          handleUpdateTotalChecklist('phase1', test.key, 'comment', `Auto-check failed: ${err.message}`)
        }
      }

      toast({
        title: 'Browser Tests Completed',
        description: 'All 9 devices have been tested.',
        status: 'success'
      })
    } catch (error) {
      console.error('Browser testing error:', error)
      toast({
        title: 'Testing Error',
        description: 'An unexpected error occurred during browser testing.',
        status: 'error'
      })
    } finally {
      setIsBrowserTesting(false)
    }
  }

  const [isScanning, setIsScanning] = useState(false)

  const handleScanForLinks = async (source = 'live') => {
    let targetUrl = ''

    if (source === 'live') {
      if (!selectedProject?.live_site_url) {
        toast({ title: 'No Live Site', description: 'Select a project with a live site URL first.', status: 'warning' })
        return
      }
      targetUrl = selectedProject.live_site_url
    } else {
      if (!betaUrlInput) {
        toast({ title: 'No Beta Site', description: 'Enter a Beta Site URL first.', status: 'warning' })
        return
      }
      targetUrl = betaUrlInput
    }

    setIsScanning(true)
    const baseUrl = targetUrl.replace(/\/$/, '')

    try {
      // Use allorigins proxy to bypass CORS and get raw HTML
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}&timestamp=${Date.now()}`
      const response = await fetch(proxyUrl)
      if (!response.ok) throw new Error('Failed to fetch site content')

      const html = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      const links = Array.from(doc.querySelectorAll('a'))
        .map(a => a.getAttribute('href'))
        .filter(href => href && (href.startsWith('/') || href.startsWith(baseUrl)))
        .map(href => {
          let path = href
          if (path.startsWith(baseUrl)) {
            path = path.substring(baseUrl.length)
          }
          if (!path.startsWith('/')) path = '/' + path
          // Remove anchors and query params for cleaner paths
          return path.split('#')[0].split('?')[0]
        })
        // Filter out common non-page assets
        .filter(path => !path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i))
        .filter(path => path !== '/' && path.trim() !== '')

      const uniqueLinks = [...new Set(links)].sort()

      if (uniqueLinks.length > 0) {
        setPagePaths(uniqueLinks.join('\n'))
        toast({
          title: 'Scan Complete',
          description: `Found ${uniqueLinks.length} unique internal pages from ${source} site.`,
          status: 'success'
        })
      } else {
        toast({
          title: 'No Links Found',
          description: 'Could not extract internal links. The site might use client-side routing heavily or block scanning.',
          status: 'info'
        })
      }

    } catch (error) {
      console.error('Scan error:', error)
      toast({
        title: 'Scan Failed',
        description: `Could not scan the ${source} site. Please enter paths manually.`,
        status: 'error'
      })
    } finally {
      setIsScanning(false)
    }
  }

  const handleCompareUrls = async () => {
    const paths = pagePaths.split('\n').filter(p => p.trim())
    const liveBase = selectedProject?.live_site_url?.replace(/\/$/, '') || ''
    const betaBase = betaUrlInput.replace(/\/$/, '')

    if (!liveBase || !betaBase) {
      toast({ title: 'Missing URLs', description: 'Both Live and Beta URLs are required', status: 'warning' })
      return
    }

    const results = paths.map(path => {
      const cleanPath = path.trim().startsWith('/') ? path.trim() : `/${path.trim()}`
      return {
        path: cleanPath,
        live: `${liveBase}${cleanPath}`,
        beta: `${betaBase}${cleanPath}`,
        liveStatus: 'pending',
        betaStatus: 'pending'
      }
    })

    setComparisonResults(results)

    // Auto-check availability (best effort with no-cors and timeout)
    const checkedResults = await Promise.all(results.map(async (item) => {
      const checkUrl = async (url) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

        try {
          const start = performance.now()
          await fetch(url, {
            mode: 'no-cors',
            method: 'HEAD',
            signal: controller.signal
          })
          const end = performance.now()
          clearTimeout(timeoutId)
          return { status: 'pass', time: Math.round(end - start) }
        } catch (err) {
          clearTimeout(timeoutId)
          return { status: 'fail', time: 0 }
        }
      }

      const [liveCheck, betaCheck] = await Promise.all([
        checkUrl(item.live),
        checkUrl(item.beta)
      ])

      return {
        ...item,
        liveStatus: liveCheck.status,
        liveTime: liveCheck.time,
        betaStatus: betaCheck.status,
        betaTime: betaCheck.time
      }
    }))

    setComparisonResults(checkedResults)
    toast({ title: 'Comparison Generated', description: 'Availability checks completed.', status: 'success' })
  }

  const calculateKeywordStats = (text) => {
    if (!text) return null
    // Simple tokenization
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3) // Filter short words

    const stopWords = new Set([
      'this', 'that', 'with', 'from', 'have', 'what', 'your', 'will', 'when', 'more', 'some', 'about',
      'there', 'they', 'their', 'which', 'would', 'like', 'been', 'just', 'very', 'should', 'make', 'made'
    ])

    const freq = {}
    words.forEach(w => {
      if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1
    })

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Top 10
      .map(([word, count]) => ({
        word,
        count,
        density: ((count / words.length) * 100).toFixed(1)
      }))
  }

  const handleAnalyzeContent = async () => {
    if (!contentToAnalyze.trim()) {
      toast({ title: 'No Content', description: 'Please enter text to analyze.', status: 'warning' })
      return
    }

    setIsAnalyzing(true)
    setAnalysisResults(null)
    setKeywordStats(null)

    // Calculate local stats immediately
    const stats = calculateKeywordStats(contentToAnalyze)
    setKeywordStats(stats)

    try {
      const response = await axios.post(
        'https://api.languagetool.org/v2/check',
        new URLSearchParams({
          text: contentToAnalyze,
          language: 'en-US'
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      )

      setAnalysisResults(response.data)
      toast({ title: 'Analysis Complete', description: `Found ${response.data.matches.length} issues.`, status: 'success' })
    } catch (error) {
      console.error('Analysis error:', error)
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Could not connect to grammar service.',
        status: 'error'
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApplyFix = (match, replacement) => {
    const offset = match.offset
    const length = match.length

    // 1. Apply the fix to the text
    const newText = contentToAnalyze.substring(0, offset) + replacement + contentToAnalyze.substring(offset + length)
    setContentToAnalyze(newText)

    // 2. Update the remaining matches (adjust offsets)
    const lengthDiff = replacement.length - length

    const newMatches = analysisResults.matches
      .filter(m => m !== match) // Remove the fixed match
      .map(m => {
        // If a match is AFTER the one we just fixed, shift its offset
        if (m.offset > offset) {
          return {
            ...m,
            offset: m.offset + lengthDiff,
            context: {
              ...m.context,
              offset: m.context.offset + lengthDiff // approximate
            }
          }
        }
        return m
      })

    setAnalysisResults({
      ...analysisResults,
      matches: newMatches
    })

    toast({ title: 'Fix Applied', status: 'success', duration: 1000 })
  }

  const handleFixAll = () => {
    if (!analysisResults || !analysisResults.matches) return

    // Create a copy of the content
    let newText = contentToAnalyze
    let matches = [...analysisResults.matches]

    // Sort matches by offset descending so we don't mess up indices
    matches.sort((a, b) => b.offset - a.offset)

    matches.forEach(match => {
      if (match.replacements && match.replacements.length > 0) {
        const replacement = match.replacements[0].value
        newText = newText.substring(0, match.offset) + replacement + newText.substring(match.offset + match.length)
      }
    })

    setContentToAnalyze(newText)
    setAnalysisResults({ ...analysisResults, matches: [] }) // Clear all errors
    toast({ title: 'All Fixes Applied', status: 'success' })
  }

  const handleCopyText = () => {
    navigator.clipboard.writeText(contentToAnalyze)
    toast({ title: 'Copied to Clipboard', status: 'success' })
  }

  const handleScrapeContent = async () => {
    let urlToFetch = contentUrl.trim()
    if (!urlToFetch) {
      toast({ title: 'Missing URL', description: 'Please enter a URL to fetch content from.', status: 'warning' })
      return
    }

    // Ensure protocol
    if (!urlToFetch.match(/^https?:\/\//i)) {
      urlToFetch = 'https://' + urlToFetch
    }

    // Helper to try fetching
    const tryFetch = async (proxyUrl) => {
      const response = await fetch(proxyUrl)
      if (!response.ok) throw new Error(`Status ${response.status}`)
      return response
    }

    try {
      toast({ title: 'Fetching Content', description: 'Attempting to fetch content...', status: 'info' })

      let html = ''
      const isLocalhost = urlToFetch.includes('localhost') || urlToFetch.includes('127.0.0.1')

      if (isLocalhost) {
        // Direct fetch for localhost (bypass proxy)
        try {
          const response = await fetch(urlToFetch)
          if (!response.ok) throw new Error('Localhost fetch failed')
          html = await response.text()
        } catch (localErr) {
          throw new Error('Could not connect to localhost. Ensure the server is running.')
        }
      } else {
        // Strategy: Try multiple proxies in sequence
        const proxies = [
          // 1. CORSProxy.io (Raw) - Faster and less prone to QUIC errors
          async (url) => {
            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)
            if (!res.ok) throw new Error('Status ' + res.status)
            return await res.text()
          },
          // 2. AllOrigins (JSON) - Good fallback
          async (url) => {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}&timestamp=${Date.now()}`)
            if (!res.ok) throw new Error('Status ' + res.status)
            const data = await res.json()
            if (!data.contents) throw new Error('No content')
            return data.contents
          },
          // 3. CodeTabs (Raw)
          async (url) => {
            const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`)
            if (!res.ok) throw new Error('Status ' + res.status)
            return await res.text()
          }
        ]

        let lastError = null
        for (const proxyFn of proxies) {
          try {
            html = await proxyFn(urlToFetch)
            if (html && html.length > 100) break // Success (check for meaningful content)
          } catch (e) {
            console.warn('Proxy failed, trying next...', e)
            lastError = e
          }
        }

        if (!html) {
          throw lastError || new Error('All proxies failed to fetch content')
        }
      }

      // Full HTML Parsing for SEO/Structure Analysis
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      // 1. SEO & Accessibility Analysis (Run BEFORE cleaning to preserve Head/Meta)
      // Helper to count words for density
      const getWordCount = (str) => {
        return str.trim().split(/\s+/).length
      }

      // Helper for Readability (Flesch-Kincaid)
      const calculateReadability = (text) => {
        const sentences = text.split(/[.!?]+/).length
        const words = getWordCount(text)
        const syllables = text.split(/[aeiouy]+/).length // Crude approximation
        // Flesch-Kincaid Grade Level = 0.39 (total words / total sentences) + 11.8 (total syllables / total words) - 15.59
        if (sentences === 0 || words === 0) return 0
        const score = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
        return Math.max(0, score).toFixed(1)
      }

      const rawBodyText = doc.body.innerText || ""
      const wordCount = getWordCount(rawBodyText)
      const readabilityScore = calculateReadability(rawBodyText)

      const analysis = {
        title: doc.title,
        titleLength: doc.title ? doc.title.length : 0,
        metaDescription: doc.querySelector('meta[name="description"]')?.content || 'Missing',
        h1Count: doc.querySelectorAll('h1').length,
        h1Content: Array.from(doc.querySelectorAll('h1')).map(h => h.innerText).join(' | '),
        imagesTotal: doc.querySelectorAll('img').length,
        imagesMissingAlt: Array.from(doc.querySelectorAll('img')).filter(img => !img.alt).length,
        linksTotal: doc.querySelectorAll('a').length,
        internalLinks: Array.from(doc.querySelectorAll('a')).filter(a => a.href && (a.href.startsWith('/') || a.href.includes(urlToFetch))).length,
        wordCount: wordCount,
        readabilityScore: readabilityScore
      }
      setPageAnalysis(analysis)

      // 2. Text Content for Grammar using Mozilla Readability
      try {
        // We clone the document because Readability might mutate it
        const reader = new Readability(doc.cloneNode(true))
        const article = reader.parse()

        let textContent = ""
        if (article && article.textContent) {
          textContent = article.textContent
          textContent = textContent.replace(/\n\s*\n/g, '\n\n').trim()
        }

        // Fallback Logic:
        // If Readability returned nothing OR very little text (< 200 chars),
        // try to extract raw text from the body to see if we missed something.
        if (!textContent || textContent.length < 200) {
          let rawText = doc.body.textContent || doc.body.innerText || ""
          // Clean up raw text
          rawText = rawText.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim()

          // If raw text is significantly longer, use it instead
          if (rawText.length > (textContent ? textContent.length + 100 : 0)) {
            console.log("Readability result too short, using raw text fallback.")
            textContent = rawText
          }
        }

        if (!textContent || textContent.length < 50) {
          toast({
            title: 'Low Content Detected',
            description: 'The site returned very little text. It might be a Single Page App (SPA) rendered by JavaScript.',
            status: 'warning',
            duration: 5000
          })
        }

        setContentToAnalyze(textContent)
        toast({ title: 'Content Fetched', description: 'Loaded text and analyzed page structure.', status: 'success' })

      } catch (readabilityError) {
        console.error("Readability error:", readabilityError)
        // Fallback to manual extraction
        let fallbackText = doc.body.textContent || ""
        fallbackText = fallbackText.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim()
        setContentToAnalyze(fallbackText)
      }

    } catch (error) {
      console.error('Scrape error:', error)
      toast({
        title: 'Fetch Failed',
        description: `Could not fetch content from ${urlToFetch}. The site might block proxies. Try copying text manually.`,
        status: 'error',
        duration: 6000,
        isClosable: true
      })
    }
  }

  return (
    <Box p={8}>
      <PageHeader
        title="Quality Assurance Execution"
        description="Perform and record quality testing for projects."
        buttonIcon={ClipboardDocumentCheckIcon}
      />

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Left Column: Project Selection & Info */}
        <Box gridColumn={{ lg: 'span 1' }}>
          <VStack spacing={6} align="stretch">
            <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
              <CardHeader>
                <Heading size="md">Select Project</Heading>
              </CardHeader>
              <CardBody>
                <FormControl>
                  <FormLabel>Project to Test</FormLabel>
                  <Select
                    placeholder="Choose a project..."
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </CardBody>
            </Card>

            {selectedProject && (
              <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                <CardHeader>
                  <Heading size="md">Project Resources</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Text fontWeight="bold" mb={1}>Live Site</Text>
                      {selectedProject.live_site_url ? (
                        <Link href={selectedProject.live_site_url} isExternal color="vrv.500">
                          {selectedProject.live_site_url} <ExternalLinkIcon mx="2px" />
                        </Link>
                      ) : (
                        <Text color="gray.500" fontSize="sm">Not available</Text>
                      )}
                    </Box>
                    <Divider />
                    <Box>
                      <Text fontWeight="bold" mb={1}>Beta Site</Text>
                      {selectedProject.beta_site_url ? (
                        <Link href={selectedProject.beta_site_url} isExternal color="vrv.500">
                          {selectedProject.beta_site_url} <ExternalLinkIcon mx="2px" />
                        </Link>
                      ) : (
                        <Text color="gray.500" fontSize="sm">Not available</Text>
                      )}
                    </Box>
                    <Divider />
                    <Box>
                      <Text fontWeight="bold" mb={1}>Requirements/Docs</Text>
                      {selectedProject.website_content_docs_url ? (
                        <Link href={selectedProject.website_content_docs_url} isExternal color="vrv.500">
                          View Documentation <ExternalLinkIcon mx="2px" />
                        </Link>
                      ) : (
                        <Text color="gray.500" fontSize="sm">Not available</Text>
                      )}
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Automated Checks Panel */}
            {selectedProject && (
              <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                <CardHeader display="flex" justifyContent="space-between" alignItems="center">
                  <Heading size="md">Automated Checks</Heading>
                  <Button
                    size="sm"
                    leftIcon={<Icon as={BoltIcon} />}
                    colorScheme="purple"
                    onClick={runAutoChecks}
                    isLoading={isAutoChecking}
                    loadingText="Running..."
                  >
                    Run Auto-Checks
                  </Button>
                </CardHeader>
                <CardBody>
                  {autoCheckResults ? (
                    <SimpleGrid columns={3} spacing={4}>
                      <Box p={3} bg={autoCheckResults.https.status === 'pass' ? 'green.50' : 'red.50'} borderRadius="md" textAlign="center" border="1px" borderColor={autoCheckResults.https.status === 'pass' ? 'green.200' : 'red.200'}>
                        <Icon as={BoltIcon} boxSize={6} color={autoCheckResults.https.status === 'pass' ? 'green.500' : 'red.500'} mb={2} />
                        <Text fontWeight="bold" fontSize="sm" mb={1}>Security</Text>
                        <Badge colorScheme={autoCheckResults.https.status === 'pass' ? 'green' : 'red'}>
                          {autoCheckResults.https.message}
                        </Badge>
                      </Box>

                      <Box p={3} bg={autoCheckResults.availability.status === 'pass' ? 'green.50' : 'red.50'} borderRadius="md" textAlign="center" border="1px" borderColor={autoCheckResults.availability.status === 'pass' ? 'green.200' : 'red.200'}>
                        <Icon as={CheckCircleIcon} boxSize={6} color={autoCheckResults.availability.status === 'pass' ? 'green.500' : 'red.500'} mb={2} />
                        <Text fontWeight="bold" fontSize="sm" mb={1}>Uptime</Text>
                        <Badge colorScheme={autoCheckResults.availability.status === 'pass' ? 'green' : 'red'}>
                          {autoCheckResults.availability.message}
                        </Badge>
                      </Box>

                      <Box p={3} bg={
                        autoCheckResults.response_time.status === 'pass' ? 'green.50' :
                          autoCheckResults.response_time.status === 'fail' ? 'red.50' : 'gray.50'
                      } borderRadius="md" textAlign="center" border="1px" borderColor={
                        autoCheckResults.response_time.status === 'pass' ? 'green.200' :
                          autoCheckResults.response_time.status === 'fail' ? 'red.200' : 'gray.200'
                      }>
                        <Icon as={BoltIcon} boxSize={6} color={
                          autoCheckResults.response_time.status === 'pass' ? 'green.500' :
                            autoCheckResults.response_time.status === 'fail' ? 'red.500' : 'gray.500'
                        } mb={2} />
                        <Text fontWeight="bold" fontSize="sm" mb={1}>Speed</Text>
                        <Badge colorScheme={
                          autoCheckResults.response_time.status === 'pass' ? 'green' :
                            autoCheckResults.response_time.status === 'fail' ? 'red' : 'gray'
                        }>
                          {autoCheckResults.response_time.message}
                        </Badge>
                      </Box>
                    </SimpleGrid>
                  ) : (
                    <Text color="gray.500" fontSize="sm" textAlign="center">
                      Click "Run Auto-Checks" to validate live site health, security, and performance.
                    </Text>
                  )}
                </CardBody>
              </Card>
            )}
          </VStack>
        </Box>

        {/* Right Column: Testing Checklist & Comparison */}
        <Box gridColumn={{ lg: 'span 2' }}>
          {selectedProject ? (
            <Tabs variant="soft-rounded" colorScheme="vrv" isLazy>
              <TabList mb={4} p={1} bg="gray.50" borderRadius="full">
                <Tab _selected={{ color: 'white', bg: 'vrv.500', boxShadow: 'md' }} borderRadius="full" px={6}>
                  <Icon as={ClipboardDocumentCheckIcon} mr={2} /> Checklist
                </Tab>
                <Tab _selected={{ color: 'white', bg: 'vrv.500', boxShadow: 'md' }} borderRadius="full" px={6}>
                  <Icon as={LinkIcon} mr={2} /> Comparator
                </Tab>
                <Tab _selected={{ color: 'white', bg: 'vrv.500', boxShadow: 'md' }} borderRadius="full" px={6}>
                  <Icon as={DocumentMagnifyingGlassIcon} mr={2} /> Content
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0} animation="fade-in 0.3s">
                  <VStack spacing={6} align="stretch">
                    {/* Stepper Component */}
                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" borderRadius="xl" shadow="sm">
                      <CardBody>
                        <Stepper index={currentPhase} colorScheme="vrv" size="lg">
                          {phases.map((phase, index) => {
                            const phaseKey = `phase${index + 1}`
                            const progress = getPhaseProgress(phaseKey)
                            return (
                              <Step key={index}>
                                <StepIndicator>
                                  <StepStatus
                                    complete={<StepIcon />}
                                    incomplete={<StepNumber />}
                                    active={<StepNumber />}
                                  />
                                </StepIndicator>

                                <Box flexShrink='0'>
                                  <StepTitle>{phase.title}</StepTitle>
                                  <StepDescription>{phase.description}</StepDescription>
                                  <Text fontSize="xs" color="gray.500" mt={1}>
                                    {progress.completed}/{progress.total} items
                                  </Text>
                                </Box>

                                <StepSeparator />
                              </Step>
                            )
                          })}
                        </Stepper>
                      </CardBody>
                    </Card>

                    {/* Phase Instructions */}
                    <Alert
                      status={currentPhase === 0 ? "info" : currentPhase === 1 ? "warning" : "success"}
                      variant="left-accent"
                      borderRadius="md"
                    >
                      <AlertIcon />
                      <Box flex="1">
                        <AlertTitle>{phases[currentPhase].title}</AlertTitle>
                        <AlertDescription fontSize="sm">
                          {currentPhase === 0 && "Perform initial checks: Verify layout across different browsers and devices, check for common UI issues and placeholder content."}
                          {currentPhase === 1 && "Deep dive into functionality: Test form submissions, chatbot integrations, SEO metadata, and dynamic content like blogs and maps."}
                          {currentPhase === 2 && "Final validation: Match Live site with Beta, perform ADA compliance checks, and verify search results snippets."}
                        </AlertDescription>
                      </Box>
                    </Alert>

                    {/* Checklist Card */}
                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" borderRadius="xl" shadow="sm">
                      <CardHeader display="flex" justifyContent="space-between" alignItems="center" pb={2}>
                        <HStack spacing={4}>
                          <HStack>
                            <Icon as={BeakerIcon} boxSize={6} color="vrv.500" />
                            <Heading size="md">{phases[currentPhase].title} Checklist</Heading>
                          </HStack>
                          {currentPhase === 0 && (
                            <Button
                              size="sm"
                              leftIcon={<Icon as={BoltIcon} />}
                              colorScheme="purple"
                              variant="solid"
                              onClick={runBrowserTests}
                              isLoading={isBrowserTesting}
                              loadingText="Capturing..."
                              boxShadow="sm"
                            >
                              Capture Device Screenshots
                            </Button>
                          )}
                        </HStack>
                        <Badge colorScheme={getPhaseProgress(getCurrentPhaseKey()).percentage === 100 ? 'green' : 'orange'} fontSize="0.9em" p={1} borderRadius="md">
                          {Math.round(getPhaseProgress(getCurrentPhaseKey()).percentage)}% Complete
                        </Badge>
                      </CardHeader>
                      <CardBody>
                        <HStack justify="space-between" mb={4}>
                          <Progress
                            value={getPhaseProgress(getCurrentPhaseKey()).percentage}
                            flex="1"
                            mr={4}
                            colorScheme="vrv"
                            borderRadius="full"
                            size="sm"
                            hasStripe
                            isAnimated={getPhaseProgress(getCurrentPhaseKey()).percentage > 0 && getPhaseProgress(getCurrentPhaseKey()).percentage < 100}
                          />
                          <Text fontSize="sm" fontWeight="bold" color="gray.600">
                            {getPhaseProgress(getCurrentPhaseKey()).completed} / {getPhaseProgress(getCurrentPhaseKey()).total}
                          </Text>
                        </HStack>

                        <Box overflowX="auto" overflowY="auto" css={{
                          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                          '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
                          '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '4px' },
                          '&::-webkit-scrollbar-thumb:hover': { background: '#555' },
                        }}>
                          <Table variant="simple" size="sm" position="relative">
                            <Thead position="sticky" top={0} bg={bgColor} zIndex={1} boxShadow="sm">
                              <Tr>
                                <Th>Test Category</Th>
                                <Th width="140px">Status</Th>
                                <Th>Comments/Evidence</Th>
                                <Th width="50px"></Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {Object.entries(phaseChecklists[getCurrentPhaseKey()] || {}).map(([key, item]) => (
                                <Tr key={key} _hover={{ bg: 'gray.50' }} transition="background 0.2s">
                                  <Td fontWeight="medium" fontSize="sm">{item.label}</Td>
                                  <Td>
                                    <Select
                                      size="sm"
                                      value={item.status}
                                      onChange={(e) => handlePhaseChecklistChange(key, 'status', e.target.value)}
                                      bg={
                                        item.status === 'pass' ? 'green.100' :
                                          item.status === 'fail' ? 'red.100' :
                                            'white'
                                      }
                                      color={
                                        item.status === 'pass' ? 'green.800' :
                                          item.status === 'fail' ? 'red.800' :
                                            'gray.600'
                                      }
                                      borderColor={
                                        item.status === 'pass' ? 'green.300' :
                                          item.status === 'fail' ? 'red.300' :
                                            'inherit'
                                      }
                                      fontWeight="bold"
                                      borderRadius="full"
                                      sx={{
                                        '> option': { bg: 'white', color: 'black' }
                                      }}
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="pass">Pass</option>
                                      <option value="fail">Fail</option>
                                      <option value="na">N/A</option>
                                    </Select>
                                  </Td>
                                  <Td>
                                    <VStack align="start" spacing={1}>
                                      <Textarea
                                        size="xs"
                                        rows={1}
                                        placeholder="Add notes..."
                                        value={item.comment}
                                        onChange={(e) => handlePhaseChecklistChange(key, 'comment', e.target.value)}
                                      />
                                      <HStack>
                                        <Button size="xs" leftIcon={<AttachmentIcon />} variant="ghost" onClick={() => handleAddAttachment(key)}>
                                          Attach
                                        </Button>
                                        {item.screenshotData && (
                                          <IconButton
                                            size="xs"
                                            icon={<ViewIcon />}
                                            colorScheme="blue"
                                            variant="ghost"
                                            onClick={() => {
                                              // Simple preview logic or pass to a common modal
                                              window.open().document.write(`<img src="${item.screenshotData}" style="width:100%"/>`)
                                            }}
                                            aria-label="View Screenshot"
                                          />
                                        )}
                                        {item.attachments?.map((file, idx) => (
                                          <Badge key={idx} variant="outline" colorScheme="blue" fontSize="xs">
                                            {file}
                                          </Badge>
                                        ))}
                                      </HStack>
                                    </VStack>
                                  </Td>
                                  <Td>
                                    <IconButton
                                      icon={<DeleteIcon />}
                                      size="xs"
                                      colorScheme="red"
                                      variant="ghost"
                                      aria-label="Delete item"
                                      onClick={() => handleDeleteItem(key)}
                                    />
                                  </Td>
                                </Tr>
                              ))}
                              {/* Add New Item Row */}
                              <Tr>
                                <Td>
                                  <Input
                                    size="sm"
                                    placeholder="Add custom test item..."
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomItem()}
                                  />
                                </Td>
                                <Td colSpan={3}>
                                  <Button size="sm" leftIcon={<AddIcon />} onClick={handleAddCustomItem} isDisabled={!newItemName.trim()}>
                                    Add Item
                                  </Button>
                                </Td>
                              </Tr>
                            </Tbody>
                          </Table>
                        </Box>

                        <Box mt={6}>
                          <FormLabel>Overall Feedback / Summary</FormLabel>
                          <Textarea
                            value={overallComment}
                            onChange={(e) => setOverallComment(e.target.value)}
                            placeholder="Summary of testing results..."
                            rows={4}
                          />
                        </Box>

                        <HStack mt={6} justify="space-between">
                          <HStack>
                            <Button
                              variant="outline"
                              onClick={handlePreviousPhase}
                              isDisabled={currentPhase === 0}
                              leftIcon={<RepeatIcon style={{ transform: 'rotate(180deg)' }} />}
                            >
                              Previous Phase
                            </Button>
                            <Button variant="ghost" onClick={resetChecklist}>Reset</Button>
                          </HStack>

                          <HStack>
                            <Button
                              variant="outline"
                              leftIcon={<DownloadIcon />}
                              onClick={handleExportReport}
                            >
                              Export JSON
                            </Button>
                            {currentPhase < phases.length - 1 ? (
                              <Button
                                colorScheme="vrv"
                                onClick={handleNextPhase}
                                isDisabled={!canAdvancePhase()}
                                rightIcon={<RepeatIcon />}
                              >
                                Next Phase
                              </Button>
                            ) : (
                              <Button
                                colorScheme="vrv"
                                leftIcon={<CheckCircleIcon />}
                                onClick={handleSubmitReport}
                                isDisabled={getPhaseProgress(getCurrentPhaseKey()).percentage === 0}
                              >
                                Submit Report
                              </Button>
                            )}
                          </HStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </TabPanel>
                <TabPanel p={0}>
                  <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                    <CardHeader>
                      <Heading size="md">URL Structure Comparison</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <Box>
                          <FormLabel>Live Site (Reference)</FormLabel>
                          <Text fontSize="md" fontWeight="bold" color="green.600" mb={2}>
                            {selectedProject?.live_site_url || 'No Live URL Set'}
                          </Text>
                        </Box>

                        <Box>
                          <FormLabel>Beta Site (Testing)</FormLabel>
                          <Input
                            placeholder="https://beta.example.com"
                            value={betaUrlInput}
                            onChange={(e) => setBetaUrlInput(e.target.value)}
                          />
                        </Box>

                        <Box>
                          <HStack justify="space-between" mb={2}>
                            <FormLabel mb={0}>Page Paths (one per line)</FormLabel>
                            <HStack>
                              <Button
                                size="xs"
                                colorScheme="blue"
                                variant="outline"
                                isLoading={isScanning}
                                loadingText="Scanning..."
                                onClick={() => handleScanForLinks('live')}
                                leftIcon={<ViewIcon />}
                              >
                                Scan Live Site
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="purple"
                                variant="outline"
                                isLoading={isScanning}
                                loadingText="Scanning..."
                                onClick={() => handleScanForLinks('beta')}
                                leftIcon={<ViewIcon />}
                              >
                                Scan Beta Site
                              </Button>
                            </HStack>
                          </HStack>
                          <Textarea
                            value={pagePaths}
                            onChange={(e) => setPagePaths(e.target.value)}
                            rows={6}
                            fontFamily="monospace"
                            placeholder="/home&#10;/about&#10;/contact"
                          />
                          <Text fontSize="xs" color="gray.500">
                            Enter paths relative to the domain. Click 'Scan' buttons to auto-populate.
                          </Text>
                        </Box>

                        <HStack>
                          <Button
                            colorScheme="vrv"
                            leftIcon={<BoltIcon />}
                            onClick={handleCompareUrls}
                          >
                            Generate Comparison
                          </Button>
                          <Button
                            variant="ghost"
                            leftIcon={<DeleteIcon />}
                            onClick={() => setComparisonResults(null)}
                            isDisabled={!comparisonResults}
                          >
                            Clear Results
                          </Button>
                        </HStack>

                        {comparisonResults && (
                          <Box overflowX="auto">
                            <Table size="sm" variant="simple">
                              <Thead>
                                <Tr>
                                  <Th>Path</Th>
                                  <Th>Live (Status)</Th>
                                  <Th>Beta (Status)</Th>
                                  <Th>Actions</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {comparisonResults.map((result, idx) => (
                                  <Tr key={idx}>
                                    <Td fontFamily="monospace" fontSize="xs">{result.path}</Td>
                                    <Td>
                                      <HStack>
                                        <Badge colorScheme={result.liveStatus === 'pass' ? 'green' : result.liveStatus === 'fail' ? 'red' : 'gray'}>
                                          {result.liveStatus === 'pass' ? 'Active' : 'Checking...'}
                                        </Badge>
                                        {result.liveTime > 0 && <Text fontSize="xs" color="gray.500">{result.liveTime}ms</Text>}
                                      </HStack>
                                    </Td>
                                    <Td>
                                      <HStack>
                                        <Badge colorScheme={result.betaStatus === 'pass' ? 'green' : result.betaStatus === 'fail' ? 'red' : 'gray'}>
                                          {result.betaStatus === 'pass' ? 'Active' : 'Checking...'}
                                        </Badge>
                                        {result.betaTime > 0 && <Text fontSize="xs" color="gray.500">{result.betaTime}ms</Text>}
                                      </HStack>
                                    </Td>
                                    <Td>
                                      <HStack>
                                        <Button size="xs" leftIcon={<ExternalLinkIcon />} onClick={() => window.open(result.live, '_blank')}>
                                          Live
                                        </Button>
                                        <Button size="xs" leftIcon={<ExternalLinkIcon />} onClick={() => window.open(result.beta, '_blank')}>
                                          Beta
                                        </Button>
                                        <Button
                                          size="xs"
                                          colorScheme="purple"
                                          leftIcon={<ViewIcon />}
                                          onClick={() => {
                                            window.open(result.live, '_blank')
                                            window.open(result.beta, '_blank')
                                          }}
                                        >
                                          Both
                                        </Button>
                                      </HStack>
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>
                <TabPanel p={0}>
                  <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
                    <CardHeader>
                      <Heading size="md">Content & Page Structure Analysis</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <Box>
                          <FormLabel>Source URL</FormLabel>
                          <InputGroup>
                            <Input
                              value={contentUrl}
                              onChange={(e) => setContentUrl(e.target.value)}
                              placeholder="https://example.com"
                            />
                            <InputLeftAddon p={0} overflow="hidden">
                              <Button onClick={handleScrapeContent} borderLeftRadius={0} width="full" colorScheme="gray">
                                Auto-Fetch
                              </Button>
                            </InputLeftAddon>
                          </InputGroup>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Note: Auto-fetch uses a proxy to bypass CORS.
                          </Text>
                        </Box>

                        {pageAnalysis && (
                          <Box p={5} bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200" shadow="sm">
                            <Heading size="sm" mb={4} color="blue.600" display="flex" alignItems="center">
                              <BoltIcon style={{ width: '20px', marginRight: '8px' }} />
                              SEO & Content Analysis
                            </Heading>

                            <StatGroup mb={6}>
                              <Stat>
                                <StatLabel color="gray.500">Word Count</StatLabel>
                                <StatNumber fontSize="2xl">{pageAnalysis.wordCount}</StatNumber>
                                <StatHelpText>Approximate</StatHelpText>
                              </Stat>
                              <Stat>
                                <StatLabel color="gray.500">Readability Score</StatLabel>
                                <StatNumber fontSize="2xl" color={pageAnalysis.readabilityScore < 8 ? "green.500" : "orange.500"}>
                                  {pageAnalysis.readabilityScore}
                                </StatNumber>
                                <StatHelpText>Grade Level (Lower is better)</StatHelpText>
                              </Stat>
                              <Stat>
                                <StatLabel color="gray.500">Title Length</StatLabel>
                                <StatNumber fontSize="2xl" color={pageAnalysis.titleLength >= 30 && pageAnalysis.titleLength <= 60 ? "green.500" : "red.500"}>
                                  {pageAnalysis.titleLength}
                                </StatNumber>
                                <StatHelpText>Optimal: 30-60 chars</StatHelpText>
                              </Stat>
                            </StatGroup>

                            <Divider mb={4} />

                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                              <Box>
                                <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="gray.500" mb={1}>Meta Information</Text>
                                <Box mb={3}>
                                  <Badge mb={1}>Title</Badge>
                                  <Text fontSize="sm" noOfLines={2} title={pageAnalysis.title} bg="gray.50" p={2} borderRadius="md">
                                    {pageAnalysis.title || 'Missing'}
                                  </Text>
                                </Box>
                                <Box>
                                  <Badge mb={1}>Description</Badge>
                                  <Text fontSize="sm" noOfLines={3} title={pageAnalysis.metaDescription} bg="gray.50" p={2} borderRadius="md">
                                    {pageAnalysis.metaDescription}
                                  </Text>
                                </Box>
                              </Box>

                              <Box>
                                <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="gray.500" mb={1}>Structure & Links</Text>
                                <VStack align="stretch" spacing={2}>
                                  <HStack justify="space-between">
                                    <Text fontSize="sm">H1 Tags</Text>
                                    <Badge colorScheme={pageAnalysis.h1Count === 1 ? 'green' : 'red'}>{pageAnalysis.h1Count}</Badge>
                                  </HStack>
                                  {pageAnalysis.h1Count > 0 && (
                                    <Text fontSize="xs" color="gray.600" bg="gray.50" p={1} borderRadius="sm" isTruncated>
                                      {pageAnalysis.h1Content}
                                    </Text>
                                  )}
                                  <HStack justify="space-between">
                                    <Text fontSize="sm">Images Missing Alt</Text>
                                    <Badge colorScheme={pageAnalysis.imagesMissingAlt === 0 ? 'green' : 'red'}>
                                      {pageAnalysis.imagesMissingAlt} / {pageAnalysis.imagesTotal}
                                    </Badge>
                                  </HStack>
                                  <HStack justify="space-between">
                                    <Text fontSize="sm">Internal Links</Text>
                                    <Badge colorScheme="blue">{pageAnalysis.internalLinks}</Badge>
                                  </HStack>
                                  <HStack justify="space-between">
                                    <Text fontSize="sm">Total Links</Text>
                                    <Badge colorScheme="purple">{pageAnalysis.linksTotal}</Badge>
                                  </HStack>
                                </VStack>
                              </Box>
                            </SimpleGrid>
                          </Box>
                        )}

                        {keywordStats && (
                          <Box p={5} bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200" shadow="sm">
                            <Heading size="sm" mb={4} color="purple.600" display="flex" alignItems="center">
                              <Icon as={DocumentMagnifyingGlassIcon} style={{ width: '20px', marginRight: '8px' }} />
                              Keyword Density Analysis
                            </Heading>
                            <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
                              {keywordStats.map((stat, idx) => (
                                <Box key={idx} p={3} bg="purple.50" borderRadius="md" textAlign="center">
                                  <Text fontWeight="bold" fontSize="md" textTransform="capitalize">{stat.word}</Text>
                                  <Text fontSize="xs" color="gray.500">{stat.count} uses</Text>
                                  <Badge colorScheme="purple" mt={1}>{stat.density}%</Badge>
                                </Box>
                              ))}
                            </SimpleGrid>
                          </Box>
                        )}

                        <Box>
                          <FormLabel>Content to Analyze (Grammar)</FormLabel>
                          <Textarea
                            value={contentToAnalyze}
                            onChange={(e) => setContentToAnalyze(e.target.value)}
                            rows={6}
                            placeholder="Paste text here to check for grammar and spelling errors..."
                          />
                        </Box>

                        <Button
                          colorScheme="vrv"
                          leftIcon={<DocumentMagnifyingGlassIcon style={{ width: '20px' }} />}
                          onClick={handleAnalyzeContent}
                          isLoading={isAnalyzing}
                          loadingText="Analyzing..."
                        >
                          Check Grammar & Spelling
                        </Button>

                        {analysisResults && (
                          <Box>
                            <HStack justify="space-between" mb={4}>
                              <Heading size="sm">Analysis Results ({analysisResults.matches.length} issues found)</Heading>
                              <HStack>
                                <Button size="sm" leftIcon={<CopyIcon />} onClick={handleCopyText} variant="outline">
                                  Copy Text
                                </Button>
                                {analysisResults.matches.length > 0 && (
                                  <Button size="sm" colorScheme="green" onClick={handleFixAll}>
                                    Fix All
                                  </Button>
                                )}
                              </HStack>
                            </HStack>
                            {analysisResults.matches.length === 0 ? (
                              <Card variant="outline" p={4} bg="green.50" borderColor="green.200">
                                <HStack>
                                  <CheckCircleIcon color="green.500" />
                                  <Text color="green.700">No errors found! Great job.</Text>
                                </HStack>
                              </Card>
                            ) : (
                              <VStack align="stretch" spacing={3} maxH="400px" overflowY="auto">
                                {analysisResults.matches.map((match, idx) => (
                                  <Card key={idx} variant="outline" p={3} borderLeftWidth="4px" borderLeftColor="orange.400">
                                    <HStack align="start" justify="space-between">
                                      <Box>
                                        <Text fontWeight="bold" fontSize="sm" color="orange.600">
                                          {match.message}
                                        </Text>
                                        <Text fontSize="sm" mt={1} fontStyle="italic" bg="gray.50" p={1} borderRadius="md">
                                          "...{match.context.text.slice(match.context.offset, match.context.offset + match.context.length)}..."
                                        </Text>
                                        {match.replacements && match.replacements.length > 0 && (
                                          <HStack mt={2} spacing={2}>
                                            <Text fontSize="xs" fontWeight="bold">Suggestions:</Text>
                                            {match.replacements.slice(0, 3).map((rep, i) => (
                                              <Badge
                                                key={i}
                                                colorScheme="green"
                                                variant="solid"
                                                cursor="pointer"
                                                onClick={() => handleApplyFix(match, rep.value)}
                                                _hover={{ bg: 'green.600', transform: 'scale(1.05)' }}
                                                transition="all 0.2s"
                                              >
                                                {rep.value}
                                              </Badge>
                                            ))}
                                          </HStack>
                                        )}
                                      </Box>
                                      <Badge colorScheme="gray">{match.rule.issueType}</Badge>
                                    </HStack>
                                  </Card>
                                ))}
                              </VStack>
                            )}
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>
          ) : (
            <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" borderRadius="xl" h="100%" display="flex" alignItems="center" justifyContent="center" p={10}>
              <VStack spacing={4} color="gray.500">
                <Icon as={ClipboardDocumentCheckIcon} w={12} h={12} />
                <Heading size="md">No Project Selected</Heading>
                <Text>Please select a project from the left to begin testing.</Text>
              </VStack>
            </Card>
          )}
        </Box>
      </SimpleGrid>
    </Box>
  )
}

export default QAExecution
