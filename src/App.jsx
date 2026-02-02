import { useState, useCallback, useEffect } from 'react'
import Header from './components/Header'
import LeftPane from './components/LeftPane'
import RightPane from './components/RightPane'
import './App.css'

const INDUSTRIES = ['Banking', 'Healthcare', 'Retail', 'Manufacturing', 'Technology']

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('app-rat-theme') || 'teal'
    } catch {
      return 'teal'
    }
  })
  const [file, setFile] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('app-rat-theme', theme)
    } catch {}
  }, [theme])
  const [industry, setIndustry] = useState('')
  const [taxonomyProgress, setTaxonomyProgress] = useState(0)
  const [gartnerProgress, setGartnerProgress] = useState(0)
  const [taxonomyDone, setTaxonomyDone] = useState(false)
  const [gartnerDone, setGartnerDone] = useState(false)
  const [statusLog, setStatusLog] = useState([])
  const [taxonomyTable, setTaxonomyTable] = useState(null)
  const [gartnerTable, setGartnerTable] = useState(null)
  const [pptDownloaded, setPptDownloaded] = useState(false)

  const addStatus = useCallback((message, type = 'info') => {
    setStatusLog((prev) => [...prev, { id: Date.now(), message, type }])
  }, [])

  const handleFile = useCallback(
    (f) => {
      setFile(f)
      if (f) addStatus('File uploaded successfully', 'success')
    },
    [addStatus]
  )

  const handleIndustryChange = useCallback(
    (val) => {
      setIndustry(val)
      if (val) addStatus(`Industry selected: ${val}`)
    },
    [addStatus]
  )

  const runTaxonomyMapping = useCallback(() => {
    if (!file || !industry) return
    addStatus('Starting taxonomy mapping…')
    setTaxonomyProgress(0)
    setTaxonomyDone(false)
    setTaxonomyTable(null)
    let p = 0
    const iv = setInterval(() => {
      p += 10
      setTaxonomyProgress(p)
      if (p >= 100) {
        clearInterval(iv)
        setTaxonomyDone(true)
        setTaxonomyTable([
          { app: 'App A', category: 'CRM', tier: 'Tier 1' },
          { app: 'App B', category: 'ERP', tier: 'Tier 2' },
          { app: 'App C', category: 'HR', tier: 'Tier 1' },
        ])
        addStatus('Taxonomy mapping completed (100%)', 'success')
      }
    }, 300)
  }, [file, industry, addStatus])

  const runGartnerMapping = useCallback(() => {
    if (!taxonomyDone) return
    addStatus('Starting Gartner mapping…')
    setGartnerProgress(0)
    setGartnerDone(false)
    setGartnerTable(null)
    let p = 0
    const iv = setInterval(() => {
      p += 10
      setGartnerProgress(p)
      if (p >= 100) {
        clearInterval(iv)
        setGartnerDone(true)
        setGartnerTable([
          { software: 'Salesforce', category: 'CRM', rating: 'Leader' },
          { software: 'SAP', category: 'ERP', rating: 'Leader' },
          { software: 'Workday', category: 'HR', rating: 'Challenger' },
        ])
        addStatus('Gartner mapping completed (100%)', 'success')
      }
    }, 400)
  }, [taxonomyDone, addStatus])

  const handlePptDownload = useCallback(() => {
    setPptDownloaded(true)
    addStatus('Output downloaded', 'success')
  }, [addStatus])

  return (
    <>
      <Header theme={theme} onThemeChange={setTheme} />
      <main className="app-main">
        <LeftPane
          file={file}
          onFile={handleFile}
          industry={industry}
          industries={INDUSTRIES}
          onIndustryChange={handleIndustryChange}
          taxonomyProgress={taxonomyProgress}
          gartnerProgress={gartnerProgress}
          taxonomyDone={taxonomyDone}
          gartnerDone={gartnerDone}
          onRunTaxonomy={runTaxonomyMapping}
          onRunGartner={runGartnerMapping}
          onPptDownload={handlePptDownload}
        />
        <RightPane
          statusLog={statusLog}
          taxonomyTable={taxonomyTable}
          gartnerTable={gartnerTable}
          pptDownloaded={pptDownloaded}
        />
      </main>
    </>
  )
}
