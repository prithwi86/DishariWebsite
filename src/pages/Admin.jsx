import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { CLOUD_NAME } from '../utils/cloudinary'

const INDENT = 2

function AdminLogin() {
  const { error, gsiReady, renderSignInButton, promptSignIn } = useAuth()
  const btnRef = useRef(null)

  useEffect(() => {
    if (gsiReady && btnRef.current) {
      renderSignInButton(btnRef.current)
    }
  }, [gsiReady, renderSignInButton])

  return (
    <div className="admin-page">
      <div className="admin-login">
        <i className="fas fa-lock admin-login-icon"></i>
        <h2>Admin Access</h2>
        <p>Sign in with your organization Google Workspace account to continue.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <div ref={btnRef} className="admin-google-btn"></div>
          {gsiReady && (
            <button
              type="button"
              onClick={promptSignIn}
              className="btn admin-go-btn"
              title="Sign in with preselected account"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                padding: 0,
                borderRadius: '50%',
                fontSize: '1.1rem',
              }}
            >
              <i className="fas fa-arrow-right"></i>
            </button>
          )}
        </div>
        {error && <div className="admin-status admin-status-error">{error}</div>}
      </div>
    </div>
  )
}

function Admin() {
  const { user, signOut } = useAuth()
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState('')
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [status, setStatus] = useState({ type: '', msg: '' })
  const [loading, setLoading] = useState(false)
  const editorRef = useRef(null)

  // Load file list from config
  useEffect(() => {
    fetch('/data/admin-files.json')
      .then((r) => r.json())
      .then((data) => setFiles(data.files || []))
      .catch(() => setStatus({ type: 'error', msg: 'Failed to load file list' }))
  }, [])

  // Load JSON when a file is selected
  async function loadFile(id) {
    if (!id) return
    setSelectedFile(id)
    setStatus({ type: 'info', msg: 'Loading…' })
    setLoading(true)
    try {
      const rawUrl = `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${encodeURIComponent(id)}`
      const res = await fetch(rawUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const formatted = JSON.stringify(data, null, INDENT)
      setContent(formatted)
      setOriginalContent(formatted)
      setStatus({ type: 'success', msg: `Loaded ${id}` })
    } catch (err) {
      setStatus({ type: 'error', msg: `Failed to load: ${err.message}` })
      setContent('')
      setOriginalContent('')
    } finally {
      setLoading(false)
    }
  }

  // Validate JSON
  function validate() {
    try {
      JSON.parse(content)
      return true
    } catch (err) {
      setStatus({ type: 'error', msg: `Invalid JSON: ${err.message}` })
      return false
    }
  }

  // Format / prettify
  function formatJson() {
    try {
      const parsed = JSON.parse(content)
      setContent(JSON.stringify(parsed, null, INDENT))
      setStatus({ type: 'success', msg: 'Formatted' })
    } catch (err) {
      setStatus({ type: 'error', msg: `Cannot format: ${err.message}` })
    }
  }

  // Save to Cloudinary
  // Dev: Vite middleware handles /api/cloudinary/upload
  // Prod: PHP endpoint at /api/cloudinary-upload.php
  const uploadUrl = import.meta.env.DEV ? '/api/cloudinary/upload' : '/api/cloudinary-upload.php'

  async function save() {
    if (!selectedFile) return
    if (!validate()) return

    setStatus({ type: 'info', msg: 'Saving…' })
    setLoading(true)
    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: selectedFile, content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setOriginalContent(content)
      setStatus({ type: 'success', msg: `Saved! Version: ${data.version}` })
    } catch (err) {
      setStatus({ type: 'error', msg: `Save failed: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  // Reset to original
  function revert() {
    setContent(originalContent)
    setStatus({ type: 'info', msg: 'Reverted to last loaded version' })
  }

  const hasChanges = content !== originalContent
  const lineCount = content ? content.split('\n').length : 0

  if (!user) return <AdminLogin />

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><i className="fas fa-code"></i> Cloudinary JSON Editor</h1>
        <div className="admin-user">
          <img src={user.picture} alt="" className="admin-avatar" referrerPolicy="no-referrer" />
          <span className="admin-user-name">{user.name}</span>
          <button onClick={signOut} className="admin-btn admin-btn-signout">
            <i className="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <select
          value={selectedFile}
          onChange={(e) => loadFile(e.target.value)}
          disabled={loading}
        >
          <option value="">— Select a file —</option>
          {files.map((f) => (
            <option key={f.id} value={f.id}>{f.label} ({f.id})</option>
          ))}
        </select>

        <div className="admin-actions">
          <button onClick={formatJson} disabled={!content || loading} className="admin-btn">
            <i className="fas fa-align-left"></i> Format
          </button>
          <button onClick={revert} disabled={!hasChanges || loading} className="admin-btn">
            <i className="fas fa-undo"></i> Revert
          </button>
          <button onClick={save} disabled={!hasChanges || loading} className="admin-btn admin-btn-save">
            <i className="fas fa-cloud-arrow-up"></i> Save to Cloudinary
          </button>
        </div>
      </div>

      {status.msg && (
        <div className={`admin-status admin-status-${status.type}`}>
          {status.msg}
        </div>
      )}

      <div className="admin-editor-wrapper">
        <div className="admin-line-numbers">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={editorRef}
          className="admin-editor"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          placeholder="Select a file to start editing…"
          disabled={loading}
          onKeyDown={(e) => {
            // Tab inserts spaces instead of moving focus
            if (e.key === 'Tab') {
              e.preventDefault()
              const { selectionStart, selectionEnd } = e.target
              const spaces = ' '.repeat(INDENT)
              const updated = content.substring(0, selectionStart) + spaces + content.substring(selectionEnd)
              setContent(updated)
              requestAnimationFrame(() => {
                e.target.selectionStart = e.target.selectionEnd = selectionStart + INDENT
              })
            }
          }}
        />
      </div>

      <div className="admin-footer">
        {selectedFile && <span>Editing: <strong>{selectedFile}</strong></span>}
        <span>{lineCount} lines</span>
        {hasChanges && <span className="admin-unsaved">● Unsaved changes</span>}
      </div>
    </div>
  )
}

export default Admin
