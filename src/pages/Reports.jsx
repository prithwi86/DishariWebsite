import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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

const EVENT_COLORS = [
  { accent: '#6366f1', bg: 'rgba(99,102,241,0.12)', glow: 'rgba(99,102,241,0.25)' },   // indigo
  { accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)', glow: 'rgba(245,158,11,0.25)' },    // amber
  { accent: '#10b981', bg: 'rgba(16,185,129,0.12)', glow: 'rgba(16,185,129,0.25)' },    // emerald
  { accent: '#ef4444', bg: 'rgba(239,68,68,0.12)', glow: 'rgba(239,68,68,0.25)' },      // red
  { accent: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', glow: 'rgba(139,92,246,0.25)' },    // violet
  { accent: '#06b6d4', bg: 'rgba(6,182,212,0.12)', glow: 'rgba(6,182,212,0.25)' },      // cyan
  { accent: '#ec4899', bg: 'rgba(236,72,153,0.12)', glow: 'rgba(236,72,153,0.25)' },    // pink
]

function formatCell(key, value) {
  if (key === 'createdAtUtc' && value) {
    const d = new Date(value)
    return isNaN(d) ? value : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  }
  if (key === 'totalAmount' && value) return `$${parseFloat(value).toFixed(2)}`
  return value
}

function Reports() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortCol, setSortCol] = useState('')
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => {
    if (!user) return

    const url = import.meta.env.DEV ? '/data/reports.json' : '/api/sheets-report.php'
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error('Drive access is not working'); return r.json() })
      .then((json) => {
        setData(json)
        const allRows = Object.values(json.tabs || {}).flat()
        const events = [...new Set(allRows.map((r) => r.eventTitle).filter(Boolean))]
        if (events.length) setActiveTab(events[0])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

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
      } else if (sortCol === 'createdAtUtc') {
        va = new Date(va).getTime() || 0; vb = new Date(vb).getTime() || 0
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

  const activeColorIndex = eventTabs.indexOf(activeTab)
  const activeColor = EVENT_COLORS[activeColorIndex % EVENT_COLORS.length] || EVENT_COLORS[0]

  function handleSort(col) {
    if (sortCol === col) { setSortAsc(!sortAsc) }
    else { setSortCol(col); setSortAsc(true) }
  }

  return (
    <div className="rpt-page">
      {/* Header */}
      <div className="rpt-header glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="rpt-btn-signout dash-back-btn" onClick={() => navigate('/dashboard')}><i className="fas fa-arrow-left"></i> Dashboard</button>
          <h1><i className="fas fa-chart-bar"></i> Reports Dashboard</h1>
        </div>
        <div className="rpt-user">
          <img src={user.picture} alt="" width={30} height={30} />
          <span>{user.name}</span>
          <button className="rpt-btn-signout" onClick={signOut}><i className="fas fa-sign-out-alt"></i> Sign Out</button>
        </div>
      </div>

      {loading && <div className="admin-status admin-status-info">Loading reports…</div>}
      {error && <div className="admin-status admin-status-error">{error}</div>}

      {data && (
        <div className="rpt-body">
          {/* Sidebar */}
          <aside className="rpt-sidebar glass">
            <h3 className="rpt-sidebar-title">Events</h3>
            {eventTabs.map((ev, i) => {
              const c = EVENT_COLORS[i % EVENT_COLORS.length]
              const isActive = activeTab === ev
              return (
                <button key={ev}
                  className={`rpt-sidebar-tab ${isActive ? 'rpt-sidebar-tab-active' : ''}`}
                  style={{
                    '--tab-accent': c.accent,
                    '--tab-bg': c.bg,
                    '--tab-glow': c.glow,
                  }}
                  onClick={() => { setActiveTab(ev); setSortCol(''); setSortAsc(true) }}>
                  <span className="rpt-tab-dot" style={{ background: c.accent }}></span>
                  <span className="rpt-tab-label">{ev}</span>
                </button>
              )
            })}
            {data.metadata && (
              <p className="rpt-sidebar-meta">Synced {new Date(data.metadata.generated_at).toLocaleString()}</p>
            )}
          </aside>

          {/* Main content */}
          <main className="rpt-main">
            {/* Summary cards */}
            {rows.length > 0 && (
              <div className="rpt-stats-row">
                <div className="rpt-stat-card glass" style={{ '--card-accent': activeColor.accent, '--card-glow': activeColor.glow }}>
                  <i className="fas fa-shopping-cart"></i>
                  <div className="rpt-stat-data">
                    <span className="rpt-stat-num">{summary.orders}</span>
                    <span className="rpt-stat-lbl">Orders</span>
                  </div>
                </div>
                <div className="rpt-stat-card glass" style={{ '--card-accent': activeColor.accent, '--card-glow': activeColor.glow }}>
                  <i className="fas fa-ticket-alt"></i>
                  <div className="rpt-stat-data">
                    <span className="rpt-stat-num">{summary.totalTickets}</span>
                    <span className="rpt-stat-lbl">Tickets</span>
                  </div>
                </div>
                <div className="rpt-stat-card glass" style={{ '--card-accent': activeColor.accent, '--card-glow': activeColor.glow }}>
                  <i className="fas fa-dollar-sign"></i>
                  <div className="rpt-stat-data">
                    <span className="rpt-stat-num">${summary.totalAmount.toFixed(2)}</span>
                    <span className="rpt-stat-lbl">Revenue</span>
                  </div>
                </div>
              </div>
            )}

            {/* Data table */}
            {rows.length > 0 ? (
              <div className="rpt-table-wrap glass">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      {displayColumns.map((col) => (
                        <th key={col} onClick={() => handleSort(col)}>
                          {COL_LABELS[col] || col}
                          {sortCol === col && <span className="rpt-sort-icon">{sortAsc ? ' ▲' : ' ▼'}</span>}
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
              <div className="rpt-empty glass">No data for this event.</div>
            )}
          </main>
        </div>
      )}
    </div>
  )
}

export default Reports
