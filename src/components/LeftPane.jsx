import { useCallback, useState } from 'react'
import './LeftPane.css'

function UploadZone({ file, onFile }) {
  const [drag, setDrag] = useState(false)

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDrag(false)
      const f = e.dataTransfer?.files?.[0]
      if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv'))) {
        onFile(f)
      }
    },
    [onFile]
  )

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDrag(true)
  }, [])

  const handleDragLeave = useCallback(() => setDrag(false), [])

  const handleInput = useCallback(
    (e) => {
      const f = e.target?.files?.[0]
      if (f) onFile(f)
      e.target.value = ''
    },
    [onFile]
  )

  const clearFile = useCallback(() => onFile(null), [onFile])

  return (
    <section className="left-section">
      <h3 className="left-section-title">Upload data</h3>
      <p className="left-section-hint">Excel or CSV (fixed column names). Drag & drop or choose file.</p>
      <div
        className={`upload-zone ${drag ? 'upload-zone-drag' : ''} ${file ? 'upload-zone-has-file' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {file ? (
          <div className="upload-file-info">
            <span className="upload-filename">{file.name}</span>
            <span className="upload-filesize">{(file.size / 1024).toFixed(1)} KB</span>
            <button type="button" className="upload-clear" onClick={clearFile}>
              Remove
            </button>
          </div>
        ) : (
          <>
            <span className="upload-placeholder">Drop file here or</span>
            <label className="upload-browse">
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleInput} hidden />
              Choose file
            </label>
          </>
        )}
      </div>
    </section>
  )
}

function IndustrySelect({ value, options, onChange }) {
  return (
    <section className="left-section">
      <h3 className="left-section-title">Industry</h3>
      <select
        className="industry-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select industry"
      >
        <option value="">Select industry</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </section>
  )
}

function ProgressBar({ progress, label }) {
  return (
    <div className="progress-inline">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <span className="progress-label">{label}</span>
    </div>
  )
}

function OutputSection({ onDownload }) {
  return (
    <section className="left-section output-section">
      <h3 className="left-section-title">Bot output</h3>
      <button type="button" className="output-block" onClick={onDownload} aria-label="Download PPT">
        <span className="output-icon" aria-hidden>
          <img src="/logos/ppt.jpg" alt="" />
        </span>
        <span className="output-text">Download PPT</span>
        <span className="output-hint">Click to download</span>
      </button>
    </section>
  )
}

export default function LeftPane({
  file,
  onFile,
  industry,
  industries,
  onIndustryChange,
  taxonomyProgress,
  gartnerProgress,
  taxonomyDone,
  gartnerDone,
  onRunTaxonomy,
  onRunGartner,
  onPptDownload,
}) {
  const canRunTaxonomy = file && industry
  const canRunGartner = taxonomyDone

  return (
    <div className="left-pane">
      <UploadZone file={file} onFile={onFile} />
      <IndustrySelect value={industry} options={industries} onChange={onIndustryChange} />

      <section className="left-section action-row">
        <button
          type="button"
          className="btn btn-primary btn-half"
          disabled={!canRunTaxonomy}
          onClick={onRunTaxonomy}
        >
          Map taxonomy to Excel
        </button>
        <ProgressBar progress={taxonomyProgress} label={taxonomyProgress === 100 ? 'Done' : `${taxonomyProgress}%`} />
      </section>

      <section className="left-section action-row">
        <button
          type="button"
          className="btn btn-primary btn-half"
          disabled={!canRunGartner}
          onClick={onRunGartner}
        >
          Gartner mapping
        </button>
        <ProgressBar progress={gartnerProgress} label={gartnerProgress === 100 ? 'Done' : `${gartnerProgress}%`} />
      </section>

      {gartnerDone && <OutputSection onDownload={onPptDownload} />}
    </div>
  )
}
