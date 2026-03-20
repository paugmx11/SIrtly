import { useEffect, useMemo, useState } from 'react'
import './App.css'

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
  { key: 'admin-dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'admin-empresas', label: 'Empresas', icon: 'building' },
  { key: 'admin-jefes', label: 'Jefes de empresa', icon: 'briefcase' },
  { key: 'admin-admins', label: 'Administradores', icon: 'shield' },
  { key: 'admin-supervisores', label: 'Supervisores', icon: 'eye' },
  { key: 'admin-estadisticas', label: 'Estadísticas', icon: 'chart' },
]

const SUPERVISOR_MENU = [
  { key: 'sup-dashboard', label: 'Dashboard', icon: 'grid' },
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
  { key: 'tec-asignadas', label: 'Incidencias asignadas', icon: 'file' },
]

const API_BASE = 'http://127.0.0.1:8000/api'
const API_ROOT = API_BASE.replace('/api', '')
const PHONE_PATTERN = '^\\+?[0-9\\s()\\-]{7,20}$'
const CIF_PATTERN = '^[A-Za-z0-9\\-]{5,20}$'

function App() {
  const [token, setToken] = useState('')
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('admin')
  const [view, setView] = useState('admin-dashboard')
  const [selectedIncidentId, setSelectedIncidentId] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUserSource, setSelectedUserSource] = useState(null)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const [data, setData] = useState({
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

  const menu = useMemo(() => {
    if (role === 'admin') return ADMIN_MENU
    if (role === 'supervisor') return SUPERVISOR_MENU
    if (role === 'jefe_empresa') return JEFE_MENU
    if (role === 'empleado') return EMPLEADO_MENU
    return TECNICO_MENU
  }, [role])

  const runAction = async (action) => {
    try {
      await action()
    } catch (error) {
      alert(error.message || 'Ha ocurrido un error')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const email = form.get('email')
    const password = form.get('password')

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      alert('Credenciales inválidas')
      return
    }

    const payload = await res.json()
    setToken(payload.token)
    setUser(payload.user)
    setRole(payload.user?.role?.name || 'admin')
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

    return payload
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
      }
      updates.incidents = (await apiFetch('/incidents')).incidents || []
      setNotifications((await apiFetch('/notifications')).notifications || [])
    } catch (e) {
      // ignore
    }

    setData(updates)
  }

  useEffect(() => {
    if (token) {
      loadAll()
      const first = menu[0]
      setView(first?.key || 'admin-dashboard')
    }
  }, [token, role])

  if (!token) {
    return (
      <div className="login">
        <div className="login__brand">
          <div className="logo">S</div>
          <div>
            <div className="brand-title">Sirtly</div>
            <div className="brand-sub">Gestión de incidencias multiempresa</div>
          </div>
        </div>
        <div className="login__card">
          <h1>Iniciar sesión</h1>
          <p>Accede a tu panel de gestión</p>
          <form onSubmit={handleLogin}>
            <label>Email</label>
            <input name="email" type="email" placeholder="tu@empresa.com" />
            <label>Contraseña</label>
            <input name="password" type="password" placeholder="••••••••" />
            <button className="btn btn--primary" type="submit">Iniciar sesión</button>
          </form>
        </div>
        <div className="login__panel">
          <h3>Plataforma completa para:</h3>
          <ul>
            <li>Gestión centralizada de incidencias</li>
            <li>Múltiples empresas y roles</li>
            <li>Seguimiento en tiempo real</li>
            <li>Estadísticas y reportes avanzados</li>
          </ul>
        </div>
        <div className="login__footer">© 2026 Sirtly. Todos los derechos reservados.</div>
      </div>
    )
  }

  const activeKey = resolveActiveKey(view, selectedUserSource)
  const profileName = `${user?.name || ''} ${user?.last_name || ''}`.trim() || 'Usuario'
  const unreadCount = notifications.filter((n) => !n.read_at).length

  const markNotificationRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'POST' })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
    } catch {
      // ignore
    }
  }

  const markAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' })
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
    } catch {
      // ignore
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="logo">S</div>
          <div>
            <div className="brand-title">Sirtly</div>
            <div className="brand-sub">{ROLE_LABELS[role]}</div>
          </div>
        </div>
        <nav className="sidebar__nav">
          {menu.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeKey === item.key ? 'active' : ''}`}
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
        <button className="logout" onClick={async () => {
          try { await apiFetch('/auth/logout', { method: 'POST' }) } catch { }
          setToken('')
        }}>Cerrar sesión</button>
      </aside>

      <div className="content">
        <header className="topbar">
          <div className="topbar__title">{resolveTitle(view)}</div>
          <div className="topbar__actions">
            <div className="notifications">
              <button
                className="bell"
                title={`${notifications.length} notificaciones`}
                onClick={() => setNotificationsOpen((v) => !v)}
              >
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>
              {notificationsOpen && (
                <div className="notifications__panel">
                  <div className="notifications__header">
                    <span>Notificaciones</span>
                    <button className="link" onClick={markAllRead}>Marcar todo leído</button>
                  </div>
                  {notifications.length === 0 && <div className="muted">Sin notificaciones</div>}
                  <ul>
                    {notifications.map((n) => (
                      <li key={n.id} className={n.read_at ? '' : 'unread'}>
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-body">{n.body}</div>
                        <div className="notif-meta">
                          <span>{formatDate(n.created_at)}</span>
                          {!n.read_at && <button className="link" onClick={() => markNotificationRead(n.id)}>Marcar leído</button>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="profile">
              <div className="avatar">{profileName[0]}</div>
              <span>{profileName}</span>
            </div>
          </div>
        </header>

        <main className="main">
          {renderView(view, role, setView, {
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
          })}
        </main>
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
    'sup-empresas': 'Empresas',
    'sup-estadisticas': 'Estadísticas',
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
    'tec-asignadas': 'Incidencias asignadas',
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
    'tec-gestionar': 'tec-asignadas',
  }
  return map[view] || view
}

function renderView(view, role, onNavigate, ctx) {
  const { data, setSelectedIncidentId, selectedIncidentId, apiFetch, runAction, loadAll, selectedUser, setSelectedUser, selectedUserSource, setSelectedUserSource, selectedCompany, setSelectedCompany, notifications } = ctx
  if (role === 'admin') {
    if (view === 'admin-dashboard') return <AdminDashboard stats={data.statsSystem} incidents={data.incidents} />
    if (view === 'admin-empresas') return <EmpresasList data={data.companies} onCreate={() => onNavigate('admin-empresas-create')} onEdit={(company) => { setSelectedCompany(company); onNavigate('admin-empresas-edit') }} />
    if (view === 'admin-empresas-create') return <CrearEmpresa onBack={() => onNavigate('admin-empresas')} onCreate={(payload) => runAction(async () => { await apiFetch('/companies', { method: 'POST', body: JSON.stringify(payload) }); await loadAll(); onNavigate('admin-empresas'); })} />
    if (view === 'admin-empresas-edit') return <EditarEmpresa company={selectedCompany} onBack={() => onNavigate('admin-empresas')} onSave={(payload) => runAction(async () => { await apiFetch(`/companies/${selectedCompany.id}`, { method: 'PUT', body: JSON.stringify(payload) }); await loadAll(); onNavigate('admin-empresas'); })} />
    if (view === 'admin-jefes') return <JefesList
      users={data.users}
      onCreate={() => onNavigate('admin-jefes-create')}
      onEdit={(u) => { setSelectedUser(u); setSelectedUserSource('admin-jefes'); onNavigate('admin-user-edit'); }}
      onDelete={(u) => runAction(async () => { if (!confirm('¿Eliminar usuario?')) return; await apiFetch(`/users/${u.id}`, { method: 'DELETE' }); await loadAll(); })}
    />
    if (view === 'admin-jefes-create') return <CrearJefe companies={data.companies} onBack={() => onNavigate('admin-jefes')} onCreate={(payload) => runAction(async () => { await apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) }); await loadAll(); onNavigate('admin-jefes'); })} />
    if (view === 'admin-admins') return <AdminsList
      users={data.users}
      onCreate={() => onNavigate('admin-admins-create')}
      onEdit={(u) => { setSelectedUser(u); setSelectedUserSource('admin-admins'); onNavigate('admin-user-edit'); }}
      onDelete={(u) => runAction(async () => { if (!confirm('¿Eliminar usuario?')) return; await apiFetch(`/users/${u.id}`, { method: 'DELETE' }); await loadAll(); })}
    />
    if (view === 'admin-admins-create') return <CrearAdmin onBack={() => onNavigate('admin-admins')} onCreate={(payload) => runAction(async () => { await apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) }); await loadAll(); onNavigate('admin-admins'); })} />
    if (view === 'admin-supervisores') return <SupervisoresList
      users={data.users}
      onCreate={() => onNavigate('admin-supervisores-create')}
      onEdit={(u) => { setSelectedUser(u); setSelectedUserSource('admin-supervisores'); onNavigate('admin-user-edit'); }}
      onDelete={(u) => runAction(async () => { if (!confirm('¿Eliminar usuario?')) return; await apiFetch(`/users/${u.id}`, { method: 'DELETE' }); await loadAll(); })}
    />
    if (view === 'admin-user-edit') return <EditarUsuario
      user={selectedUser}
      onBack={() => onNavigate(selectedUserSource || 'admin-jefes')}
      onSave={(payload) => runAction(async () => { await apiFetch(`/users/${selectedUser.id}`, { method: 'PUT', body: JSON.stringify(payload) }); await loadAll(); onNavigate(selectedUserSource || 'admin-jefes'); })}
    />
    if (view === 'admin-supervisores-create') return <CrearSupervisor onBack={() => onNavigate('admin-supervisores')} onCreate={(payload) => runAction(async () => { await apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) }); await loadAll(); onNavigate('admin-supervisores'); })} />
    if (view === 'admin-estadisticas') return <EstadisticasSistema byCompany={data.byCompany} />
  }
  if (role === 'supervisor') {
    if (view === 'sup-dashboard') return <SupervisorDashboard stats={data.statsSystem} incidents={data.incidents} />
    if (view === 'sup-empresas') return <EmpresasList data={data.companies} readonly />
    if (view === 'sup-estadisticas') return <EstadisticasSistema byCompany={data.byCompany} />
  }
  if (role === 'jefe_empresa') {
    if (view === 'jefe-dashboard') return <JefeDashboard stats={data.statsCompany} incidents={data.incidents} />
    if (view === 'jefe-empleados') return <EmpleadosList
      users={data.users}
      onCreate={() => onNavigate('jefe-empleados-create')}
      onEdit={(u) => { setSelectedUser(u); onNavigate('jefe-empleados-edit'); }}
      onDelete={(u) => runAction(async () => { if (!confirm('¿Eliminar usuario?')) return; await apiFetch(`/users/${u.id}`, { method: 'DELETE' }); await loadAll(); })}
    />
    if (view === 'jefe-empleados-create') return <CrearEmpleado onBack={() => onNavigate('jefe-empleados')} onCreate={(payload) => runAction(async () => { await apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) }); await loadAll(); onNavigate('jefe-empleados'); })} />
    if (view === 'jefe-empleados-edit') return <EditarUsuario user={selectedUser} onBack={() => onNavigate('jefe-empleados')} onSave={(payload) => runAction(async () => { await apiFetch(`/users/${selectedUser.id}`, { method: 'PUT', body: JSON.stringify(payload) }); await loadAll(); onNavigate('jefe-empleados'); })} />
    if (view === 'jefe-tecnicos') return <TecnicosList
      users={data.users}
      onCreate={() => onNavigate('jefe-tecnicos-create')}
      onEdit={(u) => { setSelectedUser(u); onNavigate('jefe-tecnicos-edit'); }}
      onDelete={(u) => runAction(async () => { if (!confirm('¿Eliminar usuario?')) return; await apiFetch(`/users/${u.id}`, { method: 'DELETE' }); await loadAll(); })}
    />
    if (view === 'jefe-tecnicos-create') return <CrearTecnico onBack={() => onNavigate('jefe-tecnicos')} onCreate={(payload) => runAction(async () => { await apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) }); await loadAll(); onNavigate('jefe-tecnicos'); })} />
    if (view === 'jefe-tecnicos-edit') return <EditarUsuario user={selectedUser} onBack={() => onNavigate('jefe-tecnicos')} onSave={(payload) => runAction(async () => { await apiFetch(`/users/${selectedUser.id}`, { method: 'PUT', body: JSON.stringify(payload) }); await loadAll(); onNavigate('jefe-tecnicos'); })} />
    if (view === 'jefe-incidencias') return <IncidenciasList
      incidents={data.incidents}
      onManage={(id) => { setSelectedIncidentId(id); onNavigate('tec-gestionar'); }}
      onEdit={(id) => { setSelectedIncidentId(id); onNavigate('jefe-incidencias-edit'); }}
      onDelete={(id) => runAction(async () => { if (!confirm('¿Eliminar incidencia?')) return; await apiFetch(`/incidents/${id}`, { method: 'DELETE' }); await loadAll(); })}
    />
    if (view === 'jefe-incidencias-edit') return <EditarIncidencia incident={data.incidents.find((i) => i.id === selectedIncidentId)} onBack={() => onNavigate('jefe-incidencias')} onSave={(payload) => runAction(async () => { await apiFetch(`/incidents/${selectedIncidentId}`, { method: 'PUT', body: JSON.stringify(payload) }); await loadAll(); onNavigate('jefe-incidencias'); })} />
    if (view === 'jefe-estadisticas') return <EstadisticasEmpresa byTechnician={data.byTechnician} />
    if (view === 'jefe-config') return <ConfiguracionEmpresa settings={data.settings} onSave={(payload) => runAction(async () => { await apiFetch('/company-settings', { method: 'PUT', body: JSON.stringify(payload) }); await loadAll(); })} />
  }
  if (role === 'empleado') {
    if (view === 'emp-dashboard') return <EmpleadoDashboard incidents={data.incidents} />
    if (view === 'emp-mis') return <MisIncidencias incidents={data.incidents} onCreate={() => onNavigate('emp-crear')} onEdit={(id) => { setSelectedIncidentId(id); onNavigate('emp-edit'); }} />
    if (view === 'emp-crear') return <CrearIncidencia settings={data.settings} onCreate={(payload, file) => runAction(async () => {
      const created = await apiFetch('/incidents', { method: 'POST', body: JSON.stringify(payload) })
      if (file && created?.incident?.id) {
        const formData = new FormData()
        formData.append('file', file)
        await apiFetch(`/incidents/${created.incident.id}/attachments`, { method: 'POST', body: formData })
      }
      await loadAll()
      onNavigate('emp-mis')
    })} />
    if (view === 'emp-edit') return <EditarIncidencia incident={data.incidents.find((i) => i.id === selectedIncidentId)} onBack={() => onNavigate('emp-mis')} onSave={(payload) => runAction(async () => { await apiFetch(`/incidents/${selectedIncidentId}`, { method: 'PUT', body: JSON.stringify(payload) }); await loadAll(); onNavigate('emp-mis'); })} />
  }
  if (role === 'tecnico') {
    if (view === 'tec-dashboard') return <TecnicoDashboard incidents={data.incidents} />
    if (view === 'tec-asignadas') return <IncidenciasAsignadas incidents={data.incidents} onManage={(id) => { setSelectedIncidentId(id); onNavigate('tec-gestionar'); }} />
    if (view === 'tec-gestionar') return <GestionarIncidencia incident={data.incidents.find((i) => i.id === selectedIncidentId)} apiFetch={apiFetch} onUpdated={loadAll} notifications={notifications} />
  }
  return <div className="panel">Vista no disponible</div>
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

function RecentTable({ rows, personLabel = 'Técnico' }) {
  return (
    <div className="panel">
      <div className="panel__title">Actividad reciente</div>
      <table className="table">
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
              <td>{r.title}</td>
              <td>{r.person}</td>
              <td><span className={`pill ${r.priorityClass}`}>{r.priority}</span></td>
              <td><span className={`pill ${r.statusClass}`}>{r.status}</span></td>
              <td>{r.date}</td>
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
    { label: 'Incidencias', value: stats?.incidents || 0, icon: '📄', color: 'indigo' },
    { label: 'Abiertas', value: stats?.open || 0, icon: '•', color: 'gray' },
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
      <h2 className="section-title">Dashboard — <span>Administrador</span></h2>
      <StatCards cards={cards} />
      <RecentTable rows={rows} />
    </div>
  )
}

function SupervisorDashboard({ stats, incidents }) {
  const cards = [
    { label: 'Empresas', value: stats?.companies || 0, icon: '🏢', color: 'blue' },
    { label: 'Total incidencias', value: stats?.incidents || 0, icon: '📄', color: 'purple' },
    { label: 'Abiertas', value: stats?.open || 0, icon: '•', color: 'gray' },
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
      <h2 className="section-title">Dashboard — <span>Supervisor</span></h2>
      <StatCards cards={cards} />
      <RecentTable rows={rows} />
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
  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <h3>Empresas</h3>
        </div>
        {!readonly && <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear empresa</button>}
      </div>
      <div className="search">
        <input placeholder="Buscar..." />
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
          {data.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.cif || '-'}</td>
              <td>{c.email || '-'}</td>
              <td>{c.phone || '-'}</td>
              <td><span className={`pill ${c.status === 'active' ? 'activa' : 'inactiva'}`}>{c.status === 'active' ? 'Activa' : 'Inactiva'}</span></td>
              {!readonly && (
                <td className="actions">
                  <button className="icon-btn" onClick={() => onEdit?.(c)}>✏️</button>
                  <button className="icon-btn">🗑️</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel__footer">{data.length} registros encontrados</div>
    </div>
  )
}

function JefesList({ users, onCreate, onEdit, onDelete }) {
  const rows = users.filter((u) => u.role?.name === 'jefe_empresa')
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Jefes de empresa</h3>
        <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear jefe</button>
      </div>
      <div className="search">
        <input placeholder="Buscar..." />
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
                <button className="icon-btn" onClick={() => onEdit(r)}>✏️</button>
                <button className="icon-btn" onClick={() => onDelete?.(r)}>🗑️</button>
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
  const rows = users.filter((u) => u.role?.name === 'admin')
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Administradores</h3>
        <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear administrador</button>
      </div>
      <div className="search">
        <input placeholder="Buscar..." />
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
                <button className="icon-btn" onClick={() => onEdit?.(r)}>✏️</button>
                <button className="icon-btn" onClick={() => onDelete?.(r)}>🗑️</button>
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
  const rows = users.filter((u) => u.role?.name === 'supervisor')
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Supervisores</h3>
        <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear supervisor</button>
      </div>
      <div className="search">
        <input placeholder="Buscar..." />
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
                <button className="icon-btn" onClick={() => onEdit?.(r)}>✏️</button>
                <button className="icon-btn" onClick={() => onDelete?.(r)}>🗑️</button>
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
  const rows = users.filter((u) => u.role?.name === 'empleado')
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Empleados</h3>
        <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear empleado</button>
      </div>
      <div className="search">
        <input placeholder="Buscar..." />
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
                <button className="icon-btn" onClick={() => onEdit(r)}>✏️</button>
                <button className="icon-btn" onClick={() => onDelete?.(r)}>🗑️</button>
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
  const rows = users.filter((u) => u.role?.name === 'tecnico')
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Técnicos</h3>
        <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear técnico</button>
      </div>
      <div className="search">
        <input placeholder="Buscar..." />
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
                <button className="icon-btn" onClick={() => onEdit(r)}>✏️</button>
                <button className="icon-btn" onClick={() => onDelete?.(r)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel__footer">{rows.length} registros encontrados</div>
    </div>
  )
}

function IncidenciasList({ incidents, onManage, onEdit, onDelete }) {
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Incidencias</h3>
      </div>
      <div className="search">
        <input placeholder="Buscar..." />
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
          {incidents.map((i) => (
            <tr key={i.id}>
              <td>{i.title}</td>
              <td>{i.creator?.name || '-'}</td>
              <td>{i.assignee?.name || '-'}</td>
              <td><span className={`pill ${priorityClass(i.priority)}`}>{labelPriority(i.priority)}</span></td>
              <td><span className={`pill ${statusClass(labelStatus(i.status?.name))}`}>{labelStatus(i.status?.name)}</span></td>
              <td>{formatDate(i.created_at)}</td>
              <td className="actions">
                <button className="icon-btn" onClick={() => onEdit(i.id)}>✏️</button>
                {onDelete && <button className="icon-btn" onClick={() => onDelete(i.id)}>🗑️</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel__footer">{incidents.length} registros encontrados</div>
    </div>
  )
}

function MisIncidencias({ incidents, onCreate, onEdit }) {
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Mis incidencias</h3>
        <button className="btn btn--primary" onClick={onCreate}><span>+</span> Crear incidencia</button>
      </div>
      <div className="search">
        <input placeholder="Buscar..." />
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
          {incidents.map((i) => (
            <tr key={i.id}>
              <td>{i.title}</td>
              <td>{i.creator?.name || '-'}</td>
              <td><span className={`pill ${priorityClass(i.priority)}`}>{labelPriority(i.priority)}</span></td>
              <td><span className={`pill ${statusClass(labelStatus(i.status?.name))}`}>{labelStatus(i.status?.name)}</span></td>
              <td>{formatDate(i.created_at)}</td>
              <td className="actions">
                <button className="icon-btn" onClick={() => onEdit(i.id)}>✏️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel__footer">{incidents.length} registros encontrados</div>
    </div>
  )
}

function IncidenciasAsignadas({ incidents, onManage }) {
  const rows = incidents.filter((i) => i.assigned_to)
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Incidencias asignadas</h3>
      </div>
      <div className="search">
        <input placeholder="Buscar..." />
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
                <button className="icon-btn" onClick={() => onManage(i.id)}>✏️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="panel__footer">{rows.length} registros encontrados</div>
    </div>
  )
}

function CrearIncidencia({ onCreate, settings }) {
  const [form, setForm] = useState({ title: '', description: '', category: '', priority: 'medium' })
  const [file, setFile] = useState(null)
  const categories = settings?.categories || []
  const submit = () => {
    const error = validateIncidentForm(form)
    if (error) {
      alert(error)
      return
    }
    onCreate(form, file)
  }
  return (
    <div className="panel form">
      <h3>Crear incidencia</h3>
      <label>Título</label>
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Describe brevemente el problema" />
      <label>Descripción</label>
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalla el problema con toda la información posible..." />
      <label>Categoría</label>
      {categories.length > 0 ? (
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="">Seleccionar...</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      ) : (
        <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Redes, Software..." />
      )}
      <label>Prioridad</label>
      <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      <label>Adjuntar archivo (opcional)</label>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button className="btn btn--primary" onClick={submit}>Crear incidencia</button>
    </div>
  )
}

function EditarIncidencia({ incident, onBack, onSave }) {
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
      alert(error)
      return
    }
    onSave(form)
  }

  return (
    <div className="panel form">
      <FormHeader title="Editar incidencia" onBack={onBack} />
      <label>Título</label>
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <label>Descripción</label>
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <label>Categoría</label>
      <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
      <label>Prioridad</label>
      <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
        <option value="low">Baja</option>
        <option value="medium">Media</option>
        <option value="high">Alta</option>
        <option value="urgent">Crítica</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Guardar cambios</button>
    </div>
  )
}

function EditarUsuario({ user, onBack, onSave }) {
  const [form, setForm] = useState({ name: '', last_name: '', email: '', phone: '', department: '', specialty: '', password: '', active: true })
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
      alert(error)
      return
    }

    const payload = {
      name: form.name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
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
      <label>Nombre</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <label>Apellidos</label>
      <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      <label>Email</label>
      <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <label>Teléfono</label>
      <input type="tel" inputMode="tel" pattern={PHONE_PATTERN} value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label>Departamento</label>
      <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
      <label>Especialidad</label>
      <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
      <label>Nueva contraseña (opcional)</label>
      <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <label>Estado</label>
      <select value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
        <option value="1">Activo</option>
        <option value="0">Inactivo</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Guardar cambios</button>
    </div>
  )
}

function GestionarIncidencia({ incident, apiFetch, onUpdated }) {
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
    await apiFetch(`/incidents/${incident.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    await onUpdated()
  }

  const addComment = async () => {
    if (!comment.trim()) return
    await apiFetch(`/incidents/${incident.id}/comments`, { method: 'POST', body: JSON.stringify({ comment }) })
    setComment('')
    const c = await apiFetch(`/incidents/${incident.id}/comments`)
    setComments(c.comments || [])
  }

  const uploadAttachment = async () => {
    if (!uploadFile) return
    const formData = new FormData()
    formData.append('file', uploadFile)
    await apiFetch(`/incidents/${incident.id}/attachments`, { method: 'POST', body: formData })
    setUploadFile(null)
    const a = await apiFetch(`/incidents/${incident.id}/attachments`)
    setAttachments(a.attachments || [])
  }

  return (
    <div className="grid-2">
      <div className="panel">
        <div className="panel__header">
          <h3>Gestionar incidencia</h3>
        </div>
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
        <label>Cambiar estado</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">Abierta</option>
          <option value="in_progress">En proceso</option>
          <option value="resolved">Resuelta</option>
          <option value="closed">Cerrada</option>
        </select>
        <button className="btn btn--success" onClick={updateStatus}>Guardar estado</button>
        <div className="panel__title">Adjuntos</div>
        <ul className="file-list">
          {attachments.map((a) => (
            <li key={a.id}>
              <a href={`${API_ROOT}/storage/${a.file_path}`} target="_blank" rel="noreferrer">{a.file_path}</a>
            </li>
          ))}
        </ul>
        <div className="upload-row">
          <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
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
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Escribe un comentario..." />
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
  return (
    <div>
      <h2 className="section-title">Estadísticas <span>del sistema</span></h2>
      <div className="panel">
        <div className="panel__title">Incidencias por empresa</div>
        <div className="bar-list">
          {byCompany.map((row) => (
            <div key={row.company_id} className="bar-row">
              <span>{row.company}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(row.total * 5, 100)}%` }} /></div>
              <span className="muted">{row.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EstadisticasEmpresa({ byTechnician }) {
  return (
    <div>
      <h2 className="section-title">Estadísticas <span>de empresa</span></h2>
      <div className="panel">
        <div className="panel__title">Incidencias por técnico</div>
        <div className="bar-list">
          {byTechnician.map((row) => (
            <div key={row.technician_id} className="bar-row">
              <span>{row.technician}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(row.total * 8, 100)}%` }} /></div>
              <span className="muted">{row.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConfiguracionEmpresa({ settings, onSave }) {
  const [form, setForm] = useState({
    primary_color: settings?.primary_color || '#2D61E5',
    secondary_color: settings?.secondary_color || '#7C3AED',
    system_name: settings?.system_name || '',
    assignment_mode: settings?.assignment_mode || 'manual',
    categories: (settings?.categories || []).join(', '),
    priorities: (settings?.priorities || []).join(', '),
    departments: (settings?.departments || []).join(', '),
    specialties: (settings?.specialties || []).join(', '),
  })

  useEffect(() => {
    if (settings) {
      setForm({
        primary_color: settings.primary_color || '#2D61E5',
        secondary_color: settings.secondary_color || '#7C3AED',
        system_name: settings.system_name || '',
        assignment_mode: settings.assignment_mode || 'manual',
        categories: (settings.categories || []).join(', '),
        priorities: (settings.priorities || []).join(', '),
        departments: (settings.departments || []).join(', '),
        specialties: (settings.specialties || []).join(', '),
      })
    }
  }, [settings])

  const handleSave = () => {
    onSave({
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      system_name: form.system_name,
      assignment_mode: form.assignment_mode,
      categories: splitCsv(form.categories),
      priorities: splitCsv(form.priorities),
      departments: splitCsv(form.departments),
      specialties: splitCsv(form.specialties),
    })
  }

  return (
    <div>
      <h2 className="section-title">Configuración de empresa</h2>
      <div className="grid-2">
        <div className="panel">
          <div className="panel__title">Personalización visual</div>
          <div className="color-row">
            <span className="color-dot" style={{ background: form.primary_color }} />
            <span className="color-dot" style={{ background: form.secondary_color }} />
          </div>
          <label>Nombre visible</label>
          <input value={form.system_name} onChange={(e) => setForm({ ...form, system_name: e.target.value })} placeholder="TechSolutions S.L." />
        </div>
        <div className="panel">
          <div className="panel__title">Funcionalidades</div>
          <label className="block">Modo de asignación</label>
          <select className="block" value={form.assignment_mode} onChange={(e) => setForm({ ...form, assignment_mode: e.target.value })}>
            <option value="manual">Manual</option>
            <option value="auto">Automático</option>
            <option value="specialty">Por especialidad</option>
          </select>
          <label className="block">Categorías (coma separadas)</label>
          <input className="block" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} placeholder="Hardware, Software, Red" />
          <label className="block">Prioridades (coma separadas)</label>
          <input className="block" value={form.priorities} onChange={(e) => setForm({ ...form, priorities: e.target.value })} placeholder="Baja, Media, Alta, Crítica" />
          <label className="block">Departamentos (coma separadas)</label>
          <input className="block" value={form.departments} onChange={(e) => setForm({ ...form, departments: e.target.value })} placeholder="Desarrollo, Marketing" />
          <label className="block">Especialidades (coma separadas)</label>
          <input className="block" value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Redes, Software" />
        </div>
      </div>
      <div className="actions-right"><button className="btn btn--primary" onClick={handleSave}>Guardar configuración</button></div>
    </div>
  )
}

function sanitizePhone(value) {
  return value.replace(/[^0-9+\s()-]/g, '')
}

function validateUserForm(form, options = {}) {
  if (!form.name?.trim()) return 'El nombre es obligatorio'
  if (!form.email?.trim()) return 'El email es obligatorio'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'El email no es valido'
  if (!options.passwordOptional && !form.password?.trim()) return 'La contraseña es obligatoria'
  if (form.password && form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  if (form.phone && !new RegExp(PHONE_PATTERN).test(form.phone)) return 'El teléfono no es valido'
  if (options.requireCompany && !form.company_id) return 'Debes seleccionar una empresa'
  return null
}

function validateCompanyForm(form) {
  if (!form.name?.trim()) return 'El nombre de empresa es obligatorio'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'El email no es valido'
  if (form.phone && !new RegExp(PHONE_PATTERN).test(form.phone)) return 'El teléfono no es valido'
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
      <button className="back" onClick={onBack}>←</button>
      <h3>{title}</h3>
    </div>
  )
}

function CrearEmpresa({ onBack, onCreate }) {
  const [form, setForm] = useState({ name: '', cif: '', address: '', email: '', phone: '', status: 'active' })
  const submit = () => {
    const error = validateCompanyForm(form)
    if (error) {
      alert(error)
      return
    }
    onCreate(form)
  }

  return (
    <div className="panel form">
      <FormHeader title="Crear empresa" onBack={onBack} />
      <label>Nombre de empresa</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label>CIF / Identificador</label>
      <input value={form.cif} onChange={(e) => setForm({ ...form, cif: e.target.value.toUpperCase() })} pattern={CIF_PATTERN} />
      <label>Dirección</label>
      <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <label>Email</label>
      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <label>Teléfono</label>
      <input type="tel" inputMode="tel" pattern={PHONE_PATTERN} value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label>Estado</label>
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option value="active">Activa</option>
        <option value="inactive">Inactiva</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Guardar empresa</button>
    </div>
  )
}

function EditarEmpresa({ company, onBack, onSave }) {
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
      alert(error)
      return
    }
    onSave(form)
  }

  return (
    <div className="panel form">
      <FormHeader title="Editar empresa" onBack={onBack} />
      <label>Nombre de empresa</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label>CIF / Identificador</label>
      <input value={form.cif} onChange={(e) => setForm({ ...form, cif: e.target.value.toUpperCase() })} pattern={CIF_PATTERN} />
      <label>Dirección</label>
      <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <label>Email</label>
      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <label>Teléfono</label>
      <input type="tel" inputMode="tel" pattern={PHONE_PATTERN} value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label>Estado</label>
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option value="active">Activa</option>
        <option value="inactive">Inactiva</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Guardar cambios</button>
    </div>
  )
}

function CrearJefe({ onBack, onCreate, companies }) {
  const [form, setForm] = useState({ name: '', last_name: '', email: '', password: '', company_id: '', phone: '', active: true })
  const submit = () => {
    const error = validateUserForm(form, { requireCompany: true })
    if (error) {
      alert(error)
      return
    }
    onCreate({ ...form, role: 'jefe_empresa' })
  }

  return (
    <div className="panel form">
      <FormHeader title="Crear jefe de empresa" onBack={onBack} />
      <label>Nombre</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label>Apellidos</label>
      <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      <label>Email</label>
      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <label>Contraseña</label>
      <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <label>Empresa asignada</label>
      <select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: Number(e.target.value) })}>
        <option value="">Seleccionar...</option>
        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <label>Teléfono</label>
      <input type="tel" inputMode="tel" pattern={PHONE_PATTERN} value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label>Estado</label>
      <select value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
        <option value="1">Activo</option>
        <option value="0">Inactivo</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Crear jefe</button>
    </div>
  )
}

