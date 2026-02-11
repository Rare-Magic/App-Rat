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

function ResultTable({ title, rows, columns, formatters, totalRow, totalFormatters, columnLabels, tableClassName }) {
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
        <table className={`result-table ${tableClassName || ''}`}>
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
  industry,
}) {
  const gartnerFormatters = {
    top5AppNames: (v) => (Array.isArray(v) ? v.join(', ') : String(v ?? '')),
    recommendedGartnerApps: (v) => {
      if (!v) return ''
      const parts = String(v)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const shown = parts.slice(0, 5)
      if (!shown.length) return ''
      let text = shown.join(', ')
      if (parts.length > 5) text += ', ---'
      return text
    },
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

  // Sort taxonomy rows by spend (descending), leaving the total row separate
  const taxonomySortedRows =
    taxonomyTable && taxonomyTable.length > 0
      ? [...taxonomyTable].sort((a, b) => (Number(b.spend) || 0) - (Number(a.spend) || 0))
      : []

  const preferredSubCategories = new Set([
    'Alternative Investments',
    'Digital Banking',
    'Identity & Network Security',
    'Recruiting',
    'IT Service Mgmt. & Support',
    'Digital Marketing',
  ])

  const gartnerAllRows =
    gartnerTable?.filter((r) => {
      const ml = String(r.marketLeaders ?? '').trim()
      return ml && ml !== '-'
    }) || []

  // Sort so the 6 preferred Sub-Categories appear first (in the specified order)
  const gartnerSortedRows = [...gartnerAllRows].sort((a, b) => {
    const aSub = String(a.l2 ?? '')
    const bSub = String(b.l2 ?? '')
    const order = [
      'Alternative Investments',
      'Digital Banking',
      'Identity & Network Security',
      'Recruiting',
      'IT Service Mgmt. & Support',
      'Digital Marketing',
    ]
    const ia = order.indexOf(aSub)
    const ib = order.indexOf(bSub)
    if (ia === -1 && ib === -1) return 0
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
  const gartnerDisplayRows = gartnerSortedRows.slice(0, 10)
  const gartnerColumns = ['l1', 'l2', 'top5AppNames', 'recommendedGartnerApps', 'marketLeaders']

  return (
    <div className="right-pane">
      <div className="right-pane-content">
        <StatusFeed log={statusLog} />

        {(uploading || uploadSummary?.length > 0) && (
          <section className="right-section">
            <h3 className="right-section-title">Current view of Client&apos;s Application Portfolio</h3>
            {uploading || !showUploadResult ? (
              <div className="upload-result-loading" aria-busy="true" aria-label="Loading">
                <img src="/logos/loading.gif" alt="" className="upload-loading-gif" />
                <span className="upload-loading-text">Loading…</span>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="result-table current-portfolio-table">
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
            title={industry ? `${industry} Industry Taxonomy Mapping Output` : 'Industry Taxonomy Mapping Output'}
            rows={taxonomySortedRows}
            columns={['l1', 'applicationsCount', 'spend']}
            formatters={taxonomyFormatters}
            totalRow={taxonomyTotalRow}
            totalFormatters={taxonomyTotalFormatters}
            columnLabels={{ l1: 'Category' }}
            tableClassName="taxonomy-table"
          />
        )}

        {gartnerDisplayRows.length > 0 && (
          <section className="right-section">
            <h3 className="right-section-title">Gartner best-in-class mapping</h3>
            <div className="table-wrap gartner-table-wrap">
              <table className="result-table">
                <thead>
                  <tr>
                    {gartnerColumns.map((k) => (
                      <th
                        key={k}
                      >
                        {headerLabel(k, {
                          l1: 'Category',
                          l2: 'Sub-Category',
                          top5AppNames: 'Current Portfolio Apps',
                        })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gartnerDisplayRows.map((row, idx) => {
                    const blurred = idx >= 6
                    return (
                      <tr key={idx} className={blurred ? 'gartner-row-blurred' : ''}>
                        <td>{String(row.l1 ?? '')}</td>
                        <td>{String(row.l2 ?? '')}</td>
                        <td>{gartnerFormatters.top5AppNames(row.top5AppNames)}</td>
                        <td>{gartnerFormatters.recommendedGartnerApps(row.recommendedGartnerApps)}</td>
                        <td>{String(row.marketLeaders ?? '')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {gartnerDisplayRows.length > 6 && (
                <div className="gartner-blur-overlay">
                  <span>Download Report to see full view</span>
                </div>
              )}
            </div>
          </section>
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
