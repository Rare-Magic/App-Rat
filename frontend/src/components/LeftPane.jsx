import { useCallback, useState } from 'react'
import './LeftPane.css'

function UploadZone({ file, onFile, uploading }) {
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
      <h3 className="left-section-title">Upload CMDB Data</h3>
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
            <button type="button" className="upload-clear" onClick={clearFile} disabled={uploading}>
              Remove
            </button>
            {uploading && <span className="upload-status">Uploading…</span>}
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
      <h3 className="left-section-title">Select Bain Industry</h3>
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

function OutputSection({ onDownload, title, hint, iconSrc, downloadLabel, ariaLabel }) {
  return (
    <section className="left-section output-section">
      <h3 className="left-section-title">{title}</h3>
      <button type="button" className="output-block" onClick={onDownload} aria-label={ariaLabel}>
        <span className="output-icon" aria-hidden>
          <img src={iconSrc} alt="" />
        </span>
        <div className="output-block-text">
          <span className="output-text">{downloadLabel}</span>
          <span className="output-hint">{hint}</span>
        </div>
      </button>
    </section>
  )
}

function ExcelDownloadSection({ onDownload }) {
  return (
    <section className="left-section output-section">
      <h3 className="left-section-title">Gartner Mapping Full Report</h3>
      <button type="button" className="output-block output-block-excel" onClick={onDownload} aria-label="Download Excel">
        <span className="output-icon" aria-hidden>
          <img src="/logos/excel.png" alt="" />
        </span>
        <div className="output-block-text">
          <span className="output-text">Download Excel</span>
          <span className="output-hint">Click to download</span>
        </div>
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
  onExcelDownload,
  uploading,
  mappingCmdb,
  mappingGartner,
}) {
  const canRunTaxonomy = file && industry && !uploading && !mappingCmdb
  const canRunGartner = taxonomyDone && !mappingGartner

  return (
    <div className="left-pane">
      <UploadZone file={file} onFile={onFile} uploading={uploading} />
      <IndustrySelect value={industry} options={industries} onChange={onIndustryChange} />

      <section className="left-section action-row">
        <button
          type="button"
          className="btn btn-primary btn-half"
          disabled={!canRunTaxonomy}
          onClick={onRunTaxonomy}
          title={!canRunTaxonomy ? 'Upload a file and select an industry to enable' : 'Run CMDB mapping and generate PPT'}
        >
          Map CMDB Data
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
          Gartner Leaders Mapping
        </button>
        <ProgressBar progress={gartnerProgress} label={gartnerProgress === 100 ? 'Done' : `${gartnerProgress}%`} />
      </section>

      {taxonomyDone && (
        <OutputSection
          onDownload={onPptDownload}
          title="Application Rationalization Heatmap"
          hint="Click to download"
          iconSrc="/logos/ppt.png"
          downloadLabel="Download PPT"
          ariaLabel="Download PPT"
        />
      )}

      {gartnerDone && <ExcelDownloadSection onDownload={onExcelDownload} />}
    </div>
  )
}