function CrearAdmin({ onBack, onCreate }) {
  const [form, setForm] = useState({ name: '', last_name: '', email: '', password: '', phone: '', active: true })
  const submit = () => {
    const error = validateUserForm(form)
    if (error) {
      alert(error)
      return
    }
    onCreate({ ...form, role: 'admin' })
  }

  return (
    <div className="panel form">
      <FormHeader title="Crear administrador" onBack={onBack} />
      <label>Nombre</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label>Apellidos</label>
      <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      <label>Email</label>
      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <label>Contraseña</label>
      <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <label>Teléfono</label>
      <input type="tel" inputMode="tel" pattern={PHONE_PATTERN} value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label>Estado</label>
      <select value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
        <option value="1">Activo</option>
        <option value="0">Inactivo</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Crear administrador</button>
    </div>
  )
}

function CrearSupervisor({ onBack, onCreate }) {
  const [form, setForm] = useState({ name: '', last_name: '', email: '', password: '', phone: '', active: true })
  const submit = () => {
    const error = validateUserForm(form)
    if (error) {
      alert(error)
      return
    }
    onCreate({ ...form, role: 'supervisor' })
  }

  return (
    <div className="panel form">
      <FormHeader title="Crear supervisor" onBack={onBack} />
      <label>Nombre</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label>Apellidos</label>
      <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      <label>Email</label>
      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <label>Contraseña</label>
      <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <label>Teléfono</label>
      <input type="tel" inputMode="tel" pattern={PHONE_PATTERN} value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label>Estado</label>
      <select value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
        <option value="1">Activo</option>
        <option value="0">Inactivo</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Crear supervisor</button>
    </div>
  )
}

