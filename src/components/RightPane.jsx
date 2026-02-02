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
    <section className="right-section">
      <h3 className="right-section-title">Bot process status</h3>
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
    </section>
  )
}

function ResultTable({ title, rows, columns }) {
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
                <th key={k}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {keys.map((k) => (
                  <td key={k}>{row[k]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function RightPane({ statusLog, taxonomyTable, gartnerTable, pptDownloaded }) {
  return (
    <div className="right-pane">
      <StatusFeed log={statusLog} />

      {taxonomyTable?.length > 0 && (
        <ResultTable
          title="Taxonomy mapping output"
          rows={taxonomyTable}
          columns={['app', 'category', 'tier']}
        />
      )}

      {gartnerTable?.length > 0 && (
        <ResultTable
          title="Gartner best-in-class mapping"
          rows={gartnerTable}
          columns={['software', 'category', 'rating']}
        />
      )}

      {pptDownloaded && (
        <section className="right-section">
          <p className="right-download-status">Output is downloaded.</p>
        </section>
      )}
    </div>
  )
}
