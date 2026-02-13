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
} from '@chakra-ui/react'
import { ExternalLinkIcon, CheckCircleIcon, WarningIcon, ViewIcon, DownloadIcon, AttachmentIcon, AddIcon, RepeatIcon, DeleteIcon, CopyIcon } from '@chakra-ui/icons'
import PageHeader from '../components/layout/PageHeader'
import { projectService } from '../services/projectService'
import { authService } from '../services/authService'
import { ClipboardDocumentCheckIcon, BoltIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

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

  // QA Checklist State
  const [checklist, setChecklist] = useState({
    responsive_ui: { label: 'UI/UX Responsiveness', status: 'pending', comment: '', attachments: [] },
    functionality: { label: 'Core Functionality', status: 'pending', comment: '', attachments: [] },
    navigation: { label: 'Navigation Links', status: 'pending', comment: '', attachments: [] },
    performance: { label: 'Load Performance', status: 'pending', comment: '', attachments: [] },
    security: { label: 'Basic Security Checks', status: 'pending', comment: '', attachments: [] },
    content: { label: 'Content Verification', status: 'pending', comment: '', attachments: [] },
  })

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
                setChecklist(parsed.checklist || checklist)
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
            checklist,
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
  }, [checklist, overallComment, pagePaths, betaUrlInput, contentUrl, contentToAnalyze, pageAnalysis, keywordStats, selectedProjectId])

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
      // However, we need to clear state first to avoid showing previous project data briefly.
      setChecklist({
        responsive_ui: { label: 'UI/UX Responsiveness', status: 'pending', comment: '', attachments: [] },
        functionality: { label: 'Core Functionality', status: 'pending', comment: '', attachments: [] },
        navigation: { label: 'Navigation Links', status: 'pending', comment: '', attachments: [] },
        performance: { label: 'Load Performance', status: 'pending', comment: '', attachments: [] },
        security: { label: 'Basic Security Checks', status: 'pending', comment: '', attachments: [] },
        content: { label: 'Content Verification', status: 'pending', comment: '', attachments: [] },
      })
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
        setChecklist({
        responsive_ui: { label: 'UI/UX Responsiveness', status: 'pending', comment: '', attachments: [] },
        functionality: { label: 'Core Functionality', status: 'pending', comment: '', attachments: [] },
        navigation: { label: 'Navigation Links', status: 'pending', comment: '', attachments: [] },
        performance: { label: 'Load Performance', status: 'pending', comment: '', attachments: [] },
        security: { label: 'Basic Security Checks', status: 'pending', comment: '', attachments: [] },
        content: { label: 'Content Verification', status: 'pending', comment: '', attachments: [] },
        })
        setOverallComment('')
        setAutoCheckResults(null)
        localStorage.removeItem(`qa_progress_${selectedProjectId}`)
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
        handleChecklistChange('security', 'status', 'pass')
        handleChecklistChange('security', 'comment', 'Auto-check: URL uses HTTPS.')
      } else {
        results.https = { status: 'fail', message: 'Insecure (HTTP)' }
        handleChecklistChange('security', 'status', 'fail')
        handleChecklistChange('security', 'comment', 'Auto-check: URL does not use HTTPS.')
      }

      // 2. Availability & Response Time (Simulated via fetch)
      const startTime = performance.now()
      try {
        await fetch(url, { mode: 'no-cors', method: 'HEAD' })
        const endTime = performance.now()
        const duration = Math.round(endTime - startTime)
        
        results.availability = { status: 'pass', message: 'Site is Reachable' }
        results.response_time = { status: 'pass', message: `${duration}ms` }
        
        // Auto-update performance checklist
        if (duration < 1000) {
           handleChecklistChange('performance', 'status', 'pass')
           handleChecklistChange('performance', 'comment', `Auto-check: Fast response (${duration}ms).`)
        } else if (duration < 3000) {
           handleChecklistChange('performance', 'status', 'pass')
           handleChecklistChange('performance', 'comment', `Auto-check: Acceptable response (${duration}ms).`)
        } else {
           handleChecklistChange('performance', 'status', 'fail')
           handleChecklistChange('performance', 'comment', `Auto-check: Slow response (${duration}ms).`)
        }

      } catch (err) {
        results.availability = { status: 'fail', message: 'Connection Failed (CORS or Offline)' }
        results.response_time = { status: 'fail', message: 'N/A' }
        handleChecklistChange('performance', 'status', 'fail')
        handleChecklistChange('performance', 'comment', 'Auto-check: Connection failed.')
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

  const [newItemName, setNewItemName] = useState('')

  const handleAddCustomItem = () => {
    if (!newItemName.trim()) return
    const key = `custom_${Date.now()}`
    setChecklist(prev => ({
        ...prev,
        [key]: { label: newItemName, status: 'pending', comment: '', attachments: [] }
    }))
    setNewItemName('')
    toast({ title: 'Custom Item Added', status: 'success', duration: 2000 })
  }

  const handleMarkAllPass = () => {
    setChecklist(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(key => {
            next[key] = { ...next[key], status: 'pass' }
        })
        return next
    })
    toast({ title: 'All items marked as Pass', status: 'success', duration: 2000 })
  }

  const handleDeleteItem = (key) => {
    if (window.confirm('Delete this checklist item?')) {
        setChecklist(prev => {
            const next = { ...prev }
            delete next[key]
            return next
        })
    }
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

  const handleExportReport = () => {
    if (!selectedProject) return

    const reportData = {
        project: selectedProject.name,
        date: new Date().toLocaleString(),
        summary: overallComment,
        checklist: Object.entries(checklist).map(([key, val]) => ({
            category: val.label,
            status: val.status,
            comment: val.comment,
            attachments: val.attachments.length
        })),
        url_comparison: comparisonResults || [],
        seo_analysis: pageAnalysis || 'Not run',
        keyword_density: keywordStats || 'Not run',
        grammar_issues: analysisResults ? {
            count: analysisResults.matches.length,
            matches: analysisResults.matches.map(m => ({
                message: m.message,
                context: m.context.text,
                rule: m.rule.id
            }))
        } : 'Not run'
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `QA_Report_${selectedProject.name}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({ title: 'Report Downloaded', status: 'success' })
  }

  const handleAddAttachment = (key) => {
    // Simulated attachment - in real app would open file picker
    const fileName = prompt("Enter file name for attachment (simulated):", "screenshot.png")
    if (fileName) {
        setChecklist(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                attachments: [...(prev[key].attachments || []), fileName]
            }
        }))
    }
  }

  const handleChecklistChange = (key, field, value) => {
    setChecklist(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }))
  }

  const calculateProgress = () => {
    const total = Object.keys(checklist).length
    const completed = Object.values(checklist).filter(item => item.status !== 'pending').length
    return (completed / total) * 100
  }

  const handleSubmitReport = () => {
    // In a real app, this would save to a database
    console.log({
      projectId: selectedProjectId,
      projectName: selectedProject?.name,
      checklist,
      overallComment,
      timestamp: new Date().toISOString()
    })

    toast({
      title: 'QA Report Submitted',
      description: `Report for ${selectedProject?.name} has been saved successfully.`,
      status: 'success',
      duration: 3000,
    })
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
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between">
                        <Text>Security (HTTPS)</Text>
                        <Badge colorScheme={autoCheckResults.https.status === 'pass' ? 'green' : 'red'}>
                          {autoCheckResults.https.message}
                        </Badge>
                      </HStack>
                      <Divider />
                      <HStack justify="space-between">
                        <Text>Availability</Text>
                        <Badge colorScheme={autoCheckResults.availability.status === 'pass' ? 'green' : 'red'}>
                          {autoCheckResults.availability.message}
                        </Badge>
                      </HStack>
                      <Divider />
                      <HStack justify="space-between">
                        <Text>Response Time</Text>
                        <Badge colorScheme={
                          autoCheckResults.response_time.status === 'pass' ? 'green' : 
                          autoCheckResults.response_time.status === 'fail' ? 'red' : 'gray'
                        }>
                          {autoCheckResults.response_time.message}
                        </Badge>
                      </HStack>
                    </VStack>
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
            <Tabs variant="enclosed" colorScheme="vrv" isLazy>
              <TabList mb={4}>
                <Tab>Quality Checklist</Tab>
                <Tab>URL Comparator</Tab>
                <Tab>Content Analysis</Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0}>
            <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" borderRadius="xl">
              <CardHeader display="flex" justifyContent="space-between" alignItems="center">
                <Heading size="md">Testing Checklist</Heading>
                <Badge colorScheme={calculateProgress() === 100 ? 'green' : 'orange'}>
                  {Math.round(calculateProgress())}% Complete
                </Badge>
              </CardHeader>
              <CardBody>
                <HStack justify="space-between" mb={4}>
                    <Progress value={calculateProgress()} flex="1" mr={4} colorScheme="vrv" borderRadius="full" size="sm" />
                    <Button size="xs" leftIcon={<CheckCircleIcon />} colorScheme="green" variant="outline" onClick={handleMarkAllPass}>
                        Mark All Pass
                    </Button>
                </HStack>
                
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Test Category</Th>
                      <Th width="140px">Status</Th>
                      <Th>Comments/Evidence</Th>
                      <Th width="50px"></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Object.entries(checklist).map(([key, item]) => (
                      <Tr key={key}>
                        <Td fontWeight="medium">{item.label}</Td>
                        <Td>
                          <Select 
                            size="sm" 
                            value={item.status}
                            onChange={(e) => handleChecklistChange(key, 'status', e.target.value)}
                            bg={
                              item.status === 'pass' ? 'green.50' : 
                              item.status === 'fail' ? 'red.50' : 
                              'transparent'
                            }
                            borderColor={
                              item.status === 'pass' ? 'green.200' : 
                              item.status === 'fail' ? 'red.200' : 
                              'inherit'
                            }
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
                                onChange={(e) => handleChecklistChange(key, 'comment', e.target.value)}
                            />
                            <HStack>
                                <Button size="xs" leftIcon={<AttachmentIcon />} variant="ghost" onClick={() => handleAddAttachment(key)}>
                                    Attach
                                </Button>
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

                <Box mt={6}>
                  <FormLabel>Overall Feedback / Summary</FormLabel>
                  <Textarea 
                    value={overallComment}
                    onChange={(e) => setOverallComment(e.target.value)}
                    placeholder="Summary of testing results..."
                    rows={4}
                  />
                </Box>

                <HStack mt={6} justify="flex-end">
                  <Button variant="ghost" onClick={resetChecklist}>Reset</Button>
                  <Button 
                    variant="outline" 
                    leftIcon={<DownloadIcon />}
                    onClick={handleExportReport}
                  >
                    Export JSON
                  </Button>
                  <Button 
                    colorScheme="vrv" 
                    leftIcon={<CheckCircleIcon />}
                    onClick={handleSubmitReport}
                    isDisabled={calculateProgress() === 0}
                  >
                    Submit Report
                  </Button>
                </HStack>
              </CardBody>
            </Card>
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