function CrearEmpleado({ onBack, onCreate }) {
  const [form, setForm] = useState({ name: '', last_name: '', email: '', password: '', department: '', phone: '', active: true })
  const submit = () => {
    const error = validateUserForm(form)
    if (error) {
      alert(error)
      return
    }
    onCreate({ ...form, role: 'empleado' })
  }

  return (
    <div className="panel form">
      <FormHeader title="Crear empleado" onBack={onBack} />
      <label>Nombre</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label>Apellidos</label>
      <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      <label>Email</label>
      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <label>Contraseña</label>
      <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <label>Departamento (opcional)</label>
      <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
      <label>Teléfono</label>
      <input type="tel" inputMode="tel" pattern={PHONE_PATTERN} value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label>Estado</label>
      <select value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
        <option value="1">Activo</option>
        <option value="0">Inactivo</option>
      </select>
      <button className="btn btn--primary" onClick={submit}>Crear empleado</button>
    </div>
  )
}

function CrearTecnico({ onBack, onCreate }) {
  const [form, setForm] = useState({ name: '', last_name: '', email: '', password: '', specialty: '', phone: '', active: true })
  const submit = () => {
    const error = validateUserForm(form)
    if (error) {
      alert(error)
      return
    }
    onCreate({ ...form, role: 'tecnico' })
  }

  return (
    <div className="panel form">
      <FormHeader title="Crear técnico" onBack={onBack} />
      <label>Nombre</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <label>Apellidos</label>
      <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      <label>Email</label>
      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <label>Contraseña</label>
      <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <label>Especialidad (opcional)</label>
      <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
      <label>Teléfono</label>
      <input type="tel" inputMode="tel" pattern={PHONE_PATTERN} value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })} />
      <label>Estado</label>
      <select value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
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
