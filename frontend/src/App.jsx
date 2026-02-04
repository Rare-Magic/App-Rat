import { useState, useCallback } from 'react'
import Header from './components/Header'
import LeftPane from './components/LeftPane'
import RightPane from './components/RightPane'
import { uploadFile as apiUpload, mapCmdb, mapGartner } from './api'
import './App.css'

const INDUSTRIES = ['Banking & FS', 'Healthcare', 'Retail', 'Manufacturing']

// Uneven progress over 60s: slow start, fast middle, slow end (ease-in-out)
function progressAtSeconds(sec) {
  if (sec <= 0) return 0
  if (sec >= 60) return 100
  const t = sec / 60
  return t < 0.5
    ? 2 * 50 * t * t
    : 100 - 2 * 50 * (1 - t) * (1 - t)
}

export default function App() {
  const [file, setFile] = useState(null)
  const [industry, setIndustry] = useState('')
  const [uploadSummary, setUploadSummary] = useState(null)
  const [taxonomyProgress, setTaxonomyProgress] = useState(0)
  const [gartnerProgress, setGartnerProgress] = useState(0)
  const [taxonomyDone, setTaxonomyDone] = useState(false)
  const [gartnerDone, setGartnerDone] = useState(false)
  const [statusLog, setStatusLog] = useState([])
  const [taxonomyTable, setTaxonomyTable] = useState(null)
  const [gartnerTable, setGartnerTable] = useState(null)
  const [pptDownloaded, setPptDownloaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mappingCmdb, setMappingCmdb] = useState(false)
  const [mappingGartner, setMappingGartner] = useState(false)

  const addStatus = useCallback((message, type = 'info') => {
    setStatusLog((prev) => [...prev, { id: Date.now(), message, type }])
  }, [])

  const handleFile = useCallback(
    async (f) => {
      if (!f) {
        setFile(null)
        setUploadSummary(null)
        return
      }
      setUploading(true)
      setUploadSummary(null)
      try {
        const data = await apiUpload(f)
        setFile(f)
        setUploadSummary(data.summary || [])
        addStatus('File uploaded successfully', 'success')
      } catch (err) {
        addStatus(err.message || 'Upload failed', 'error')
      } finally {
        setUploading(false)
      }
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
    setMappingCmdb(true)
    const start = Date.now()
    const iv = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      const p = Math.min(100, Math.round(progressAtSeconds(elapsed)))
      setTaxonomyProgress(p)
      if (p >= 100) {
        clearInterval(iv)
        setMappingCmdb(false)
        mapCmdb()
          .then((data) => {
            setTaxonomyDone(true)
            setTaxonomyTable(data.summary || [])
            addStatus('Taxonomy mapping completed (100%)', 'success')
          })
          .catch((err) => {
            addStatus(err.message || 'Map CMDB failed', 'error')
          })
      }
    }, 200)
  }, [file, industry, addStatus])

  const runGartnerMapping = useCallback(() => {
    if (!taxonomyDone) return
    addStatus('Starting Gartner mapping…')
    setGartnerProgress(0)
    setGartnerDone(false)
    setGartnerTable(null)
    setMappingGartner(true)
    const start = Date.now()
    const iv = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      const p = Math.min(100, Math.round(progressAtSeconds(elapsed)))
      setGartnerProgress(p)
      if (p >= 100) {
        clearInterval(iv)
        setMappingGartner(false)
        mapGartner()
          .then((data) => {
            setGartnerDone(true)
            setGartnerTable(data.summary || [])
            addStatus('Gartner mapping completed (100%)', 'success')
          })
          .catch((err) => {
            addStatus(err.message || 'Gartner mapping failed', 'error')
          })
      }
    }, 200)
  }, [taxonomyDone, addStatus])

  const handlePptDownload = useCallback(() => {
    setPptDownloaded(true)
    addStatus('Output downloaded', 'success')
  }, [addStatus])

  return (
    <>
      <Header />
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
          uploading={uploading}
          mappingCmdb={mappingCmdb}
          mappingGartner={mappingGartner}
        />
        <RightPane
          statusLog={statusLog}
          uploadSummary={uploadSummary}
          taxonomyTable={taxonomyTable}
          gartnerTable={gartnerTable}
          pptDownloaded={pptDownloaded}
        />
      </main>
    </>
  )
}
