import './RightPane.css'

function StatusFeed({ log }) {
  const iconFor = (type) => {
    switch (type) {
      case 'success':
        return (
          <span className="status-icon status-icon-success" aria-hidden>
            ✓
          </span>
        )
      default:
        return (
          <span className="status-icon status-icon-info" aria-hidden>
            •
          </span>
        )
    }
  }

  return (
    <section className="right-section right-section-status">
      <h3 className="right-section-title">Bot process status</h3>
      <div className="status-list-scroll">
        <ul className="status-list" aria-label="Status log">
          {log.length === 0 ? (
            <li className="status-item status-item-empty">No activity yet.</li>
          ) : (
            log.map((item) => (
              <li key={item.id} className={`status-item status-item-${item.type}`}>
                {iconFor(item.type)}
                <span className="status-message">{item.message}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  )
}

function headerLabel(key, columnLabels) {
  if (columnLabels?.[key]) return columnLabels[key]
  return key.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, (s) => s.toUpperCase())
}

function ResultTable({ title, rows, columns, formatters, totalRow, totalFormatters, columnLabels }) {
  if (!rows?.length) return null
  const keys = columns || (rows.length ? Object.keys(rows[0]) : [])
  const tf = totalFormatters || formatters
  const formatCell = (row, k, isTotal) => {
    const fmt = isTotal && tf?.[k] ? tf[k] : formatters?.[k]
    return fmt ? fmt(row[k]) : String(row[k] ?? '')
  }

  return (
    <section className="right-section">
      <h3 className="right-section-title">{title}</h3>
      <div className="table-wrap">
        <table className="result-table">
          <thead>
            <tr>
              {keys.map((k) => (
                <th key={k}>{headerLabel(k, columnLabels)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {keys.map((k) => (
                  <td key={k}>{formatCell(row, k, false)}</td>
                ))}
              </tr>
            ))}
            {totalRow && (
              <tr className="result-table-total">
                {keys.map((k) => (
                  <td key={k}>{formatCell(totalRow, k, true)}</td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function formatCurrency(v) {
  const n = Number(v)
  if (Number.isNaN(n)) return `$${String(v ?? '')}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatMillions(v) {
  const n = Number(v)
  if (Number.isNaN(n)) return String(v ?? '')
  const m = n / 1_000_000
  return `$${m.toFixed(1)} M`
}

export default function RightPane({
  statusLog,
  uploadSummary,
  uploading,
  showUploadResult,
  taxonomyTable,
  gartnerTable,
  pptDownloaded,
}) {
  const gartnerFormatters = {
    top5AppNames: (v) => (Array.isArray(v) ? v.join(', ') : String(v ?? '')),
    recommendedGartnerApps: (v) => String(v ?? ''),
  }
  const uploadSummaryFormatters = {
    totalSpend: formatMillions,
  }
  const uploadSummaryTotalFormatters = {
    applicationType: (v) => String(v ?? ''),
    count: (v) => String(v ?? ''),
    totalSpend: formatMillions,
  }
  const taxonomyFormatters = {
    spend: formatMillions,
  }
  const taxonomyTotalFormatters = {
    l1: (v) => String(v ?? ''),
    applicationsCount: (v) => String(v ?? ''),
    spend: formatMillions,
  }

  const uploadTotalRow =
    uploadSummary?.length > 0
      ? {
          applicationType: 'Total',
          count: uploadSummary.reduce((s, r) => s + (Number(r.count) || 0), 0),
          totalSpend: uploadSummary.reduce((s, r) => s + (Number(r.totalSpend) || 0), 0),
        }
      : null

  const taxonomyTotalRow =
    taxonomyTable?.length > 0
      ? {
          l1: 'Total',
          applicationsCount: taxonomyTable.reduce((s, r) => s + (Number(r.applicationsCount) || 0), 0),
          spend: taxonomyTable.reduce((s, r) => s + (Number(r.spend) || 0), 0),
        }
      : null

  const gartnerDisplayRows = gartnerTable?.length > 0 ? gartnerTable.slice(0, 10) : []
  const gartnerColumns = ['l2', 'top5AppNames', 'recommendedGartnerApps', 'marketLeaders']

  return (
    <div className="right-pane">
      <div className="right-pane-content">
        <StatusFeed log={statusLog} />

        {(uploading || uploadSummary?.length > 0) && (
          <section className="right-section">
            <h3 className="right-section-title">CMDB current status</h3>
            {uploading || !showUploadResult ? (
              <div className="upload-result-loading" aria-busy="true" aria-label="Loading">
                <img src="/logos/loading.gif" alt="" className="upload-loading-gif" />
                <span className="upload-loading-text">Loading…</span>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="result-table">
                  <thead>
                    <tr>
                      {['applicationType', 'count', 'totalSpend'].map((k) => (
                        <th key={k}>{headerLabel(k, { count: 'Applications Count' })}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadSummary.map((row, i) => (
                      <tr key={i}>
                        {['applicationType', 'count', 'totalSpend'].map((k) => (
                          <td key={k}>
                            {uploadSummaryFormatters?.[k] ? uploadSummaryFormatters[k](row[k]) : String(row[k] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {uploadTotalRow && (
                      <tr className="result-table-total">
                        {['applicationType', 'count', 'totalSpend'].map((k) => (
                          <td key={k}>
                            {uploadSummaryTotalFormatters?.[k]
                              ? uploadSummaryTotalFormatters[k](uploadTotalRow[k])
                              : String(uploadTotalRow[k] ?? '')}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {taxonomyTable?.length > 0 && (
          <ResultTable
            title="CMDB-Taxonomy Mapping Output"
            rows={taxonomyTable}
            columns={['l1', 'applicationsCount', 'spend']}
            formatters={taxonomyFormatters}
            totalRow={taxonomyTotalRow}
            totalFormatters={taxonomyTotalFormatters}
            columnLabels={{ l1: 'Category' }}
          />
        )}

        {gartnerDisplayRows.length > 0 && (
          <ResultTable
            title="Gartner best-in-class mapping"
            rows={gartnerDisplayRows}
            columns={gartnerColumns}
            formatters={gartnerFormatters}
            columnLabels={{ l2: 'Sub-Category', top5AppNames: 'Apps in current CMDB' }}
          />
        )}

        {pptDownloaded && (
          <section className="right-section">
            <p className="right-download-status">Output is downloaded.</p>
          </section>
        )}
      </div>
    </div>
  )
}
