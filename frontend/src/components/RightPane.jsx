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

function ResultTable({ title, rows, columns, formatters }) {
  if (!rows?.length) return null
  const keys = columns || (rows.length ? Object.keys(rows[0]) : [])

  return (
    <section className="right-section">
      <h3 className="right-section-title">{title}</h3>
      <div className="table-wrap">
        <table className="result-table">
          <thead>
            <tr>
              {keys.map((k) => (
                <th key={k}>{k.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, (s) => s.toUpperCase())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {keys.map((k) => (
                  <td key={k}>{formatters?.[k] ? formatters[k](row[k]) : String(row[k] ?? '')}</td>
                ))}
              </tr>
            ))}
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

export default function RightPane({ statusLog, uploadSummary, taxonomyTable, gartnerTable, pptDownloaded }) {
  const gartnerFormatters = {
    top5AppNames: (v) => (Array.isArray(v) ? v.join(', ') : String(v ?? '')),
  }
  const uploadSummaryFormatters = {
    totalSpend: formatCurrency,
  }
  const taxonomyFormatters = {
    spend: formatCurrency,
  }

  return (
    <div className="right-pane">
      <div className="right-pane-content">
        <StatusFeed log={statusLog} />

        {uploadSummary?.length > 0 && (
          <ResultTable
            title="Upload summary"
            rows={uploadSummary}
            columns={['applicationType', 'count', 'totalSpend']}
            formatters={uploadSummaryFormatters}
          />
        )}

        {taxonomyTable?.length > 0 && (
          <ResultTable
            title="Taxonomy mapping output"
            rows={taxonomyTable}
            columns={['l1', 'applicationsCount', 'spend']}
            formatters={taxonomyFormatters}
          />
        )}

        {gartnerTable?.length > 0 && (
          <ResultTable
            title="Gartner best-in-class mapping"
            rows={gartnerTable}
            columns={['l1', 'l2', 'top5AppNames', 'marketLeaders']}
            formatters={gartnerFormatters}
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
