import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function DashboardLogin() {
  const { error, gsiReady, renderSignInButton, promptSignIn } = useAuth()
  const btnRef = useRef(null)

  useEffect(() => {
    if (gsiReady && btnRef.current) renderSignInButton(btnRef.current)
  }, [gsiReady, renderSignInButton])

  return (
    <div className="dash-page">
      <div className="dash-login glass">
        <i className="fas fa-lock dash-login-icon"></i>
        <h2>Sign In</h2>
        <p>Sign in with your organization Google Workspace account to continue.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <div ref={btnRef}></div>
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

function Dashboard() {
  const { user, signOut } = useAuth()
  const [adminAllowed, setAdminAllowed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    fetch('/data/web-admin.json')
      .then((r) => r.ok ? r.json() : { emails: [] })
      .then((al) => {
        const emails = (al.emails || []).map((e) => e.toLowerCase())
        setAdminAllowed(!emails.length || emails.includes(user.email.toLowerCase()))
      })
      .catch(() => setAdminAllowed(true))
      .finally(() => setLoaded(true))
  }, [user])

  if (!user) return <DashboardLogin />

  return (
    <div className="dash-page">
      <div className="dash-header glass">
        <div className="dash-user-info">
          <img src={user.picture} alt="" className="dash-avatar" referrerPolicy="no-referrer" />
          <div>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
        </div>
        <button className="rpt-btn-signout" onClick={signOut}><i className="fas fa-sign-out-alt"></i> Sign Out</button>
      </div>

      <h3 className="dash-section-title">What would you like to do?</h3>

      <div className="dash-cards">
        {/* Website Config (Admin) */}
        <button
          className={`dash-card dash-card-admin glass ${!loaded ? 'dash-card-loading' : ''} ${loaded && !adminAllowed ? 'dash-card-disabled' : ''}`}
          onClick={() => { if (adminAllowed && loaded) navigate('/admin') }}
          disabled={!loaded || !adminAllowed}
        >
          <div className="dash-card-icon">
            <i className="fas fa-cog"></i>
          </div>
          <h4>Website Config</h4>
          <p>Edit JSON configuration files, manage content, and update site settings on Cloudinary.</p>
          {loaded && !adminAllowed && (
            <span className="dash-card-badge"><i className="fas fa-lock"></i> Restricted</span>
          )}
        </button>

        {/* Reports */}
        <button
          className="dash-card dash-card-reports glass"
          onClick={() => navigate('/reports')}
        >
          <div className="dash-card-icon">
            <i className="fas fa-chart-bar"></i>
          </div>
          <h4>Reports Dashboard</h4>
          <p>View event registrations, ticket sales, and revenue data from Zeffy via Google Sheets.</p>
        </button>
      </div>
    </div>
  )
}

export default Dashboard
