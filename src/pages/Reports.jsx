import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

function ReportsLogin() {
  const { error, gsiReady, renderSignInButton, promptSignIn } = useAuth()
  const btnRef = useRef(null)

  useEffect(() => {
    if (gsiReady && btnRef.current) renderSignInButton(btnRef.current)
  }, [gsiReady, renderSignInButton])

  return (
    <div className="admin-page">
      <div className="admin-login">
        <i className="fas fa-lock admin-login-icon"></i>
        <h2>Reports Access</h2>
        <p>Sign in with your organization Google Workspace account to view reports.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <div ref={btnRef} className="admin-google-btn"></div>
          {gsiReady && (
            <button type="button" onClick={promptSignIn} className="btn admin-go-btn"
              title="Sign in with preselected account"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '40px', height: '40px', padding: 0, borderRadius: '50%', fontSize: '1.1rem' }}>
              <i className="fas fa-arrow-right"></i>
            </button>
          )}
        </div>
        {error && <div className="admin-status admin-status-error">{error}</div>}
      </div>
    </div>
  )
}

const COL_LABELS = {
  eventTitle: 'Event',
  ticketQty: 'Tickets',
  firstname: 'First Name',
  lastname: 'Last Name',
  totalAmount: 'Amount ($)',
  createdAtUtc: 'Date',
}

function formatCell(key, value) {
  if (key === 'createdAtUtc' && value) {
    const d = new Date(value)
    return isNaN(d) ? value : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  if (key === 'totalAmount' && value) return `$${parseFloat(value).toFixed(2)}`
  return value
}

function Reports() {
  const { user, signOut } = useAuth()
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortCol, setSortCol] = useState('')
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => {
    const url = import.meta.env.DEV ? '/data/reports.json' : '/api/sheets-report.php'
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error('Drive access is not working'); return r.json() })
      .then((json) => {
        setData(json)
        const allRows = Object.values(json.tabs || {}).flat()
        const events = [...new Set(allRows.map((r) => r.eventTitle).filter(Boolean))]
        if (events.length) setActiveTab(events[0])
      })
      .catch(() => setError('Drive access is not working. Please try again later.'))
      .finally(() => setLoading(false))
  }, [])

  if (!user) return <ReportsLogin />

  // Flatten all sheet rows, then group by eventTitle as tabs
  const allRows = data ? Object.values(data.tabs).flat() : []
  const eventTabs = [...new Set(allRows.map((r) => r.eventTitle).filter(Boolean))]
  const rows = allRows.filter((r) => r.eventTitle === activeTab)
  const displayColumns = rows.length ? Object.keys(rows[0]).filter((c) => c !== 'eventTitle') : []

  // Sorting
  const sortedRows = [...rows]
  if (sortCol) {
    sortedRows.sort((a, b) => {
      let va = a[sortCol] || '', vb = b[sortCol] || ''
      if (sortCol === 'totalAmount' || sortCol === 'ticketQty') {
        va = parseFloat(va) || 0; vb = parseFloat(vb) || 0
      }
      if (va < vb) return sortAsc ? -1 : 1
      if (va > vb) return sortAsc ? 1 : -1
      return 0
    })
  }

  // Summary stats for the active event tab
  const totalTickets = rows.reduce((s, r) => s + (parseInt(r.ticketQty, 10) || 0), 0)
  const totalAmount = rows.reduce((s, r) => s + (parseFloat(r.totalAmount) || 0), 0)
  const summary = { event: activeTab, orders: rows.length, totalTickets, totalAmount }

  function handleSort(col) {
    if (sortCol === col) { setSortAsc(!sortAsc) }
    else { setSortCol(col); setSortAsc(true) }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><i className="fas fa-chart-bar"></i> Reports Dashboard</h1>
        <div className="admin-badge">
          <img src={user.picture} alt="" width={28} height={28} style={{ borderRadius: '50%' }} />
          <span>{user.name}</span>
          <button className="admin-btn" onClick={signOut}>Sign Out</button>
        </div>
      </div>

      {loading && <div className="admin-status admin-status-info">Loading reports…</div>}
      {error && <div className="admin-status admin-status-error">{error}</div>}

      {data && (
        <>
          {/* Tab bar — one tab per unique eventTitle */}
          <div className="reports-tabs">
            {eventTabs.map((ev) => (
              <button key={ev} className={`reports-tab ${activeTab === ev ? 'reports-tab-active' : ''}`}
                onClick={() => { setActiveTab(ev); setSortCol(''); setSortAsc(true) }}>
                {ev}
              </button>
            ))}
          </div>

          {/* Summary card for the active event */}
          {rows.length > 0 && (
            <div className="reports-summary">
              <div className="reports-card">
                <h3>{summary.event}</h3>
                <div className="reports-card-stats">
                  <div><span className="reports-stat-value">{summary.orders}</span><span className="reports-stat-label">Orders</span></div>
                  <div><span className="reports-stat-value">{summary.totalTickets}</span><span className="reports-stat-label">Tickets</span></div>
                  <div><span className="reports-stat-value">${summary.totalAmount.toFixed(2)}</span><span className="reports-stat-label">Revenue</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Data table */}
          {rows.length > 0 ? (
            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {displayColumns.map((col) => (
                      <th key={col} onClick={() => handleSort(col)} style={{ cursor: 'pointer' }}>
                        {COL_LABELS[col] || col}
                        {sortCol === col && (sortAsc ? ' ▲' : ' ▼')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      {displayColumns.map((col) => (
                        <td key={col}>{formatCell(col, row[col])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-status admin-status-info">No data in this tab.</div>
          )}

          {data.metadata && (
            <p className="reports-meta">Last synced: {new Date(data.metadata.generated_at).toLocaleString()}</p>
          )}
        </>
      )}
    </div>
  )
}

export default Reports
