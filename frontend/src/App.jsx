import { useEffect, useId, useMemo, useState } from 'react'
import './App.css'
import PublicPortal from './pages/PublicPortal.jsx'
import sirtlyLogo from './assets/Logo Sirtly.png'

const ROLE_LABELS = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  jefe_empresa: 'Jefe de empresa',
  tecnico: 'Técnico',
  empleado: 'Empleado',
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Crítica' },
]

const ADMIN_MENU = [
  { key: 'admin-empresas', label: 'Empresas', icon: 'building' },
  { key: 'admin-jefes', label: 'Jefes de empresa', icon: 'briefcase' },
  { key: 'admin-admins', label: 'Administradores', icon: 'shield' },
  { key: 'admin-supervisores', label: 'Supervisores', icon: 'eye' },
  { key: 'admin-estadisticas', label: 'Estadísticas', icon: 'chart' },
]

const SUPERVISOR_MENU = [
  { key: 'sup-empresas', label: 'Empresas', icon: 'building' },
  { key: 'sup-estadisticas', label: 'Estadísticas', icon: 'chart' },
]

const JEFE_MENU = [
  { key: 'jefe-dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'jefe-empleados', label: 'Empleados', icon: 'users' },
  { key: 'jefe-tecnicos', label: 'Técnicos', icon: 'tool' },
  { key: 'jefe-incidencias', label: 'Incidencias', icon: 'file' },
  { key: 'jefe-estadisticas', label: 'Estadísticas', icon: 'chart' },
  { key: 'jefe-config', label: 'Configuración', icon: 'settings' },
]

const EMPLEADO_MENU = [
  { key: 'emp-dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'emp-mis', label: 'Mis incidencias', icon: 'file' },
  { key: 'emp-crear', label: 'Crear incidencia', icon: 'plus' },
]

const TECNICO_MENU = [
  { key: 'tec-dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'tec-disponibles', label: 'Disponibles', icon: 'file' },
  { key: 'tec-asignadas', label: 'Mis incidencias', icon: 'file' },
]

const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')
const API_ROOT = API_BASE.replace('/api', '')
const LICENSE_SOURCE_URL = 'https://github.com/paugmx11/SIrtly/blob/main/LICENSE'
const LICENSE_ASSETS_URL = 'https://github.com/paugmx11/SIrtly/blob/main/LICENSE-ASSETS.md'
const PHONE_PATTERN = '^\\+?[0-9\\s()\\-]{7,20}$'
const CIF_PATTERN = '^[A-Za-z0-9\\-]{5,20}$'
const COLOR_PRESETS = [
  ['#2D61E5', '#7C3AED'],
  ['#0F766E', '#14B8A6'],
  ['#B45309', '#F97316'],
  ['#BE123C', '#F43F5E'],
  ['#334155', '#64748B'],
  ['#166534', '#22C55E'],
]
const SESSION_STORAGE_KEY = 'sirtly.session'
const ROLE_DEFAULT_VIEWS = {
  admin: 'admin-empresas',
  supervisor: 'sup-empresas',
  jefe_empresa: 'jefe-dashboard',
  empleado: 'emp-dashboard',
  tecnico: 'tec-dashboard',
}

function App() {
  const savedSession = readStoredSession()
  const [token, setToken] = useState(savedSession.token || '')
  const [user, setUser] = useState(savedSession.user || null)
  const [role, setRole] = useState(savedSession.role || 'admin')
  const [view, setView] = useState(savedSession.view || 'admin-dashboard')
  const [publicView, setPublicView] = useState('welcome')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedIncidentId, setSelectedIncidentId] = useState(savedSession.selectedIncidentId || null)
  const [selectedUser, setSelectedUser] = useState(savedSession.selectedUser || null)
  const [selectedUserSource, setSelectedUserSource] = useState(savedSession.selectedUserSource || null)
  const [selectedCompany, setSelectedCompany] = useState(savedSession.selectedCompany || null)
  const [notifications, setNotifications] = useState([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  })
  const [toasts, setToasts] = useState([])

  const [data, setData] = useState({
    companies: [],
    users: [],
    incidents: [],
    statsSystem: null,
    statsCompany: null,
    byCompany: [],
    byTechnician: [],
    settings: savedSession.settings || null,
    comments: [],
    attachments: [],
  })

  const menu = useMemo(() => {
    if (role === 'admin') return ADMIN_MENU
    if (role === 'supervisor') return SUPERVISOR_MENU
    if (role === 'jefe_empresa') return JEFE_MENU
    if (role === 'empleado') return EMPLEADO_MENU
    return TECNICO_MENU
  }, [role])
  const activeView = token && !isValidViewForRole(view, role) ? defaultViewForRole(role) : view

  const currentBranding = token && (role === 'jefe_empresa' || role === 'empleado' || role === 'tecnico') ? data.settings : null
  const brandPrimary = currentBranding?.primary_color || '#2563eb'
  const brandSecondary = currentBranding?.secondary_color || '#7c3aed'
  const brandName = currentBranding?.system_name?.trim() || 'Sirtly'
  const brandLogo = currentBranding?.logo ? `${API_ROOT}/storage/${currentBranding.logo}` : null
  const brandFavicon = currentBranding?.favicon ? `${API_ROOT}/storage/${currentBranding.favicon}` : null

  useEffect(() => {
    const pageTitle = currentBranding?.system_name?.trim() || 'Sirtly'
    document.title = pageTitle

    let link = document.querySelector("link[rel='icon']")
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'icon')
      document.head.appendChild(link)
    }
    link.setAttribute('href', brandFavicon || sirtlyLogo)
  }, [currentBranding, brandFavicon])

  useEffect(() => {
    persistSession({
      token,
      user,
      role,
      view,
      settings: data.settings,
      selectedIncidentId,
      selectedUser,
      selectedUserSource,
      selectedCompany,
    })
  }, [token, user, role, view, data.settings, selectedIncidentId, selectedUser, selectedUserSource, selectedCompany])

  const showToast = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((prev) => [...prev, { id, type, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3600)
  }

  const notifySuccess = (message) => showToast('success', message)
  const notifyError = (message) => showToast('error', message)

  const runAction = async (action, options = {}) => {
    try {
      const result = await action()
      if (result !== false && options.successMessage) {
        notifySuccess(options.successMessage)
      }
      return result
    } catch (error) {
      notifyError(options.errorMessage || error.message || 'Ha ocurrido un error')
      return null
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')

    if (!email && !password) {
      notifyError('Introduce tu email y tu contraseña para iniciar sesión')
      return
    }
    if (!email) {
      notifyError('El email es obligatorio para iniciar sesión')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notifyError('Introduce un email valido')
      return
    }
    if (!password) {
      notifyError('La contraseña es obligatoria para iniciar sesión')
      return
    }

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const payload = normalizeApiData(await res.json().catch(() => null))

    if (!res.ok) {
      const firstFieldError = payload?.errors ? Object.values(payload.errors)[0]?.[0] : null
      const apiMessage = payload?.message === 'Invalid credentials.'
        ? 'Credenciales incorrectas'
        : payload?.message
      notifyError(firstFieldError || apiMessage || 'No existe ninguna cuenta con esas credenciales')
      return
    }

    setToken(payload.token)
    setUser(payload.user)
    const nextRole = payload.user?.role?.name || 'admin'
    setRole(nextRole)
    setView(defaultViewForRole(nextRole))
    setPublicView('welcome')
    notifySuccess('Sesión iniciada correctamente')
  }

  const apiFetch = async (path, options = {}) => {
    const isFormData = options.body instanceof FormData
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        'Accept': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    })
    const text = await res.text()
    let payload = null
    try {
      payload = text ? JSON.parse(text) : null
    } catch {
      payload = null
    }

    if (!res.ok) {
      const firstFieldError = payload?.errors ? Object.values(payload.errors)[0]?.[0] : null
      throw new Error(firstFieldError || payload?.message || 'Request failed')
    }

    return normalizeApiData(payload)
  }

  const loadAll = async () => {
    if (!token) return

    const updates = { ...data }

    try {
      if (role === 'admin' || role === 'supervisor') {
        updates.companies = (await apiFetch('/companies')).companies || []
        updates.statsSystem = (await apiFetch('/stats/system'))
        updates.byCompany = (await apiFetch('/stats/by-company')).by_company || []
      }
      if (role === 'admin' || role === 'jefe_empresa') {
        updates.users = (await apiFetch('/users')).users || []
      }
      if (role === 'jefe_empresa') {
        updates.statsCompany = (await apiFetch('/stats/company'))
        updates.byTechnician = (await apiFetch('/stats/by-technician')).by_technician || []
      }
      if (role === 'jefe_empresa' || role === 'empleado' || role === 'tecnico') {
        updates.settings = (await apiFetch('/company-settings')).settings || null
        updates.incidents = (await apiFetch('/incidents')).incidents || []
      } else {
        updates.incidents = []
      }
      setNotifications((await apiFetch('/notifications')).notifications || [])
    } catch (e) {
      // ignore
    }

    setData(updates)
  }

  useEffect(() => {
    if (token) {
      loadAll()
      if (!isValidViewForRole(view, role)) {
        setView(defaultViewForRole(role))
      }
    }
  }, [token, role, view])

  useEffect(() => {
    setSidebarOpen(false)
    setNotificationsOpen(false)
    setProfileMenuOpen(false)
  }, [view, token, role])

  const resetSession = () => {
    setUser(null)
    setRole('admin')
    setView('admin-dashboard')
    setSelectedIncidentId(null)
    setSelectedUser(null)
    setSelectedUserSource(null)
    setSelectedCompany(null)
      setData({
      companies: [],
      users: [],
      incidents: [],
      statsSystem: null,
      statsCompany: null,
      byCompany: [],
      byTechnician: [],
    settings: null,
      comments: [],
      attachments: [],
    })
    setToken('')
    clearStoredSession()
  }

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {
      // Ignore logout errors and close the local session anyway.
    }
    setProfileMenuOpen(false)
    setPasswordModalOpen(false)
    setPublicView('login')
    resetSession()
  }

  const handlePasswordChange = (key, value) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }))
  }

  const closePasswordModal = () => {
    setPasswordModalOpen(false)
    setPasswordForm({
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    })
  }

  const submitPasswordChange = async (e) => {
    e.preventDefault()

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.new_password_confirmation) {
      notifyError('Completa todos los campos para actualizar la contraseña')
      return
    }

    if (passwordForm.new_password.length < 8) {
      notifyError('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }

    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      notifyError('La confirmación de contraseña no coincide')
      return
    }

    setPasswordSaving(true)
    try {
      await apiFetch('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify(passwordForm),
      })
      notifySuccess('Contraseña actualizada correctamente')
      closePasswordModal()
      setProfileMenuOpen(false)
    } catch (error) {
      notifyError(error.message || 'No se pudo actualizar la contraseña')
    } finally {
      setPasswordSaving(false)
    }
  }

  if (!token) {
    return (
      <>
        <ToastViewport toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))} />
        <PublicPortal
          initialView={publicView}
          onPublicViewChange={setPublicView}
          onLogin={handleLogin}
          notifyError={notifyError}
          onContactSubmit={async (payload) => {
            const res = await fetch(API_BASE + '/contact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify(payload),
            })

            const response = normalizeApiData(await res.json().catch(() => null))
            if (!res.ok) {
              const firstFieldError = response?.errors ? Object.values(response.errors)[0]?.[0] : null
              notifyError(firstFieldError || response?.message || 'No se pudo enviar el formulario')
              return
            }

            notifySuccess('Formulario enviado')
          }}
        />
      </>
    )
  }

  const activeKey = resolveActiveKey(activeView, selectedUserSource)
  const profileName = `${user?.name || ''} ${user?.last_name || ''}`.trim() || 'Usuario'
  const unreadCount = notifications.filter((n) => !n.read_at).length

  const markNotificationRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'POST' })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
    } catch {
      notifyError('No se pudo marcar la notificación como leída')
    }
  }

  const markAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' })
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
      notifySuccess('Notificaciones marcadas como leídas')
    } catch {
      notifyError('No se pudieron actualizar las notificaciones')
    }
  }

  return (
    <div className="app" style={{ '--brand-primary': brandPrimary, '--brand-secondary': brandSecondary }}>
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <BrandLogo brandLogo={brandLogo} brandName={brandName} product={!brandLogo && brandName === 'Sirtly'} />
          <div>
            <div className="brand-title">{brandName}</div>
            <div className="brand-sub">{ROLE_LABELS[role]}</div>
          </div>
        </div>
        <nav className="sidebar__nav">
          {menu.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav-item ${activeKey === item.key ? 'active' : ''}`}
              aria-current={activeKey === item.key ? 'page' : undefined}
              onClick={() => setView(item.key)}
            >
              <span className={`icon icon--${item.icon}`} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar__footer">
          <div className="avatar">{profileName[0]}</div>
          <div>
            <div className="profile-name">{profileName}</div>
            <div className="profile-role">{ROLE_LABELS[role]}</div>
          </div>
        </div>
        <div className="sidebar__licenses" aria-label="Licencias del proyecto">
          <span>Licencias:</span>
          <a href={LICENSE_SOURCE_URL} target="_blank" rel="noopener noreferrer">MIT (código)</a>
          <a href={LICENSE_ASSETS_URL} target="_blank" rel="noopener noreferrer">CC BY-NC 4.0 (documentación/assets)</a>
        </div>
      </aside>
      {sidebarOpen && <button type="button" className="sidebar-overlay" aria-label="Cerrar menú lateral" onClick={() => setSidebarOpen(false)} />}

      <div className="content">
        <header className="topbar">
          <div className="topbar__leading">
            <button
              type="button"
              className="hamburger"
              aria-label="Abrir menú"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              <span />
              <span />
              <span />
            </button>
            <div className="topbar__title">{resolveTitle(activeView)}</div>
          </div>
          <div className="topbar__actions">
            <div className="notifications">
              <button
                type="button"
                className="bell"
                title={`${notifications.length} notificaciones`}
                aria-label={`Abrir notificaciones. ${unreadCount} sin leer`}
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen((v) => !v)
                  setProfileMenuOpen(false)
                }}
              >
                <span className="bell__icon" aria-hidden="true">🔔</span>
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>
              {notificationsOpen && (
                <div className="notifications__panel">
                  <div className="notifications__header">
                    <span>Notificaciones</span>
                    <button type="button" className="link" onClick={markAllRead}>Marcar todo leído</button>
                  </div>
                  {notifications.length === 0 && <div className="muted">Sin notificaciones</div>}
                  <ul>
                    {notifications.map((n) => (
                      <li key={n.id} className={n.read_at ? '' : 'unread'}>
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-body">{n.body}</div>
                        <div className="notif-meta">
                          <span>{formatDate(n.created_at)}</span>
                          {!n.read_at && <button type="button" className="link" onClick={() => markNotificationRead(n.id)}>Marcar leído</button>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="profile-menu">
              <button
                type="button"
                className="profile-menu__trigger"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                onClick={() => {
                  setProfileMenuOpen((prev) => !prev)
                  setNotificationsOpen(false)
                }}
              >
                <div className="avatar">{profileName[0]}</div>
                <div className="profile-menu__summary">
                  <span className="profile-menu__name">{profileName}</span>
                  <span className="profile-menu__role">{ROLE_LABELS[role]}</span>
                </div>
                <span className="profile-menu__chevron" aria-hidden="true">▾</span>
              </button>
              {profileMenuOpen && (
                <>
                  <button type="button" className="profile-menu__overlay" aria-label="Cerrar menú de perfil" onClick={() => setProfileMenuOpen(false)} />
                  <div className="profile-menu__panel" role="menu" aria-label="Opciones de perfil">
                    <div className="profile-menu__panel-header">
                      <strong>{profileName}</strong>
                      <span>{ROLE_LABELS[role]}</span>
                    </div>
                    <button
                      type="button"
                      className="profile-menu__item"
                      role="menuitem"
                      onClick={() => {
                        setPasswordModalOpen(true)
                        setProfileMenuOpen(false)
                      }}
                    >
                      Cambiar contraseña
                    </button>
                    <button type="button" className="profile-menu__item profile-menu__item--danger" role="menuitem" onClick={handleLogout}>
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <ToastViewport toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))} />

        <main className="main">
          {renderView(activeView, role, setView, {
            data,
            setSelectedIncidentId,
            selectedIncidentId,
            apiFetch,
            runAction,
            loadAll,
            selectedUser,
            setSelectedUser,
            selectedUserSource,
            setSelectedUserSource,
            selectedCompany,
            setSelectedCompany,
            notifications,
            setNotifications,
            currentUser: user,
            notifySuccess,
            notifyError,
          })}
        </main>
        {passwordModalOpen && (
          <div className="assignment-modal-overlay" role="presentation" onClick={closePasswordModal}>
            <div className="assignment-modal" role="dialog" aria-modal="true" aria-labelledby="password-modal-title" onClick={(e) => e.stopPropagation()}>
              <div className="assignment-modal__header">
                <div>
                  <h4 id="password-modal-title">Cambiar contraseña</h4>
                  <p>Actualiza tu contraseña para mejorar la seguridad de tu cuenta.</p>
                </div>
                <button
                  type="button"
                  className="assignment-modal__close"
                  aria-label="Cerrar diálogo"
                  onClick={closePasswordModal}
                  disabled={passwordSaving}
                >
                  ×
                </button>
              </div>

              <form onSubmit={submitPasswordChange}>
                <label className="assignment-modal__label" htmlFor="current-password">Contraseña actual</label>
                <input
                  id="current-password"
                  className="assignment-modal__input"
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.current_password}
                  onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                />

                <label className="assignment-modal__label" htmlFor="new-password">Nueva contraseña</label>
                <input
                  id="new-password"
                  className="assignment-modal__input"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.new_password}
                  onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                />

                <label className="assignment-modal__label" htmlFor="new-password-confirmation">Confirmar nueva contraseña</label>
                <input
                  id="new-password-confirmation"
                  className="assignment-modal__input"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.new_password_confirmation}
                  onChange={(e) => handlePasswordChange('new_password_confirmation', e.target.value)}
                />

                <div className="assignment-modal__actions">
                  <button type="button" className="assignment-modal__secondary" onClick={closePasswordModal} disabled={passwordSaving}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn assignment-modal__primary" disabled={passwordSaving}>
                    {passwordSaving ? 'Guardando...' : 'Actualizar contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function resolveTitle(view) {
  const titles = {
    'admin-dashboard': 'Dashboard',
    'admin-empresas': 'Empresas',
    'admin-empresas-create': 'Crear empresa',
    'admin-empresas-edit': 'Editar empresa',
    'admin-jefes': 'Jefes de empresa',
    'admin-jefes-create': 'Crear jefe de empresa',
    'admin-admins': 'Administradores',
    'admin-admins-create': 'Crear administrador',
    'admin-supervisores': 'Supervisores',
    'admin-supervisores-create': 'Crear supervisor',
    'admin-user-edit': 'Editar usuario',
    'admin-estadisticas': 'Estadísticas',
    'sup-dashboard': 'Dashboard',
    'sup-estadisticas': 'Estadísticas',
    'sup-empresas': 'Empresas',
    'jefe-dashboard': 'Dashboard',
    'jefe-empleados': 'Empleados',
    'jefe-empleados-create': 'Crear empleado',
    'jefe-empleados-edit': 'Editar empleado',
    'jefe-tecnicos': 'Técnicos',
    'jefe-tecnicos-create': 'Crear técnico',
    'jefe-tecnicos-edit': 'Editar técnico',
    'jefe-incidencias': 'Incidencias',
    'jefe-incidencias-edit': 'Editar incidencia',
    'jefe-estadisticas': 'Estadísticas',
    'jefe-config': 'Configuración de empresa',
    'emp-dashboard': 'Dashboard',
    'emp-mis': 'Mis incidencias',
    'emp-crear': 'Crear incidencia',
    'emp-edit': 'Editar incidencia',
    'tec-dashboard': 'Dashboard',
    'tec-disponibles': 'Incidencias disponibles',
    'tec-asignadas': 'Mis incidencias',
    'tec-gestionar': 'Gestionar incidencia',
  }
  return titles[view] || 'Dashboard'
}

function resolveActiveKey(view, selectedUserSource) {
  const map = {
    'admin-empresas-create': 'admin-empresas',
    'admin-empresas-edit': 'admin-empresas',
    'admin-jefes-create': 'admin-jefes',
    'admin-admins-create': 'admin-admins',
    'admin-supervisores-create': 'admin-supervisores',
    'admin-user-edit': selectedUserSource || 'admin-jefes',
    'jefe-empleados-create': 'jefe-empleados',
    'jefe-empleados-edit': 'jefe-empleados',
    'jefe-tecnicos-create': 'jefe-tecnicos',
    'jefe-tecnicos-edit': 'jefe-tecnicos',
    'jefe-incidencias-edit': 'jefe-incidencias',
    'emp-edit': 'emp-mis',
    'tec-gestionar': selectedUserSource || 'tec-asignadas',
  }
  return map[view] || view
}

function renderView(view, role, onNavigate, ctx) {
  const { data, setSelectedIncidentId, selectedIncidentId, apiFetch, runAction, loadAll, selectedUser, setSelectedUser, selectedUserSource, setSelectedUserSource, selectedCompany, setSelectedCompany, notifications, currentUser, notifyError } = ctx
  if (role === 'admin') {
    if (view === 'admin-dashboard') return <AdminDashboard stats={data.statsSystem} incidents={data.incidents} />
    if (view === 'admin-estadisticas') return <AdminEstadisticas stats={data.statsSystem} />
    if (view === 'admin-empresas') return <EmpresasList data={data.companies} onCreate={() => onNavigate('admin-empresas-create')} onEdit={(company) => { setSelectedCompany(company); onNavigate('admin-empresas-edit') }} />
    if (view === 'admin-empresas-create') return <CrearEmpresa notifyError={notifyError} onBack={() => onNavigate('admin-empresas')} onCreate={(payload) => runAction(async () => { await apiFetch('/companies', { method: 'POST', body: JSON.stringify(payload) }); await loadAll(); onNavigate('admin-empresas'); }, { successMessage: 'Empresa creada correctamente' })} />
    if (view === 'admin-empresas-edit') return <EditarEmpresa notifyError={notifyError} company={selectedCompany} onBack={() => onNavigate('admin-empresas')} onSave={(payload) => runAction(async () => { await apiFetch(`/companies/${selectedCompany.id}`, { method: 'PUT', body: JSON.stringify(payload) }); await loadAll(); onNavigate('admin-empresas'); }, { successMessage: 'Empresa actualizada correctamente' })} />
    if (view === 'admin-jefes') return <JefesList
      users={data.users}
      onCreate={() => onNavigate('admin-jefes-create')}
      onEdit={(u) => { setSelectedUser(u); setSelectedUserSource('admin-jefes'); onNavigate('admin-user-edit'); }}
      onDelete={(u) => runAction(async () => { if (!confirm('¿Eliminar usuario?')) return false; await apiFetch(`/users/${u.id}`, { method: 'DELETE' }); await loadAll(); }, { successMessage: 'Usuario eliminado correctamente' })}
    />
    if (view === 'admin-jefes-create') return <CrearJefe notifyError={notifyError} companies={data.companies} onBack={() => onNavigate('admin-jefes')} onCreate={(payload) => runAction(async () => { await apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) }); await loadAll(); onNavigate('admin-jefes'); }, { successMessage: 'Jefe de empresa creado correctamente' })} />
    if (view === 'admin-admins') return <AdminsList
      users={data.users}
      onCreate={() => onNavigate('admin-admins-create')}
      onEdit={(u) => { setSelectedUser(u); setSelectedUserSource('admin-admins'); onNavigate('admin-user-edit'); }}
      onDelete={(u) => runAction(async () => { if (!confirm('¿Eliminar usuario?')) return false; await apiFetch(`/users/${u.id}`, { method: 'DELETE' }); await loadAll(); }, { successMessage: 'Usuario eliminado correctamente' })}
    />
    if (view === 'admin-admins-create') return <CrearAdmin notifyError={notifyError} onBack={() => onNavigate('admin-admins')} onCreate={(payload) => runAction(async () => { await apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) }); await loadAll(); onNavigate('admin-admins'); }, { successMessage: 'Administrador creado correctamente' })} />
    if (view === 'admin-supervisores') return <SupervisoresList
      users={data.users}
      onCreate={() => onNavigate('admin-supervisores-create')}
      onEdit={(u) => { setSelectedUser(u); setSelectedUserSource('admin-supervisores'); onNavigate('admin-user-edit'); }}
      onDelete={(u) => runAction(async () => { if (!confirm('¿Eliminar usuario?')) return false; await apiFetch(`/users/${u.id}`, { method: 'DELETE' }); await loadAll(); }, { successMessage: 'Usuario eliminado correctamente' })}
    />
    if (view === 'admin-user-edit') return <EditarUsuario
      notifyError={notifyError}
      user={selectedUser}
      settings={data.settings}
      onBack={() => onNavigate(selectedUserSource || 'admin-jefes')}
      onSave={(payload) => runAction(async () => { await apiFetch(`/users/${selectedUser.id}`, { method: 'PUT', body: JSON.stringify(payload) }); await loadAll(); onNavigate(selectedUserSource || 'admin-jefes'); }, { successMessage: 'Usuario actualizado correctamente' })}
    />
    if (view === 'admin-supervisores-create') return <CrearSupervisor notifyError={notifyError} onBack={() => onNavigate('admin-supervisores')} onCreate={(payload) => runAction(async () => { await apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) }); await loadAll(); onNavigate('admin-supervisores'); }, { successMessage: 'Supervisor creado correctamente' })} />
  }
  if (role === 'supervisor') {
    if (view === 'sup-dashboard') return <SupervisorDashboard stats={data.statsSystem} incidents={data.incidents} />
    if (view === 'sup-estadisticas') return <SupervisorEstadisticas stats={data.statsSystem} />
    if (view === 'sup-empresas') return <EmpresasList data={data.companies} readonly />
  }
  if (role === 'jefe_empresa') {
    if (view === 'jefe-dashboard') return <JefeDashboard stats={data.statsCompany} incidents={data.incidents} />
    if (view === 'jefe-empleados') return <EmpleadosList
      users={data.users}
      onCreate={() => onNavigate('jefe-empleados-create')}
      onEdit={(u) => { setSelectedUser(u); onNavigate('jefe-empleados-edit'); }}
      onDelete={(u) => runAction(async () => { if (!confirm('¿Eliminar usuario?')) return false; await apiFetch(`/users/${u.id}`, { method: 'DELETE' }); await loadAll(); }, { successMessage: 'Usuario eliminado correctamente' })}
    />
    if (view === 'jefe-empleados-create') return <CrearEmpleado notifyError={notifyError} settings={data.settings} onBack={() => onNavigate('jefe-empleados')} onCreate={(payload) => runAction(async () => { await apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) }); await loadAll(); onNavigate('jefe-empleados'); }, { successMessage: 'Empleado creado correctamente' })} />
    if (view === 'jefe-empleados-edit') return <EditarUsuario notifyError={notifyError} settings={data.settings} user={selectedUser} onBack={() => onNavigate('jefe-empleados')} onSave={(payload) => runAction(async () => { await apiFetch(`/users/${selectedUser.id}`, { method: 'PUT', body: JSON.stringify(payload) }); await loadAll(); onNavigate('jefe-empleados'); }, { successMessage: 'Empleado actualizado correctamente' })} />
    if (view === 'jefe-tecnicos') return <TecnicosList
      users={data.users}
      onCreate={() => onNavigate('jefe-tecnicos-create')}
      onEdit={(u) => { setSelectedUser(u); onNavigate('jefe-tecnicos-edit'); }}
      onDelete={(u) => runAction(async () => { if (!confirm('¿Eliminar usuario?')) return false; await apiFetch(`/users/${u.id}`, { method: 'DELETE' }); await loadAll(); }, { successMessage: 'Usuario eliminado correctamente' })}
    />
    if (view === 'jefe-tecnicos-create') return <CrearTecnico notifyError={notifyError} settings={data.settings} onBack={() => onNavigate('jefe-tecnicos')} onCreate={(payload) => runAction(async () => { await apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) }); await loadAll(); onNavigate('jefe-tecnicos'); }, { successMessage: 'Técnico creado correctamente' })} />
    if (view === 'jefe-tecnicos-edit') return <EditarUsuario notifyError={notifyError} settings={data.settings} user={selectedUser} onBack={() => onNavigate('jefe-tecnicos')} onSave={(payload) => runAction(async () => { await apiFetch(`/users/${selectedUser.id}`, { method: 'PUT', body: JSON.stringify(payload) }); await loadAll(); onNavigate('jefe-tecnicos'); }, { successMessage: 'Técnico actualizado correctamente' })} />
    if (view === 'jefe-incidencias') return <IncidenciasList
      incidents={data.incidents}
      technicians={data.users.filter((u) => u.role?.name === 'tecnico')}
      assignmentMode={data.settings?.assignment_mode || 'manual'}
      notifyError={notifyError}
      onAssign={(id, assignedTo) => runAction(async () => {
        await apiFetch(`/incidents/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assigned_to: assignedTo }) })
        await loadAll()
      }, { successMessage: 'Incidencia asignada correctamente' })}
      onEdit={(id) => { setSelectedIncidentId(id); onNavigate('jefe-incidencias-edit') }}
      onDelete={(id) => runAction(async () => { if (!confirm('¿Eliminar incidencia?')) return false; await apiFetch(`/incidents/${id}`, { method: 'DELETE' }); await loadAll(); }, { successMessage: 'Incidencia eliminada correctamente' })}
    />
    if (view === 'jefe-incidencias-edit') return <EditarIncidencia notifyError={notifyError} settings={data.settings} incident={data.incidents.find((i) => i.id === selectedIncidentId)} onBack={() => onNavigate('jefe-incidencias')} onSave={(payload) => runAction(async () => { await apiFetch(`/incidents/${selectedIncidentId}`, { method: 'PUT', body: JSON.stringify(payload) }); await loadAll(); onNavigate('jefe-incidencias'); })} />
    if (view === 'jefe-estadisticas') return <EstadisticasEmpresa statsCompany={data.statsCompany} byTechnician={data.byTechnician} />
    if (view === 'jefe-config') return <ConfiguracionEmpresa settings={data.settings} onSave={(payload) => runAction(async () => { await apiFetch('/company-settings', { method: 'POST', body: payload }); await loadAll(); }, { successMessage: 'Configuración guardada correctamente' })} />
  }
  if (role === 'empleado') {
    if (view === 'emp-dashboard') return <EmpleadoDashboard incidents={data.incidents} />
    if (view === 'emp-mis') return <MisIncidencias incidents={data.incidents} onCreate={() => onNavigate('emp-crear')} onEdit={(id) => { setSelectedIncidentId(id); onNavigate('emp-edit'); }} />
    if (view === 'emp-crear') return <CrearIncidencia notifyError={notifyError} settings={data.settings} onCreate={(payload, file) => runAction(async () => {
      const created = await apiFetch('/incidents', { method: 'POST', body: JSON.stringify(payload) })
      if (file && created?.incident?.id) {
        const formData = new FormData()
        formData.append('file', file)
        await apiFetch(`/incidents/${created.incident.id}/attachments`, { method: 'POST', body: formData })
      }
      await loadAll()
      onNavigate('emp-mis')
    })} />
    if (view === 'emp-edit') return <EditarIncidencia notifyError={notifyError} settings={data.settings} incident={data.incidents.find((i) => i.id === selectedIncidentId)} onBack={() => onNavigate('emp-mis')} onSave={(payload) => runAction(async () => { await apiFetch(`/incidents/${selectedIncidentId}`, { method: 'PUT', body: JSON.stringify(payload) }); await loadAll(); onNavigate('emp-mis'); })} />
  }
  if (role === 'tecnico') {
    if (view === 'tec-dashboard') return <TecnicoDashboard incidents={data.incidents} />
    if (view === 'tec-disponibles') return <IncidenciasTecnico
      title="Incidencias disponibles"
      incidents={data.incidents}
      currentUserId={currentUser?.id}
      filterMode="available"
      onTake={(id) => runAction(async () => {
        await apiFetch(`/incidents/${id}/assign`, { method: 'PATCH' })
        await loadAll()
      }, { successMessage: 'Incidencia cogida correctamente' })}
      onManage={(id) => { setSelectedIncidentId(id); setSelectedUserSource('tec-disponibles'); onNavigate('tec-gestionar'); }}
    />
    if (view === 'tec-asignadas') return <IncidenciasAsignadas
      incidents={data.incidents}
      currentUserId={currentUser?.id}
      onTake={(id) => runAction(async () => {
        await apiFetch(`/incidents/${id}/assign`, { method: 'PATCH' })
        await loadAll()
      }, { successMessage: 'Incidencia cogida correctamente' })}
      onManage={(id) => { setSelectedIncidentId(id); setSelectedUserSource('tec-asignadas'); onNavigate('tec-gestionar'); }}
    />
    if (view === 'tec-gestionar') return <GestionarIncidencia
      incident={data.incidents.find((i) => i.id === selectedIncidentId)}
      apiFetch={apiFetch}
      onUpdated={loadAll}
      onBack={() => onNavigate(selectedUserSource || 'tec-asignadas')}
      notifications={notifications}
      currentUserId={currentUser?.id}
      onTakeOwnership={async (id) => {
        await runAction(async () => {
          await apiFetch(`/incidents/${id}/assign`, { method: 'PATCH' })
          await loadAll()
        }, { successMessage: 'Incidencia cogida correctamente' })
      }}
      notifySuccess={ctx.notifySuccess}
      notifyError={notifyError}
    />
  }
  return <div className="panel">Vista no disponible</div>
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <div className="toast__content">
            <div className="toast__title">{toast.type === 'success' ? 'Exito' : 'Error'}</div>
            <div className="toast__message">{toast.message}</div>
          </div>
          <button type="button" className="toast__close" aria-label="Cerrar notificación" onClick={() => onDismiss(toast.id)}>×</button>
        </div>
      ))}
    </div>
  )
}

