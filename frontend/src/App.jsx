import { useState, useCallback, useRef } from 'react'
import Header from './components/Header'
import LeftPane from './components/LeftPane'
import RightPane from './components/RightPane'
import { uploadFile as apiUpload, mapCmdb, mapGartner } from './api'
import './App.css'

const INDUSTRIES = ['Banking & FS', 'Healthcare', 'Retail', 'Manufacturing']

// Uneven progress over duration seconds: slow start, fast middle, slow end (ease-in-out)
function progressAtSeconds(sec, duration) {
  if (sec <= 0) return 0
  if (sec >= duration) return 100
  const t = sec / duration
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
  const [showUploadResult, setShowUploadResult] = useState(false)
  const [mappingCmdb, setMappingCmdb] = useState(false)
  const [mappingGartner, setMappingGartner] = useState(false)
  const pendingCmdbRef = useRef(null)
  const pendingGartnerRef = useRef(null)

  const addStatus = useCallback((message, type = 'info') => {
    setStatusLog((prev) => [...prev, { id: Date.now(), message, type }])
  }, [])

  const handleFile = useCallback(
    async (f) => {
      if (!f) {
        setFile(null)
        setUploadSummary(null)
        setShowUploadResult(false)
        return
      }
      setUploading(true)
      setUploadSummary(null)
      setShowUploadResult(false)
      try {
        const data = await apiUpload(f)
        setFile(f)
        setUploadSummary(data.summary || [])
        addStatus('File uploaded successfully', 'success')
        setTimeout(() => setShowUploadResult(true), 5000)
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
    pendingCmdbRef.current = null
    const start = Date.now()
    mapCmdb()
      .then((data) => {
        pendingCmdbRef.current = { data }
      })
      .catch((err) => {
        pendingCmdbRef.current = { error: err }
      })
    const iv = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      const p = Math.min(100, Math.round(progressAtSeconds(elapsed, 40)))
      setTaxonomyProgress(p)
      if (p >= 100) {
        clearInterval(iv)
        setMappingCmdb(false)
        const pending = pendingCmdbRef.current
        pendingCmdbRef.current = null
        if (pending?.data) {
          setTaxonomyDone(true)
          setTaxonomyTable(pending.data.summary || [])
          addStatus('Taxonomy mapping completed (100%)', 'success')
        } else if (pending?.error) {
          setTaxonomyProgress(0)
          addStatus(pending.error.message || 'Map CMDB failed', 'error')
        }
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
    pendingGartnerRef.current = null
    const start = Date.now()
    mapGartner()
      .then((data) => {
        pendingGartnerRef.current = { data }
      })
      .catch((err) => {
        pendingGartnerRef.current = { error: err }
      })
    const iv = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      const p = Math.min(100, Math.round(progressAtSeconds(elapsed, 25)))
      setGartnerProgress(p)
      if (p >= 100) {
        clearInterval(iv)
        setMappingGartner(false)
        const pending = pendingGartnerRef.current
        pendingGartnerRef.current = null
        if (pending?.data) {
          setGartnerDone(true)
          setGartnerTable(pending.data.summary || [])
          addStatus('Gartner mapping completed (100%)', 'success')
        } else if (pending?.error) {
          setGartnerProgress(0)
          addStatus(pending.error.message || 'Gartner mapping failed', 'error')
        }
      }
    }, 200)
  }, [taxonomyDone, addStatus])

  const handlePptDownload = useCallback(async () => {
    try {
      const { downloadFile, getDownloadPptUrl } = await import('./api')
      await downloadFile(getDownloadPptUrl(), 'output.pptx')
      setPptDownloaded(true)
      addStatus('Output downloaded', 'success')
    } catch (err) {
      addStatus(err.message || 'PPT download failed', 'error')
    }
  }, [addStatus])

  const handleExcelDownload = useCallback(async () => {
    try {
      const { downloadFile, getDownloadExcelUrl } = await import('./api')
      await downloadFile(getDownloadExcelUrl(), 'gartner_export.xlsx')
      addStatus('Excel downloaded', 'success')
    } catch (err) {
      addStatus(err.message || 'Excel download failed', 'error')
    }
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
          onExcelDownload={handleExcelDownload}
          uploading={uploading}
          mappingCmdb={mappingCmdb}
          mappingGartner={mappingGartner}
        />
        <RightPane
          statusLog={statusLog}
          uploadSummary={uploadSummary}
          uploading={uploading}
          showUploadResult={showUploadResult}
          taxonomyTable={taxonomyTable}
          gartnerTable={gartnerTable}
          pptDownloaded={pptDownloaded}
        />
      </main>
    </>
  )
}