function StatCards({ cards }) {
  return (
    <div className="stat-grid">
      {cards.map((c) => (
        <div key={c.label} className="stat-card">
          <div className={`stat-icon ${c.color}`}>{c.icon}</div>
          <div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function BrandLogo({ brandLogo, brandName, product = false }) {
  if (brandLogo) {
    return <img className="brand-logo-image" src={brandLogo} alt={brandName} />
  }

  if (product) {
    return <img className="brand-logo-image brand-logo-image--product" src={sirtlyLogo} alt={brandName || 'Sirtly'} />
  }

  return <div className="logo">{(brandName || 'S').trim().charAt(0).toUpperCase() || 'S'}</div>
}

function RecentTable({ rows, personLabel = 'Técnico' }) {
  return (
    <div className="panel">
      <div className="panel__title">Actividad reciente</div>
      <table className="table recent-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>{personLabel}</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.title}>
              <td data-label="Título">{r.title}</td>
              <td data-label={personLabel}>{r.person}</td>
              <td data-label="Prioridad"><span className={`pill ${r.priorityClass}`}>{r.priority}</span></td>
              <td data-label="Estado"><span className={`pill ${r.statusClass}`}>{r.status}</span></td>
              <td data-label="Fecha">{r.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AdminDashboard({ stats, incidents }) {
  const cards = [
    { label: 'Empresas', value: stats?.companies || 0, icon: '🏢', color: 'blue' },
    { label: 'Usuarios totales', value: stats?.users || 0, icon: '👥', color: 'purple' },
    { label: 'Empresas con marca', value: stats?.companies_with_branding || 0, icon: '🎨', color: 'indigo' },
    { label: 'Asignación automática + especialidad', value: (stats?.companies_auto_assignment || 0) + (stats?.companies_specialty_assignment || 0), icon: '⚙️', color: 'green' },
  ]

  return (
    <div>
      <h2 className="section-title">Dashboard — <span>Administrador</span></h2>
      <StatCards cards={cards} />
    </div>
  )
}

function SupervisorDashboard({ stats, incidents }) {
  const cards = [
    { label: 'Empresas', value: stats?.companies || 0, icon: '🏢', color: 'blue' },
    { label: 'Empresas con identidad visual configurada', value: stats?.companies_with_branding || 0, icon: '🎨', color: 'indigo' },
    { label: 'Empresas con asignación automática', value: stats?.companies_auto_assignment || 0, icon: '⚙️', color: 'green' },
    { label: 'Empresas con asignación por especialidad', value: stats?.companies_specialty_assignment || 0, icon: '🧩', color: 'purple' },
  ]
  return (
    <div>
      <h2 className="section-title">Dashboard — <span>Supervisor</span></h2>
      <StatCards cards={cards} />
    </div>
  )
}

function AdminEstadisticas({ stats }) {
  const totalCompanies = stats?.companies || 0
  const assignmentRows = [
    { label: 'Asignación automática activa', value: stats?.companies_auto_assignment || 0 },
    { label: 'Asignación por especialidad activa', value: stats?.companies_specialty_assignment || 0 },
    { label: 'Asignación manual activa', value: stats?.companies_manual_assignment || 0 },
  ]
  const cards = [
    { label: 'Total de empresas', value: totalCompanies, icon: '🏢', color: 'blue' },
    { label: 'Total de usuarios', value: stats?.users || 0, icon: '👥', color: 'purple' },
    { label: 'Empresas con identidad visual configurada', value: stats?.companies_with_branding || 0, icon: '🎨', color: 'indigo' },
    { label: 'Empresas con asignación automática/especialidad', value: (stats?.companies_auto_assignment || 0) + (stats?.companies_specialty_assignment || 0), icon: '⚙️', color: 'green' },
  ]

  return (
    <div>
      <h2 className="section-title">Estadísticas — <span>Empresas</span></h2>
      <StatCards cards={cards} />
      <div className="panel">
        <div className="panel__title">Resumen de configuración por empresa</div>
        <div className="bar-list">
          <div className="bar-row">
            <span>Empresas con identidad visual configurada</span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(((stats?.companies_with_branding || 0) / Math.max(totalCompanies, 1)) * 100)}%` }} /></div>
            <span className="muted">{stats?.companies_with_branding || 0}</span>
          </div>
          {assignmentRows.map((row) => (
            <div key={row.label} className="bar-row">
              <span>{row.label}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round((row.value / Math.max(totalCompanies, 1)) * 100)}%` }} /></div>
              <span className="muted">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SupervisorEstadisticas({ stats }) {
  const totalCompanies = stats?.companies || 0
  const assignmentRows = [
    { label: 'Asignación automática activa', value: stats?.companies_auto_assignment || 0 },
    { label: 'Asignación por especialidad activa', value: stats?.companies_specialty_assignment || 0 },
    { label: 'Asignación manual activa', value: stats?.companies_manual_assignment || 0 },
  ]
  const cards = [
    { label: 'Total de empresas', value: totalCompanies, icon: '🏢', color: 'blue' },
    { label: 'Empresas con identidad visual configurada', value: stats?.companies_with_branding || 0, icon: '🎨', color: 'indigo' },
    { label: 'Empresas con asignación automática', value: stats?.companies_auto_assignment || 0, icon: '⚙️', color: 'green' },
    { label: 'Empresas con asignación por especialidad', value: stats?.companies_specialty_assignment || 0, icon: '🧩', color: 'purple' },
  ]

  return (
    <div>
      <h2 className="section-title">Estadísticas — <span>Empresas</span></h2>
      <StatCards cards={cards} />
      <div className="panel">
        <div className="panel__title">Resumen de configuración por empresa</div>
        <div className="bar-list">
          <div className="bar-row">
            <span>Empresas con identidad visual configurada</span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(((stats?.companies_with_branding || 0) / Math.max(totalCompanies, 1)) * 100)}%` }} /></div>
            <span className="muted">{stats?.companies_with_branding || 0}</span>
          </div>
          {assignmentRows.map((row) => (
            <div key={row.label} className="bar-row">
              <span>{row.label}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round((row.value / Math.max(totalCompanies, 1)) * 100)}%` }} /></div>
              <span className="muted">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function JefeDashboard({ stats, incidents }) {
  const cards = [
    { label: 'Empleados', value: stats?.employees || 0, icon: '👥', color: 'blue' },
    { label: 'Incidencias', value: stats?.incidents || 0, icon: '📄', color: 'purple' },
    { label: 'Abiertas', value: stats?.open || 0, icon: '•', color: 'gray' },
    { label: 'En proceso', value: stats?.in_progress || 0, icon: '•', color: 'gray' },
    { label: 'Resueltas', value: stats?.resolved || 0, icon: '✔', color: 'green' },
  ]
  const rows = incidents.slice(0, 4).map((i) => ({
    title: i.title,
    person: i.assignee?.name || '-',
    priority: labelPriority(i.priority),
    priorityClass: priorityClass(i.priority),
    status: labelStatus(i.status?.name),
    statusClass: statusClass(labelStatus(i.status?.name)),
    date: formatDate(i.created_at),
  }))
  return (
    <div>
      <h2 className="section-title">Dashboard — <span>Jefe de empresa</span></h2>
      <StatCards cards={cards} />
      <RecentTable rows={rows} />
    </div>
  )
}

function EmpleadoDashboard({ incidents }) {
  const cards = [
    { label: 'Mis abiertas', value: incidents.filter((i) => i.status?.name === 'abierta').length, icon: '•', color: 'gray' },
    { label: 'En proceso', value: incidents.filter((i) => i.status?.name === 'en_progreso').length, icon: '🕒', color: 'blue' },
    { label: 'Resueltas', value: incidents.filter((i) => i.status?.name === 'resuelta').length, icon: '✔', color: 'green' },
  ]
  const rows = incidents.slice(0, 4).map((i) => ({
    title: i.title,
    person: i.assignee?.name || '-',
    priority: labelPriority(i.priority),
    priorityClass: priorityClass(i.priority),
    status: labelStatus(i.status?.name),
    statusClass: statusClass(labelStatus(i.status?.name)),
    date: formatDate(i.created_at),
  }))
  return (
    <div>
      <h2 className="section-title">Dashboard — <span>Empleado</span></h2>
      <StatCards cards={cards} />
      <RecentTable rows={rows} />
    </div>
  )
}

function TecnicoDashboard({ incidents }) {
  const cards = [
    { label: 'Asignadas', value: incidents.filter((i) => i.assigned_to).length, icon: '📄', color: 'blue' },
    { label: 'En proceso', value: incidents.filter((i) => i.status?.name === 'en_progreso').length, icon: '•', color: 'gray' },
    { label: 'Resueltas', value: incidents.filter((i) => i.status?.name === 'resuelta').length, icon: '✔', color: 'green' },
  ]
  const rows = incidents.slice(0, 4).map((i) => ({
    title: i.title,
    person: i.creator?.name || '-',
    priority: labelPriority(i.priority),
    priorityClass: priorityClass(i.priority),
    status: labelStatus(i.status?.name),
    statusClass: statusClass(labelStatus(i.status?.name)),
    date: formatDate(i.created_at),
  }))
  return (
    <div>
      <h2 className="section-title">Dashboard — <span>Técnico</span></h2>
      <StatCards cards={cards} />
      <RecentTable rows={rows} personLabel="Empleado" />
    </div>
  )
}

function EmpresasList({ data, readonly, onCreate, onEdit }) {
  const [search, setSearch] = useState('')
  const rows = data.filter((c) => [c.name, c.cif, c.email, c.phone].join(' ').toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <h3>Empresas</h3>
        </div>
        {!readonly && <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear empresa</button>}
      </div>
      <div className="search">
        <input type="search" placeholder="Buscar..." aria-label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>CIF</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Estado</th>
            {!readonly && <th></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.cif || '-'}</td>
              <td>{c.email || '-'}</td>
              <td>{c.phone || '-'}</td>
              <td><span className={`pill ${c.status === 'active' ? 'activa' : 'inactiva'}`}>{c.status === 'active' ? 'Activa' : 'Inactiva'}</span></td>
              {!readonly && (
                <td className="actions">
                  <button type="button" className="icon-btn" aria-label={`Editar empresa ${c.name}`} onClick={() => onEdit?.(c)}>✏️</button>
                  <button type="button" className="icon-btn" aria-label={`Eliminar empresa ${c.name}`} disabled>🗑️</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel__footer">{rows.length} registros encontrados</div>
    </div>
  )
}

function JefesList({ users, onCreate, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const rows = users.filter((u) => u.role?.name === 'jefe_empresa').filter((u) => [u.name, u.last_name, u.email, u.phone, u.company?.name].join(' ').toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Jefes de empresa</h3>
        <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear jefe</button>
      </div>
      <div className="search">
        <input type="search" placeholder="Buscar..." aria-label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellidos</th>
            <th>Email</th>
            <th>Empresa</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.last_name}</td>
              <td>{r.email}</td>
              <td>{r.company?.name || '-'}
              </td>
              <td>{r.phone || '-'}</td>
              <td><span className="pill activa">Activa</span></td>
              <td className="actions">
                <button type="button" className="icon-btn" aria-label={`Editar usuario ${r.name}`} onClick={() => onEdit(r)}>✏️</button>
                <button type="button" className="icon-btn" aria-label={`Eliminar usuario ${r.name}`} onClick={() => onDelete?.(r)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel__footer">{rows.length} registros encontrados</div>
    </div>
  )
}

function AdminsList({ users, onCreate, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const rows = users.filter((u) => u.role?.name === 'admin').filter((u) => [u.name, u.last_name, u.email].join(' ').toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Administradores</h3>
        <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear administrador</button>
      </div>
      <div className="search">
        <input type="search" placeholder="Buscar..." aria-label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellidos</th>
            <th>Email</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.last_name}</td>
              <td>{r.email}</td>
              <td><span className="pill activa">Activa</span></td>
              <td className="actions">
                <button type="button" className="icon-btn" aria-label={`Editar usuario ${r.name}`} onClick={() => onEdit?.(r)}>✏️</button>
                <button type="button" className="icon-btn" aria-label={`Eliminar usuario ${r.name}`} onClick={() => onDelete?.(r)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel__footer">{rows.length} registros encontrados</div>
    </div>
  )
}

function SupervisoresList({ users, onCreate, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const rows = users.filter((u) => u.role?.name === 'supervisor').filter((u) => [u.name, u.last_name, u.email].join(' ').toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Supervisores</h3>
        <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear supervisor</button>
      </div>
      <div className="search">
        <input type="search" placeholder="Buscar..." aria-label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellidos</th>
            <th>Email</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.last_name}</td>
              <td>{r.email}</td>
              <td><span className="pill activa">Activa</span></td>
              <td className="actions">
                <button type="button" className="icon-btn" aria-label={`Editar usuario ${r.name}`} onClick={() => onEdit?.(r)}>✏️</button>
                <button type="button" className="icon-btn" aria-label={`Eliminar usuario ${r.name}`} onClick={() => onDelete?.(r)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel__footer">{rows.length} registros encontrados</div>
    </div>
  )
}

function EmpleadosList({ users, onCreate, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const rows = users.filter((u) => u.role?.name === 'empleado').filter((u) => [u.name, u.last_name, u.email, u.department].join(' ').toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Empleados</h3>
        <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear empleado</button>
      </div>
      <div className="search">
        <input type="search" placeholder="Buscar..." aria-label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellidos</th>
            <th>Email</th>
            <th>Departamento</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.last_name}</td>
              <td>{r.email}</td>
              <td>{r.department || '-'}</td>
              <td><span className="pill activa">Activa</span></td>
              <td className="actions">
                <button type="button" className="icon-btn" aria-label={`Editar usuario ${r.name}`} onClick={() => onEdit(r)}>✏️</button>
                <button type="button" className="icon-btn" aria-label={`Eliminar usuario ${r.name}`} onClick={() => onDelete?.(r)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel__footer">{rows.length} registros encontrados</div>
    </div>
  )
}

function TecnicosList({ users, onCreate, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const rows = users.filter((u) => u.role?.name === 'tecnico').filter((u) => [u.name, u.last_name, u.email, u.specialty].join(' ').toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Técnicos</h3>
        <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear técnico</button>
      </div>
      <div className="search">
        <input type="search" placeholder="Buscar..." aria-label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellidos</th>
            <th>Email</th>
            <th>Especialidad</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.last_name}</td>
              <td>{r.email}</td>
              <td>{r.specialty || '-'}</td>
              <td><span className="pill activa">Activa</span></td>
              <td className="actions">
                <button type="button" className="icon-btn" aria-label={`Editar usuario ${r.name}`} onClick={() => onEdit(r)}>✏️</button>
                <button type="button" className="icon-btn" aria-label={`Eliminar usuario ${r.name}`} onClick={() => onDelete?.(r)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel__footer">{rows.length} registros encontrados</div>
    </div>
  )
}

function IncidenciasList({ incidents, technicians = [], assignmentMode = 'manual', onAssign, onEdit, onDelete, notifyError }) {
  const [search, setSearch] = useState('')
  const [selectedTechnicians, setSelectedTechnicians] = useState({})
  const [pendingAssignments, setPendingAssignments] = useState({})
  const [confirmedAssignments, setConfirmedAssignments] = useState({})
  const [assignmentModalIncidentId, setAssignmentModalIncidentId] = useState(null)

  const filteredIncidents = incidents.filter((i) => [i.title, i.description, i.category, i.creator?.name, i.assignee?.name, i.status?.name].join(' ').toLowerCase().includes(search.toLowerCase()))

  const assignmentIncident = filteredIncidents.find((incident) => incident.id === assignmentModalIncidentId) || null

  const handleAssign = async (incident) => {
    const technicianId = selectedTechnicians[incident.id] ?? (incident.assigned_to ? String(incident.assigned_to) : '')

    if (!technicianId) {
      notifyError?.('Selecciona un técnico para asignar la incidencia')
      return
    }

    setPendingAssignments((prev) => ({ ...prev, [incident.id]: true }))
    const result = await onAssign(incident.id, Number(technicianId))
    setPendingAssignments((prev) => ({ ...prev, [incident.id]: false }))

    if (result === null) {
      return
    }

    setAssignmentModalIncidentId(null)
    setConfirmedAssignments((prev) => ({ ...prev, [incident.id]: true }))
    window.setTimeout(() => {
      setConfirmedAssignments((prev) => ({ ...prev, [incident.id]: false }))
    }, 1800)
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Incidencias</h3>
      </div>
      <div className="search">
        <input type="search" placeholder="Buscar..." aria-label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Creador</th>
            <th>Técnico</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredIncidents.map((i) => {
            const isPending = Boolean(pendingAssignments[i.id])
            const isConfirmed = Boolean(confirmedAssignments[i.id])
            const selectedValue = selectedTechnicians[i.id] ?? (i.assigned_to ? String(i.assigned_to) : '')
            const currentValue = i.assigned_to ? String(i.assigned_to) : ''
            const hasSelectionChange = selectedValue !== currentValue
            const assigneeName = [i.assignee?.name, i.assignee?.last_name].filter(Boolean).join(' ') || 'Sin asignar'

            return (
            <tr key={i.id}>
              <td>{i.title}</td>
              <td>{i.creator?.name || '-'}</td>
              <td className="assignment-cell">
                {onAssign ? (
                  <div className="assignment-display">
                    <span className={`assignment-display__name ${!i.assigned_to ? 'is-unassigned' : ''}`}>{assigneeName}</span>
                    {isConfirmed ? (
                      <span className="assignment-status">Asignado</span>
                    ) : (
                      <button
                        type="button"
                        className="assignment-edit"
                        title={i.assigned_to ? 'Cambiar técnico' : 'Asignar técnico'}
                        aria-label={i.assigned_to ? `Cambiar técnico de ${i.title}` : `Asignar técnico a ${i.title}`}
                        onClick={() => {
                          setSelectedTechnicians((prev) => ({ ...prev, [i.id]: currentValue }))
                          setAssignmentModalIncidentId(i.id)
                        }}
                      >
                        <span className="assignment-edit__icon" aria-hidden="true">⇄</span>
                      </button>
                    )}
                  </div>
                ) : (
                  i.assignee?.name || '-'
                )}
              </td>
              <td><span className={`pill ${priorityClass(i.priority)}`}>{labelPriority(i.priority)}</span></td>
              <td><span className={`pill ${statusClass(labelStatus(i.status?.name))}`}>{labelStatus(i.status?.name)}</span></td>
              <td>{formatDate(i.created_at)}</td>
              <td className="actions">
                <button type="button" className="icon-btn" aria-label={`Editar incidencia ${i.title}`} onClick={() => onEdit(i.id)}>✏️</button>
                {onDelete && <button type="button" className="icon-btn" aria-label={`Eliminar incidencia ${i.title}`} onClick={() => onDelete(i.id)}>🗑️</button>}
              </td>
            </tr>
          )})}
        </tbody>
      </table>
      <div className="panel__footer">{filteredIncidents.length} registros encontrados</div>

      {assignmentIncident && (
        <div className="assignment-modal-overlay" role="presentation" onClick={() => {
          if (pendingAssignments[assignmentIncident.id]) return
          setAssignmentModalIncidentId(null)
          setSelectedTechnicians((prev) => ({
            ...prev,
            [assignmentIncident.id]: assignmentIncident.assigned_to ? String(assignmentIncident.assigned_to) : '',
          }))
        }}>
          <div className="assignment-modal" role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="assignment-modal__header">
              <div>
                <h4 id="assignment-modal-title">Asignar tecnico</h4>
                <p>{assignmentIncident.title}</p>
              </div>
              <button
                type="button"
                className="assignment-modal__close"
                aria-label="Cerrar asignación"
                disabled={pendingAssignments[assignmentIncident.id]}
                onClick={() => {
                  setAssignmentModalIncidentId(null)
                  setSelectedTechnicians((prev) => ({
                    ...prev,
                    [assignmentIncident.id]: assignmentIncident.assigned_to ? String(assignmentIncident.assigned_to) : '',
                  }))
                }}
              >
                ×
              </button>
            </div>

            <label className="assignment-modal__label" htmlFor="assignment-technician">Tecnico</label>
            <select id="assignment-technician"
              className="assignment-modal__select"
              disabled={pendingAssignments[assignmentIncident.id]}
              value={selectedTechnicians[assignmentIncident.id] ?? (assignmentIncident.assigned_to ? String(assignmentIncident.assigned_to) : '')}
              onChange={(e) => {
                const nextValue = e.target.value
                setSelectedTechnicians((prev) => ({ ...prev, [assignmentIncident.id]: nextValue }))
                setConfirmedAssignments((prev) => ({ ...prev, [assignmentIncident.id]: false }))
              }}
            >
              <option value="">Sin asignar</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>{tech.name} {tech.last_name || ''}</option>
              ))}
            </select>

            <div className="assignment-modal__actions">
              <button
                type="button"
                className="assignment-modal__secondary"
                disabled={pendingAssignments[assignmentIncident.id]}
                onClick={() => {
                  setAssignmentModalIncidentId(null)
                  setSelectedTechnicians((prev) => ({
                    ...prev,
                    [assignmentIncident.id]: assignmentIncident.assigned_to ? String(assignmentIncident.assigned_to) : '',
                  }))
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn assignment-modal__primary"
                disabled={
                  pendingAssignments[assignmentIncident.id] ||
                  (selectedTechnicians[assignmentIncident.id] ?? (assignmentIncident.assigned_to ? String(assignmentIncident.assigned_to) : '')) ===
                    (assignmentIncident.assigned_to ? String(assignmentIncident.assigned_to) : '')
                }
                onClick={() => handleAssign(assignmentIncident)}
              >
                {pendingAssignments[assignmentIncident.id] ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MisIncidencias({ incidents, onCreate, onEdit }) {
  const [search, setSearch] = useState('')
  const rows = incidents.filter((i) => [i.title, i.description, i.category, i.creator?.name, i.status?.name].join(' ').toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Mis incidencias</h3>
        <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear incidencia</button>
      </div>
      <div className="search">
        <input type="search" placeholder="Buscar..." aria-label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Empleado</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i.id}>
              <td>{i.title}</td>
              <td>{i.creator?.name || '-'}</td>
              <td><span className={`pill ${priorityClass(i.priority)}`}>{labelPriority(i.priority)}</span></td>
              <td><span className={`pill ${statusClass(labelStatus(i.status?.name))}`}>{labelStatus(i.status?.name)}</span></td>
              <td>{formatDate(i.created_at)}</td>
              <td className="actions">
                <button type="button" className="icon-btn" aria-label={`Editar incidencia ${i.title}`} onClick={() => onEdit(i.id)}>✏️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel__footer">{rows.length} registros encontrados</div>
    </div>
  )
}

function IncidenciasTecnico({ title, incidents, currentUserId, filterMode, onTake, onManage }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const statusOptions = useMemo(() => {
    const labels = new Set(
      incidents
        .map((incident) => labelStatus(incident.status?.name))
        .filter(Boolean),
    )
    return Array.from(labels).sort((a, b) => a.localeCompare(b, 'es'))
  }, [incidents])

  const rows = incidents.filter((i) => {
    if (filterMode === 'available') return i.assigned_to == null || !i.assignee
    return i.assigned_to === currentUserId
  }).filter((i) => {
    const matchesSearch = [i.title, i.description, i.category, i.creator?.name, i.assignee?.name, i.status?.name]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
    const normalizedStatus = labelStatus(i.status?.name)
    const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter
    const matchesPriority = priorityFilter === 'all' || i.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>{title}</h3>
      </div>
      <div className="search">
        <input type="search" placeholder="Buscar..." aria-label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Filtrar por estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos los estados</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select aria-label="Filtrar por prioridad" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="all">Todas las prioridades</option>
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority.value} value={priority.value}>{priority.label}</option>
          ))}
        </select>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Empleado</th>
            <th>Técnico</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i.id}>
              <td>{i.title}</td>
              <td>{i.creator?.name || '-'}</td>
              <td>{i.assignee?.name || (i.assigned_to ? 'Asignada' : 'Sin asignar')}</td>
              <td><span className={`pill ${priorityClass(i.priority)}`}>{labelPriority(i.priority)}</span></td>
              <td><span className={`pill ${statusClass(labelStatus(i.status?.name))}`}>{labelStatus(i.status?.name)}</span></td>
              <td>{formatDate(i.created_at)}</td>
              <td className="actions">
                {!i.assigned_to && <button type="button" className="btn btn--primary" onClick={() => onTake(i.id)}>Coger</button>}
                {i.assigned_to === currentUserId && <button type="button" className="btn btn--primary" aria-label={`Entrar a incidencia ${i.title}`} onClick={() => onManage(i.id)}>Entrar a incidencia</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel__footer">{rows.length} registros encontrados</div>
    </div>
  )
}

function IncidenciasAsignadas({ incidents, currentUserId, onTake, onManage }) {
  return (
    <IncidenciasTecnico
      title="Mis incidencias"
      incidents={incidents}
      currentUserId={currentUserId}
      filterMode="mine"
      onTake={onTake}
      onManage={onManage}
    />
  )
}

function CrearIncidencia({ onCreate, settings, notifyError }) {
  const formId = useId()
  const [form, setForm] = useState({ title: '', description: '', category: '', priority: 'medium' })
  const [file, setFile] = useState(null)
  const categories = settings?.categories || []
  const submit = () => {
    const error = validateIncidentForm(form)
    if (error) {
      notifyError?.(error)
      return
    }
    onCreate(form, file)
  }
  return (
    <div className="panel form">
      <h3>Crear incidencia</h3>
      <label htmlFor={`${formId}-title`}>Título</label>
      <input id={`${formId}-title`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Describe brevemente el problema" />
      <label htmlFor={`${formId}-description`}>Descripción</label>
      <textarea id={`${formId}-description`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalla el problema con toda la información posible..." />
      <label htmlFor={`${formId}-category`}>Categoría</label>
      {categories.length > 0 ? (
        <select id={`${formId}-category`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="">Seleccionar...</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      ) : (
        <input id={`${formId}-category`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Redes, Software..." />
      )}
      <label htmlFor={`${formId}-priority`}>Prioridad</label>
      <select id={`${formId}-priority`} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      <label htmlFor={`${formId}-attachment`}>Adjuntar archivo (opcional)</label>
      <input id={`${formId}-attachment`} type="file" aria-label="Adjuntar archivo" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button className="btn btn--primary" onClick={submit}>Crear incidencia</button>
    </div>
  )
}

function EditarIncidencia({ incident, onBack, onSave, settings, notifyError }) {
  const formId = useId()
  const [form, setForm] = useState({ title: '', description: '', category: '', priority: 'medium' })
  useEffect(() => {
    if (incident) {
      setForm({
        title: incident.title || '',
        description: incident.description || '',
        category: incident.category || '',
        priority: incident.priority || 'medium',
      })
    }
  }, [incident])

  if (!incident) return <div className="panel">Selecciona una incidencia</div>

  const submit = () => {
    const error = validateIncidentForm(form)
    if (error) {
      notifyError?.(error)
      return
    }
    onSave(form)
  }

  const categories = settings?.categories || []

  return (
    <div className="panel form">
      <FormHeader title="Editar incidencia" onBack={onBack} />
      <label htmlFor={`${formId}-title`}>Título</label>
      <input id={`${formId}-title`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <label htmlFor={`${formId}-description`}>Descripción</label>
      <textarea id={`${formId}-description`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <SuggestionInput
        label="Categoría"
        value={form.category}
        suggestions={categories}
        id={`${formId}-category`}
        listId="incident-categories-edit"
        placeholder="Hardware, Software, Red..."
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />
      <label htmlFor={`${formId}-priority`}>Prioridad</label>
      <select id={`${formId}-priority`} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
        <option value="low">Baja</option>
        <option value="medium">Media</option>
        <option value="high">Alta</option>
        <option value="urgent">Crítica</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Guardar cambios</button>
    </div>
  )
}

function EditarUsuario({ user, onBack, onSave, settings, notifyError }) {
  const formId = useId()
  const [form, setForm] = useState({ name: '', last_name: '', email: '', phone: '', department: '', specialty: '', password: '', active: true })
  const departments = settings?.departments || []
  const specialties = settings?.specialties || []
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        specialty: user.specialty || '',
        password: '',
        active: user.active ?? true,
      })
    }
  }, [user])
  if (!user) return <div className="panel">Selecciona un usuario</div>

  const submit = () => {
    const error = validateUserForm(form, { passwordOptional: true })
    if (error) {
      notifyError?.(error)
      return
    }

    const payload = {
      name: form.name,
      last_name: form.last_name,
      email: form.email,
      phone: normalizePhoneForSave(form.phone) || null,
      department: form.department,
      specialty: form.specialty,
      active: form.active,
    }

    if (form.password.trim()) {
      payload.password = form.password
    }

    onSave(payload)
  }

  return (
    <div className="panel form">
      <FormHeader title="Editar usuario" onBack={onBack} />
      <label htmlFor={`${formId}-name`}>Nombre</label>
      <input id={`${formId}-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <label htmlFor={`${formId}-last-name`}>Apellidos</label>
      <input id={`${formId}-last-name`} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      <label htmlFor={`${formId}-email`}>Email</label>
      <input id={`${formId}-email`} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <label htmlFor={`${formId}-phone`}>Teléfono</label>
      <input id={`${formId}-phone`} type="tel" inputMode="tel" pattern={PHONE_PATTERN} autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <SuggestionInput
        label="Departamento"
        value={form.department}
        suggestions={departments}
        id={`${formId}-department`}
        listId="edit-user-departments"
        placeholder="Desarrollo, Marketing..."
        onChange={(e) => setForm({ ...form, department: e.target.value })}
      />
      <SuggestionInput
        label="Especialidad"
        value={form.specialty}
        suggestions={specialties}
        id={`${formId}-specialty`}
        listId="edit-user-specialties"
        placeholder="Redes, Software..."
        onChange={(e) => setForm({ ...form, specialty: e.target.value })}
      />
      <label htmlFor={`${formId}-password`}>Nueva contraseña (opcional)</label>
      <input id={`${formId}-password`} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <label htmlFor={`${formId}-active`}>Estado</label>
      <select id={`${formId}-active`} value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
        <option value="1">Activo</option>
        <option value="0">Inactivo</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Guardar cambios</button>
    </div>
  )
}

function GestionarIncidencia({ incident, apiFetch, onUpdated, currentUserId, onTakeOwnership, notifySuccess, notifyError, onBack }) {
  const formId = useId()
  const [status, setStatus] = useState('open')
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [uploadFile, setUploadFile] = useState(null)

  useEffect(() => {
    if (incident?.status?.name) {
      setStatus(mapStatusToApi(incident.status.name))
    }
  }, [incident])

  useEffect(() => {
    const load = async () => {
      if (!incident) return
      const c = await apiFetch(`/incidents/${incident.id}/comments`)
      setComments(c.comments || [])
      const a = await apiFetch(`/incidents/${incident.id}/attachments`)
      setAttachments(a.attachments || [])
    }
    load()
  }, [incident])

  if (!incident) return <div className="panel">Selecciona una incidencia</div>

  const updateStatus = async () => {
    try {
      await apiFetch(`/incidents/${incident.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      await onUpdated()
      notifySuccess?.('Estado actualizado correctamente')
    } catch (error) {
      notifyError?.(error.message || 'No se pudo actualizar el estado')
    }
  }

  const addComment = async () => {
    if (!comment.trim()) return
    try {
      await apiFetch(`/incidents/${incident.id}/comments`, { method: 'POST', body: JSON.stringify({ comment }) })
      setComment('')
      const c = await apiFetch(`/incidents/${incident.id}/comments`)
      setComments(c.comments || [])
      notifySuccess?.('Comentario enviado correctamente')
    } catch (error) {
      notifyError?.(error.message || 'No se pudo enviar el comentario')
    }
  }

  const uploadAttachment = async () => {
    if (!uploadFile) return
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      await apiFetch(`/incidents/${incident.id}/attachments`, { method: 'POST', body: formData })
      setUploadFile(null)
      const a = await apiFetch(`/incidents/${incident.id}/attachments`)
      setAttachments(a.attachments || [])
      notifySuccess?.('Adjunto subido correctamente')
    } catch (error) {
      notifyError?.(error.message || 'No se pudo subir el adjunto')
    }
  }

  const deleteAttachment = async (attachmentId) => {
    try {
      await apiFetch(`/incidents/${incident.id}/attachments?_action=delete&attachment_id=${attachmentId}`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const a = await apiFetch(`/incidents/${incident.id}/attachments`)
      setAttachments(a.attachments || [])
      notifySuccess?.('Adjunto eliminado correctamente')
    } catch (error) {
      notifyError?.(error.message || 'No se pudo eliminar el adjunto')
    }
  }

  return (
    <div className="grid-2">
      <div className="panel">
        <FormHeader title="Gestionar incidencia" onBack={onBack} />
        <h4>{incident.title}</h4>
        <p className="muted">{incident.description}</p>
        <div className="inline-tags">
          <span className="pill abierta">{labelStatus(incident.status?.name)}</span>
          <span className="pill alta">{labelPriority(incident.priority)}</span>
        </div>
        <div className="meta-row">
          <div>
            <span className="muted">Creado por</span>
            <div>{incident.creator?.name || '-'}</div>
          </div>
          <div>
            <span className="muted">Categoría</span>
            <div>{incident.category || '-'}</div>
          </div>
          <div>
            <span className="muted">Fecha</span>
            <div>{formatDate(incident.created_at)}</div>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel__title">Acciones</div>
        {!incident.assigned_to && onTakeOwnership && (
          <button className="btn btn--primary" onClick={() => onTakeOwnership(incident.id)}>Coger incidencia</button>
        )}
        {incident.assigned_to && incident.assigned_to !== currentUserId && (
          <div className="muted">Esta incidencia está asignada a otro técnico.</div>
        )}
        {(!incident.assigned_to || incident.assigned_to === currentUserId) && (
          <>
            <label htmlFor={`${formId}-status`}>Cambiar estado</label>
            <select id={`${formId}-status`} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="open">Abierta</option>
              <option value="in_progress">En proceso</option>
              <option value="resolved">Resuelta</option>
              <option value="closed">Cerrada</option>
            </select>
            <button className="btn btn--success" onClick={updateStatus}>Guardar estado</button>
          </>
        )}
        <div className="panel__title">Adjuntos</div>
        <ul className="file-list">
          {attachments.map((a) => (
            <li key={a.id}>
              <a href={a.url || `${API_ROOT}/storage/${a.file_path}`} target="_blank" rel="noreferrer">{a.file_name || a.file_path}</a>
              <button type="button" className="icon-btn icon-btn--danger" aria-label={`Eliminar adjunto ${a.file_name || a.file_path}`} onClick={() => deleteAttachment(a.id)}>🗑️</button>
            </li>
          ))}
        </ul>
        <div className="upload-row">
          <input id={`${formId}-upload`} type="file" aria-label="Subir adjunto" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
          <button className="btn btn--primary" onClick={uploadAttachment}>Subir</button>
        </div>
      </div>
      <div className="panel">
        <div className="panel__title">Historial de comentarios ({comments.length})</div>
        {comments.map((c) => (
          <div key={c.id} className="comment">
            <div className="avatar">{c.user?.name?.[0] || 'U'}</div>
            <div>
              <div className="comment__meta">{c.user?.name} · {formatDate(c.created_at)}</div>
              <div>{c.comment}</div>
            </div>
          </div>
        ))}
        <div className="comment__input">
          <input id={`${formId}-comment`} value={comment} aria-label="Nuevo comentario" onChange={(e) => setComment(e.target.value)} placeholder="Escribe un comentario..." />
          <button className="btn btn--primary" onClick={addComment}>Enviar</button>
        </div>
      </div>
      <div className="panel">
        <div className="panel__title">Detalles</div>
        <div className="detail-row"><span>Técnico</span><span>{incident.assignee?.name || '-'}</span></div>
        <div className="detail-row"><span>Prioridad</span><span className="pill alta">{labelPriority(incident.priority)}</span></div>
        <div className="detail-row"><span>Estado</span><span className="pill abierta">{labelStatus(incident.status?.name)}</span></div>
        <div className="detail-row"><span>Creado</span><span>{formatDate(incident.created_at)}</span></div>
      </div>
    </div>
  )
}

function EstadisticasSistema({ byCompany }) {
  const totalIncidents = byCompany.reduce((sum, row) => sum + row.total, 0)
  const companyMax = Math.max(...byCompany.map((row) => row.total), 1)

  return (
    <div>
      <h2 className="section-title">Estadísticas <span>del sistema</span></h2>
      <div className="stat-grid">
        <div className="stat-card">
          <div>
            <div className="stat-card__label">Empresas con incidencias</div>
            <div className="stat-card__value">{byCompany.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-card__label">Incidencias registradas</div>
            <div className="stat-card__value">{totalIncidents}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel__title">Incidencias por empresa</div>
        <div className="bar-list">
          {byCompany.map((row) => (
            <div key={row.company_id} className="bar-row">
              <span>{row.company}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round((row.total / companyMax) * 100)}%` }} /></div>
              <span className="muted">{row.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EstadisticasEmpresa({ statsCompany, byTechnician }) {
  const totalIncidents = statsCompany?.incidents || 0
  const technicianMax = Math.max(...byTechnician.map((row) => row.total), 1)
  const statusRows = [
    { label: 'Abiertas', value: statsCompany?.open || 0 },
    { label: 'En proceso', value: statsCompany?.in_progress || 0 },
    { label: 'Resueltas', value: statsCompany?.resolved || 0 },
  ]

  return (
    <div>
      <h2 className="section-title">Estadísticas <span>de empresa</span></h2>
      <div className="stat-grid">
        <div className="stat-card">
          <div>
            <div className="stat-card__label">Empleados</div>
            <div className="stat-card__value">{statsCompany?.employees ?? 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-card__label">Incidencias totales</div>
            <div className="stat-card__value">{totalIncidents}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-card__label">Promedio por empleado</div>
            <div className="stat-card__value">{statsCompany?.employees ? (totalIncidents / statsCompany.employees).toFixed(1) : '0.0'}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel__title">Estado de incidencias</div>
        <div className="bar-list">
          {statusRows.map((row) => (
            <div key={row.label} className="bar-row">
              <span>{row.label}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round((row.value / Math.max(totalIncidents, 1)) * 100)}%` }} /></div>
              <span className="muted">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel__title">Incidencias por técnico</div>
        <div className="bar-list">
          {byTechnician.map((row) => (
            <div key={row.technician_id} className="bar-row">
              <span>{row.technician}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round((row.total / technicianMax) * 100)}%` }} /></div>
              <span className="muted">{row.total}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel__title">Carga relativa del equipo</div>
        <div className="bar-list">
          {byTechnician.map((row) => (
            <div key={`share-${row.technician_id}`} className="bar-row">
              <span>{row.technician}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round((row.total / Math.max(totalIncidents, 1)) * 100)}%` }} /></div>
              <span className="muted">{totalIncidents ? `${Math.round((row.total / totalIncidents) * 100)}%` : '0%'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConfiguracionEmpresa({ settings, onSave }) {
  const formId = useId()
  const [form, setForm] = useState({
    primary_color: settings?.primary_color || '#2D61E5',
    secondary_color: settings?.secondary_color || '#7C3AED',
    system_name: settings?.system_name || '',
    logo: settings?.logo || '',
    favicon: settings?.favicon || '',
    assignment_mode: settings?.assignment_mode || 'manual',
    categories: (settings?.categories || []).join(', '),
    priorities: (settings?.priorities || []).join(', '),
    departments: (settings?.departments || []).join(', '),
    specialties: (settings?.specialties || []).join(', '),
  })
  const [logoFile, setLogoFile] = useState(null)
  const [faviconFile, setFaviconFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(settings?.logo ? `${API_ROOT}/storage/${settings.logo}` : '')
  const [faviconPreview, setFaviconPreview] = useState(settings?.favicon ? `${API_ROOT}/storage/${settings.favicon}` : '')

  useEffect(() => {
    if (settings) {
      setForm({
        primary_color: settings.primary_color || '#2D61E5',
        secondary_color: settings.secondary_color || '#7C3AED',
        system_name: settings.system_name || '',
        logo: settings.logo || '',
        favicon: settings.favicon || '',
        assignment_mode: settings.assignment_mode || 'manual',
        categories: (settings.categories || []).join(', '),
        priorities: (settings.priorities || []).join(', '),
        departments: (settings.departments || []).join(', '),
        specialties: (settings.specialties || []).join(', '),
      })
      setLogoPreview(settings.logo ? `${API_ROOT}/storage/${settings.logo}` : '')
      setFaviconPreview(settings.favicon ? `${API_ROOT}/storage/${settings.favicon}` : '')
    }
  }, [settings])

  const handleSave = () => {
    const payload = new FormData()
    payload.append('_method', 'PUT')
    payload.append('primary_color', form.primary_color)
    payload.append('secondary_color', form.secondary_color)
    payload.append('system_name', form.system_name)
    payload.append('assignment_mode', form.assignment_mode)
    splitCsv(form.categories).forEach((item) => payload.append('categories[]', item))
    splitCsv(form.priorities).forEach((item) => payload.append('priorities[]', item))
    splitCsv(form.departments).forEach((item) => payload.append('departments[]', item))
    splitCsv(form.specialties).forEach((item) => payload.append('specialties[]', item))
    if (logoFile) payload.append('logo_file', logoFile)
    if (faviconFile) payload.append('favicon_file', faviconFile)
    if (!logoFile && form.logo) payload.append('logo', form.logo)
    if (!faviconFile && form.favicon) payload.append('favicon', form.favicon)
    onSave(payload)
  }

  return (
    <div>
      <h2 className="section-title">Configuración de empresa</h2>
      <div className="grid-2">
        <div className="panel">
          <div className="panel__title">Personalización visual</div>
          <div className="theme-preview" style={{ '--brand-primary': form.primary_color, '--brand-secondary': form.secondary_color }}>
            <div className="theme-preview__sidebar">
              {logoPreview ? <img className="theme-preview__logo" src={logoPreview} alt="Logo" /> : <div className="theme-preview__logo-fallback">{(form.system_name || 'S')[0]}</div>}
              <div className="theme-preview__title">{form.system_name || 'Nombre de sistema'}</div>
            </div>
            <div className="theme-preview__content">
              <div className="theme-preview__chip">Abierta</div>
              <div className="theme-preview__button">Acción principal</div>
            </div>
          </div>
          <div className="block">Paleta visual</div>
          <div className="palette-grid">
            {COLOR_PRESETS.map(([primary, secondary]) => (
              <button
                key={`${primary}-${secondary}`}
                type="button"
                className={`palette-option ${form.primary_color === primary && form.secondary_color === secondary ? 'active' : ''}`}
                aria-label={`Aplicar paleta ${primary} y ${secondary}`}
                onClick={() => setForm({ ...form, primary_color: primary, secondary_color: secondary })}
              >
                <span className="palette-swatch" style={{ background: primary }} />
                <span className="palette-swatch" style={{ background: secondary }} />
              </button>
            ))}
          </div>
          <div className="config-colors">
            <div>
              <label htmlFor={`${formId}-primary-color`}>Color principal</label>
              <input id={`${formId}-primary-color`} type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
            </div>
            <div>
              <label htmlFor={`${formId}-secondary-color`}>Color secundario</label>
              <input id={`${formId}-secondary-color`} type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} />
            </div>
          </div>
          <label htmlFor={`${formId}-system-name`}>Nombre visible</label>
          <input id={`${formId}-system-name`} value={form.system_name} onChange={(e) => setForm({ ...form, system_name: e.target.value })} placeholder="TechSolutions S.L." />
          <label htmlFor={`${formId}-logo`}>Logo de la empresa</label>
          <input id={`${formId}-logo`} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" onChange={(e) => {
            const file = e.target.files?.[0] || null
            setLogoFile(file)
            if (file) setLogoPreview(URL.createObjectURL(file))
          }} />
          <label htmlFor={`${formId}-favicon`}>Favicon</label>
          <input id={`${formId}-favicon`} type="file" accept=".png,.ico,.svg,.webp" onChange={(e) => {
            const file = e.target.files?.[0] || null
            setFaviconFile(file)
            if (file) setFaviconPreview(URL.createObjectURL(file))
          }} />
          {faviconPreview && <img className="favicon-preview" src={faviconPreview} alt="Favicon" />}
          <div className="config-note">
            El logo y la identidad visual se aplican en los paneles de jefe de empresa, técnico y empleado.
          </div>
          <div className="config-highlight">
            <span>Sidebar personalizada</span>
            <span>Botones con color de marca</span>
            <span>Favicon propio</span>
          </div>
        </div>
        <div className="panel">
          <div className="panel__title">Funcionalidades</div>
          <label className="block" htmlFor={`${formId}-assignment-mode`}>Modo de asignación</label>
          <select id={`${formId}-assignment-mode`} className="block" value={form.assignment_mode} onChange={(e) => setForm({ ...form, assignment_mode: e.target.value })}>
            <option value="manual">Manual</option>
            <option value="auto">Automático</option>
            <option value="specialty">Por especialidad</option>
          </select>
          <div className="config-note">
            Manual: el técnico o el jefe asignan la incidencia.
            Automático: se asigna al técnico activo con menor carga de trabajo.
            Por especialidad: primero intenta encajar categoría y especialidad; si no hay coincidencia, cae al técnico con menor carga.
          </div>
          <label className="block" htmlFor={`${formId}-categories`}>Categorías (coma separadas)</label>
          <input id={`${formId}-categories`} className="block" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} placeholder="Hardware, Software, Red" />
          <label className="block" htmlFor={`${formId}-priorities`}>Prioridades (coma separadas)</label>
          <input id={`${formId}-priorities`} className="block" value={form.priorities} onChange={(e) => setForm({ ...form, priorities: e.target.value })} placeholder="Baja, Media, Alta, Crítica" />
          <label className="block" htmlFor={`${formId}-departments`}>Departamentos (coma separadas)</label>
          <input id={`${formId}-departments`} className="block" value={form.departments} onChange={(e) => setForm({ ...form, departments: e.target.value })} placeholder="Desarrollo, Marketing" />
          <label className="block" htmlFor={`${formId}-specialties`}>Especialidades (coma separadas)</label>
          <input id={`${formId}-specialties`} className="block" value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Redes, Software" />
        </div>
      </div>
      <div className="actions-right"><button className="btn btn--primary" onClick={handleSave}>Guardar configuración</button></div>
    </div>
  )
}


function SuggestionInput({ id, label, value, onChange, placeholder, suggestions, listId }) {
  const items = (suggestions || []).filter(Boolean)

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} list={items.length ? listId : undefined} onChange={onChange} placeholder={placeholder} />
      {items.length > 0 && (
        <datalist id={listId}>
          {items.map((item) => <option key={item} value={item} />)}
        </datalist>
      )}
    </>
  )
}

function sanitizePhone(value) {
  const cleaned = value.replace(/[^0-9+\s()-]/g, '')
  return cleaned.startsWith('+34') ? cleaned : cleaned.replace(/^\+/, '')
}

function readStoredSession() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function persistSession(session) {
  if (typeof window === 'undefined') return
  if (!session.token) {
    clearStoredSession()
    return
  }
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

function clearStoredSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

function defaultViewForRole(role) {
  return ROLE_DEFAULT_VIEWS[role] || 'admin-dashboard'
}

function isValidViewForRole(view, role) {
  if (!view) return false
  return roleMenuFor(role).some((item) => item.key === resolveActiveKey(view))
    || ['admin-user-edit', 'admin-empresas-create', 'admin-empresas-edit', 'admin-jefes-create', 'admin-admins-create', 'admin-supervisores-create', 'jefe-empleados-create', 'jefe-empleados-edit', 'jefe-tecnicos-create', 'jefe-tecnicos-edit', 'jefe-incidencias-edit', 'emp-edit', 'tec-gestionar'].includes(view)
}

function roleMenuFor(role) {
  if (role === 'admin') return ADMIN_MENU
  if (role === 'supervisor') return SUPERVISOR_MENU
  if (role === 'jefe_empresa') return JEFE_MENU
  if (role === 'empleado') return EMPLEADO_MENU
  return TECNICO_MENU
}

function normalizePhoneForSave(value) {
  const cleaned = sanitizePhone(value).trim()
  if (!cleaned) return ''
  if (cleaned.startsWith('+34')) return cleaned

  const digits = cleaned.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('34')) return `+${digits}`

  return `+34 ${digits}`
}

function repairMojibakeText(value) {
  if (typeof value !== 'string' || !/[ÃÂâ€]/.test(value)) return value

  try {
    const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 0xff))
    const repaired = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    return /�/.test(repaired) ? value : repaired
  } catch {
    return value
  }
}

function normalizeApiData(value) {
  if (typeof value === 'string') return repairMojibakeText(value)
  if (Array.isArray(value)) return value.map(normalizeApiData)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeApiData(entry)]))
  }
  return value
}

function validateUserForm(form, options = {}) {
  const normalizedPhone = normalizePhoneForSave(form.phone)
  if (!form.name?.trim()) return 'El nombre es obligatorio'
  if (!form.email?.trim()) return 'El email es obligatorio'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'El email no es valido'
  if (!options.passwordOptional && !form.password?.trim()) return 'La contraseña es obligatoria'
  if (form.password && form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (normalizedPhone && !new RegExp(PHONE_PATTERN).test(normalizedPhone)) return 'El teléfono no es valido'
  if (options.requireCompany && !form.company_id) return 'Debes seleccionar una empresa'
  return null
}

function validateCompanyForm(form) {
  const normalizedPhone = normalizePhoneForSave(form.phone)
  if (!form.name?.trim()) return 'El nombre de empresa es obligatorio'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'El email no es valido'
  if (normalizedPhone && !new RegExp(PHONE_PATTERN).test(normalizedPhone)) return 'El teléfono no es valido'
  if (form.cif && !new RegExp(CIF_PATTERN).test(form.cif)) return 'El CIF no es valido'
  return null
}

function validateIncidentForm(form) {
  if (!form.title?.trim()) return 'El título es obligatorio'
  if (!form.description?.trim()) return 'La descripción es obligatoria'
  if (form.title.trim().length > 255) return 'El título no puede superar 255 caracteres'
  return null
}

function FormHeader({ title, onBack }) {
  return (
    <div className="form-header">
      <button type="button" className="back" aria-label="Volver" onClick={onBack}>←</button>
      <h3>{title}</h3>
    </div>
  )
}

function CrearEmpresa({ onBack, onCreate, notifyError }) {
  const formId = useId()
  const [form, setForm] = useState({ name: '', cif: '', address: '', email: '', phone: '', status: 'active' })
  const submit = () => {
    const error = validateCompanyForm(form)
    if (error) {
      notifyError?.(error)
      return
    }
    onCreate({ ...form, phone: normalizePhoneForSave(form.phone) || null })
  }

  return (
    <div className="panel form">
      <FormHeader title="Crear empresa" onBack={onBack} />
      <label htmlFor={`${formId}-name`}>Nombre de empresa</label>
      <input id={`${formId}-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label htmlFor={`${formId}-cif`}>CIF / Identificador</label>
      <input id={`${formId}-cif`} value={form.cif} onChange={(e) => setForm({ ...form, cif: e.target.value.toUpperCase() })} pattern={CIF_PATTERN} />
      <label htmlFor={`${formId}-address`}>Dirección</label>
      <input id={`${formId}-address`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <label htmlFor={`${formId}-email`}>Email</label>
      <input id={`${formId}-email`} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <label htmlFor={`${formId}-phone`}>Teléfono</label>
      <input id={`${formId}-phone`} type="tel" inputMode="tel" pattern={PHONE_PATTERN} autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label htmlFor={`${formId}-status`}>Estado</label>
      <select id={`${formId}-status`} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option value="active">Activa</option>
        <option value="inactive">Inactiva</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Guardar empresa</button>
    </div>
  )
}

function EditarEmpresa({ company, onBack, onSave, notifyError }) {
  const formId = useId()
  const [form, setForm] = useState({ name: '', cif: '', address: '', email: '', phone: '', status: 'active' })

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        cif: company.cif || '',
        address: company.address || '',
        email: company.email || '',
        phone: company.phone || '',
        status: company.status || 'active',
      })
    }
  }, [company])

  if (!company) return <div className="panel">Selecciona una empresa</div>

  const submit = () => {
    const error = validateCompanyForm(form)
    if (error) {
      notifyError?.(error)
      return
    }
    onSave({ ...form, phone: normalizePhoneForSave(form.phone) || null })
  }

  return (
    <div className="panel form">
      <FormHeader title="Editar empresa" onBack={onBack} />
      <label htmlFor={`${formId}-name`}>Nombre de empresa</label>
      <input id={`${formId}-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label htmlFor={`${formId}-cif`}>CIF / Identificador</label>
      <input id={`${formId}-cif`} value={form.cif} onChange={(e) => setForm({ ...form, cif: e.target.value.toUpperCase() })} pattern={CIF_PATTERN} />
      <label htmlFor={`${formId}-address`}>Dirección</label>
      <input id={`${formId}-address`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <label htmlFor={`${formId}-email`}>Email</label>
      <input id={`${formId}-email`} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <label htmlFor={`${formId}-phone`}>Teléfono</label>
      <input id={`${formId}-phone`} type="tel" inputMode="tel" pattern={PHONE_PATTERN} autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label htmlFor={`${formId}-status`}>Estado</label>
      <select id={`${formId}-status`} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option value="active">Activa</option>
        <option value="inactive">Inactiva</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Guardar cambios</button>
    </div>
  )
}

function CrearJefe({ onBack, onCreate, companies, notifyError }) {
  const formId = useId()
  const [form, setForm] = useState({ name: '', last_name: '', email: '', password: '', company_id: '', phone: '', active: true })
  const submit = () => {
    const error = validateUserForm(form, { requireCompany: true })
    if (error) {
      notifyError?.(error)
      return
    }
    onCreate({ ...form, role: 'jefe_empresa', phone: normalizePhoneForSave(form.phone) || null })
  }

  return (
    <div className="panel form">
      <FormHeader title="Crear jefe de empresa" onBack={onBack} />
      <label htmlFor={`${formId}-name`}>Nombre</label>
      <input id={`${formId}-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label htmlFor={`${formId}-last-name`}>Apellidos</label>
      <input id={`${formId}-last-name`} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      <label htmlFor={`${formId}-email`}>Email</label>
      <input id={`${formId}-email`} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <label htmlFor={`${formId}-password`}>Contraseña</label>
      <input id={`${formId}-password`} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <label htmlFor={`${formId}-company`}>Empresa asignada</label>
      <select id={`${formId}-company`} value={form.company_id} onChange={(e) => setForm({ ...form, company_id: Number(e.target.value) })}>
        <option value="">Seleccionar...</option>
        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <label htmlFor={`${formId}-phone`}>Teléfono</label>
      <input id={`${formId}-phone`} type="tel" inputMode="tel" pattern={PHONE_PATTERN} autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label htmlFor={`${formId}-active`}>Estado</label>
      <select id={`${formId}-active`} value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
        <option value="1">Activo</option>
        <option value="0">Inactivo</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Crear jefe</button>
    </div>
  )
}

function CrearAdmin({ onBack, onCreate, notifyError }) {
  const formId = useId()
  const [form, setForm] = useState({ name: '', last_name: '', email: '', password: '', phone: '', active: true })
  const submit = () => {
    const error = validateUserForm(form)
    if (error) {
      notifyError?.(error)
      return
    }
    onCreate({ ...form, role: 'admin', phone: normalizePhoneForSave(form.phone) || null })
  }

  return (
    <div className="panel form">
      <FormHeader title="Crear administrador" onBack={onBack} />
      <label htmlFor={`${formId}-name`}>Nombre</label>
      <input id={`${formId}-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label htmlFor={`${formId}-last-name`}>Apellidos</label>
      <input id={`${formId}-last-name`} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      <label htmlFor={`${formId}-email`}>Email</label>
      <input id={`${formId}-email`} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <label htmlFor={`${formId}-password`}>Contraseña</label>
      <input id={`${formId}-password`} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <label htmlFor={`${formId}-phone`}>Teléfono</label>
      <input id={`${formId}-phone`} type="tel" inputMode="tel" pattern={PHONE_PATTERN} autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label htmlFor={`${formId}-active`}>Estado</label>
      <select id={`${formId}-active`} value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
        <option value="1">Activo</option>
        <option value="0">Inactivo</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Crear administrador</button>
    </div>
  )
}

function CrearSupervisor({ onBack, onCreate, notifyError }) {
  const formId = useId()
  const [form, setForm] = useState({ name: '', last_name: '', email: '', password: '', phone: '', active: true })
  const submit = () => {
    const error = validateUserForm(form)
    if (error) {
      notifyError?.(error)
      return
    }
    onCreate({ ...form, role: 'supervisor', phone: normalizePhoneForSave(form.phone) || null })
  }

  return (
    <div className="panel form">
      <FormHeader title="Crear supervisor" onBack={onBack} />
      <label htmlFor={`${formId}-name`}>Nombre</label>
      <input id={`${formId}-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label htmlFor={`${formId}-last-name`}>Apellidos</label>
      <input id={`${formId}-last-name`} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      <label htmlFor={`${formId}-email`}>Email</label>
      <input id={`${formId}-email`} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <label htmlFor={`${formId}-password`}>Contraseña</label>
      <input id={`${formId}-password`} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <label htmlFor={`${formId}-phone`}>Teléfono</label>
      <input id={`${formId}-phone`} type="tel" inputMode="tel" pattern={PHONE_PATTERN} autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label htmlFor={`${formId}-active`}>Estado</label>
      <select id={`${formId}-active`} value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
        <option value="1">Activo</option>
        <option value="0">Inactivo</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Crear supervisor</button>
    </div>
  )
}

function CrearEmpleado({ onBack, onCreate, settings, notifyError }) {
  const formId = useId()
  const [form, setForm] = useState({ name: '', last_name: '', email: '', password: '', department: '', phone: '', active: true })
  const departments = settings?.departments || []
  const submit = () => {
    const error = validateUserForm(form)
    if (error) {
      notifyError?.(error)
      return
    }
    onCreate({ ...form, role: 'empleado', phone: normalizePhoneForSave(form.phone) || null })
  }

  return (
    <div className="panel form">
      <FormHeader title="Crear empleado" onBack={onBack} />
      <label htmlFor={`${formId}-name`}>Nombre</label>
      <input id={`${formId}-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label htmlFor={`${formId}-last-name`}>Apellidos</label>
      <input id={`${formId}-last-name`} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      <label htmlFor={`${formId}-email`}>Email</label>
      <input id={`${formId}-email`} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <label htmlFor={`${formId}-password`}>Contraseña</label>
      <input id={`${formId}-password`} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <SuggestionInput
        id={`${formId}-department`}
        label="Departamento (opcional)"
        value={form.department}
        suggestions={departments}
        listId="employee-departments"
        placeholder="Desarrollo, Marketing..."
        onChange={(e) => setForm({ ...form, department: e.target.value })}
      />
      <label htmlFor={`${formId}-phone`}>Teléfono</label>
      <input id={`${formId}-phone`} type="tel" inputMode="tel" pattern={PHONE_PATTERN} autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label htmlFor={`${formId}-active`}>Estado</label>
      <select id={`${formId}-active`} value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
        <option value="1">Activo</option>
        <option value="0">Inactivo</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Crear empleado</button>
    </div>
  )
}

function CrearTecnico({ onBack, onCreate, settings, notifyError }) {
  const formId = useId()
  const [form, setForm] = useState({ name: '', last_name: '', email: '', password: '', specialty: '', phone: '', active: true })
  const specialties = settings?.specialties || []
  const submit = () => {
    const error = validateUserForm(form)
    if (error) {
      notifyError?.(error)
      return
    }
    onCreate({ ...form, role: 'tecnico', phone: normalizePhoneForSave(form.phone) || null })
  }

  return (
    <div className="panel form">
      <FormHeader title="Crear técnico" onBack={onBack} />
      <label htmlFor={`${formId}-name`}>Nombre</label>
      <input id={`${formId}-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label htmlFor={`${formId}-last-name`}>Apellidos</label>
      <input id={`${formId}-last-name`} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      <label htmlFor={`${formId}-email`}>Email</label>
      <input id={`${formId}-email`} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <label htmlFor={`${formId}-password`}>Contraseña</label>
      <input id={`${formId}-password`} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <SuggestionInput
        id={`${formId}-specialty`}
        label="Especialidad (opcional)"
        value={form.specialty}
        suggestions={specialties}
        listId="technician-specialties"
        placeholder="Redes, Software..."
        onChange={(e) => setForm({ ...form, specialty: e.target.value })}
      />
      <label htmlFor={`${formId}-phone`}>Teléfono</label>
      <input id={`${formId}-phone`} type="tel" inputMode="tel" pattern={PHONE_PATTERN} autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label htmlFor={`${formId}-active`}>Estado</label>
      <select id={`${formId}-active`} value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
        <option value="1">Activo</option>
        <option value="0">Inactivo</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Crear técnico</button>
    </div>
  )
}

function labelStatus(name) {
  if (name === 'en_progreso') return 'En proceso'
  if (name === 'resuelta') return 'Resuelta'
  if (name === 'cerrada') return 'Cerrada'
  return 'Abierta'
}

function statusClass(label) {
  if (label === 'Abierta') return 'abierta'
  if (label === 'En proceso') return 'proceso'
  if (label === 'Resuelta') return 'resuelta'
  return 'cerrada'
}

function labelPriority(p) {
  if (p === 'urgent') return 'Crítica'
  if (p === 'high') return 'Alta'
  if (p === 'medium') return 'Media'
  return 'Baja'
}

function priorityClass(p) {
  if (p === 'urgent') return 'critica'
  if (p === 'high') return 'alta'
  if (p === 'medium') return 'media'
  return 'baja'
}

function formatDate(date) {
  if (!date) return '-'
  return String(date).slice(0, 10)
}

function splitCsv(val) {
  return val.split(',').map((s) => s.trim()).filter(Boolean)
}

function mapStatusToApi(name) {
  if (name === 'en_progreso') return 'in_progress'
  if (name === 'resuelta') return 'resolved'
  if (name === 'cerrada') return 'closed'
  return 'open'
}

export default App
