import { useEffect, useState } from 'react'
import './PublicPortal.css'
import sirtlyLogo from '../assets/Logo Sirtly.png'

const LICENSE_SOURCE_URL = 'https://github.com/paugmx11/SIrtly/blob/main/LICENSE'
const LICENSE_ASSETS_URL = 'https://github.com/paugmx11/SIrtly/blob/main/LICENSE-ASSETS.md'

export default function PublicPortal({ onLogin, onContactSubmit, notifyError, initialView = 'welcome', onPublicViewChange }) {
  const [publicView, setPublicView] = useState(readPublicViewFromHash(initialView))
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setPublicView(readPublicViewFromHash(initialView))
  }, [initialView])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const nextHash = publicView === 'login' ? '#login' : ''
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`)
      }
    }
    onPublicViewChange?.(publicView)
  }, [onPublicViewChange, publicView])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handleHashChange = () => {
      setPublicView(readPublicViewFromHash(initialView))
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [initialView])

  return publicView === 'login'
    ? <LoginScreen onBack={() => setPublicView('welcome')} onSubmit={onLogin} />
    : <WelcomePage
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onGoLogin={() => {
          setMenuOpen(false)
          setPublicView('login')
        }}
        onContactSubmit={onContactSubmit}
        notifyError={notifyError}
      />
}

function PublicBrandLogo({ brandName, brandLogo, product = false }) {
  if (brandLogo) {
    return <img className="brand-logo-image" src={brandLogo} alt={brandName} />
  }

  if (product) {
    return <img className="public-brand-logo" src={sirtlyLogo} alt={brandName || 'Sirtly'} />
  }

  return <div className="logo">{(brandName || 'S').trim().charAt(0).toUpperCase() || 'S'}</div>
}

function WelcomePage({ onGoLogin, onContactSubmit, notifyError, menuOpen, setMenuOpen }) {
  const PHONE_REGEX = /^\+?[0-9]{8,10}$/
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  })

  const updateField = (key, value) => {
    setContactForm((prev) => ({ ...prev, [key]: value }))
  }

  const submitContact = async (e) => {
    e.preventDefault()

    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.company.trim() || !contactForm.phone.trim() || !contactForm.message.trim()) {
      notifyError('Completa nombre, email, empresa, telefono y mensaje para enviarnos tu consulta')
      return
    }
    if (!PHONE_REGEX.test(contactForm.phone.trim())) {
      notifyError('Introduce un teléfono válido: solo números y + opcional al inicio, máximo 11 caracteres.')
      return
    }

    const sent = await onContactSubmit(contactForm)
    if (sent) {
      setContactForm({ name: '', email: '', company: '', phone: '', message: '' })
    }
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMenuOpen(false)
  }

  return (
    <div className="landing">
      <header className="landing__nav">
        <div className="landing__brand">
          <PublicBrandLogo brandName="Sirtly" product />
          <div>
            <div className="landing__brand-title">Sirtly</div>
            <div className="landing__brand-sub">Portal de incidencias multiempresa</div>
          </div>
        </div>

        <nav className="landing__nav-links">
          <button className="landing__nav-link" onClick={() => scrollTo('ventajas')}>Ventajas</button>
          <button className="landing__nav-link" onClick={() => scrollTo('contacto')}>Contacto</button>
          <button className="btn btn--primary landing__nav-cta" onClick={onGoLogin}>Iniciar sesión</button>
        </nav>
        <button
          type="button"
          className="landing__menu-toggle"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>
      {menuOpen && (
        <>
          <button type="button" className="landing__menu-overlay" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />
          <div className="landing__mobile-menu">
            <button className="landing__mobile-link" onClick={() => scrollTo('ventajas')}>Ventajas</button>
            <button className="landing__mobile-link" onClick={() => scrollTo('contacto')}>Contacto</button>
            <button className="btn btn--primary landing__mobile-cta" onClick={onGoLogin}>Iniciar sesión</button>
          </div>
        </>
      )}

      <main className="landing__main">
        <section className="landing__hero">
          <div className="landing__hero-copy">
            <div className="landing__eyebrow">Portal multiempresa para soporte técnico</div>
            <h1><span className="landing__sirtly-gradient">Sirtly</span> ordena tu soporte.</h1>
            <p>Incidencias, equipos y branding de empresa en un solo portal.</p>

            <div className="landing__hero-actions">
              <button className="btn btn--primary landing__hero-primary" onClick={onGoLogin}>Acceder al portal</button>
              <button className="btn landing__hero-secondary" onClick={() => scrollTo('contacto')}>Contactar con nosotros</button>
            </div>

            <div className="landing__hero-metrics">
              <article>
                <strong>5 roles</strong>
                <span>Permisos diferenciados para una operativa ordenada</span>
              </article>
              <article>
                <strong>Multiempresa</strong>
                <span>Entornos separados para cada compañía</span>
              </article>
              <article>
                <strong>Identidad visual</strong>
                <span>Logo, colores y configuración adaptados a cada empresa</span>
              </article>
            </div>
          </div>

          <div className="landing__hero-visual">
            <div className="landing__mockup">
              <div className="landing__mockup-header">
                <span className="landing__dot" />
                <span className="landing__dot" />
                <span className="landing__dot" />
              </div>

              <div className="landing__mockup-body">
                <aside className="landing__mockup-sidebar">
                  <div className="landing__mini-brand">
                    <PublicBrandLogo brandName="Sirtly" product />
                    <div>
                      <strong>Sirtly</strong>
                      <span>Jefe de empresa</span>
                    </div>
                  </div>

                  <div className="landing__mini-menu">
                    <span>Dashboard</span>
                    <span>Empleados</span>
                    <span>Técnicos</span>
                    <span className="active">Incidencias</span>
                    <span>Estadísticas</span>
                    <span>Configuración</span>
                  </div>
                </aside>

                <div className="landing__mockup-content">
                  <div className="landing__mockup-cards">
                    <article>
                      <span>Abiertas</span>
                      <strong>18</strong>
                    </article>
                    <article>
                      <span>En progreso</span>
                      <strong>7</strong>
                    </article>
                    <article>
                      <span>Resueltas</span>
                      <strong>42</strong>
                    </article>
                  </div>

                  <div className="landing__mockup-ticket">
                    <div>
                      <strong>Monitor parpadea intermitente</strong>
                      <p>Seguimiento con comentarios, adjuntos y técnico asignado.</p>
                    </div>
                    <span className="landing__status">En progreso</span>
                  </div>

                  <div className="landing__mockup-theme">
                    <div className="landing__theme-label">Vista personalizable para cada empresa</div>
                    <div className="landing__theme-swatches">
                      <span style={{ background: '#2D61E5' }} />
                      <span style={{ background: '#1D4ED8' }} />
                      <span style={{ background: '#3B82F6' }} />
                      <span style={{ background: '#22C55E' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing__section" id="ventajas">
          <div className="landing__section-head landing__section-head--wide">
            <div className="landing__eyebrow landing__eyebrow--dark">Qué hace diferente a Sirtly</div>
            <h2>Una plataforma de incidencias pensada para empresas que quieren control, personalización y una experiencia cuidada.</h2>
          </div>

          <div className="landing__feature-grid">
            <article className="landing__feature-card">
              <h3>Identidad visual configurable</h3>
              <p>Nombre visible, logo, colores, categorías, prioridades y modo de asignación para que cada entorno refleje a la empresa.</p>
            </article>
            <article className="landing__feature-card">
              <h3>Roles bien definidos</h3>
              <p>Administradores, supervisores, jefes, técnicos y empleados trabajan con permisos claros y sin cruces innecesarios.</p>
            </article>
            <article className="landing__feature-card">
              <h3>Seguimiento completo de incidencias</h3>
              <p>Estados, comentarios, adjuntos y técnico asignado para entender siempre qué está pasando y quién actúa.</p>
            </article>
            <article className="landing__feature-card">
              <h3>Visión operativa real</h3>
              <p>Estadísticas y paneles para detectar carga, avance y rendimiento del soporte de forma útil y rápida.</p>
            </article>
          </div>
        </section>

        <section className="landing__section landing__section--split">
          <div className="landing__workflow">
            <div className="landing__eyebrow landing__eyebrow--dark">Cómo funciona</div>
            <h2>Un flujo sencillo para que la gestión sea cómoda desde el primer día.</h2>

            <div className="landing__timeline">
              <article>
                <strong>1. El admin crea la empresa</strong>
                <p>Define la compañía, prepara el acceso y crea la base del portal.</p>
              </article>
              <article>
                <strong>2. El jefe configura su espacio</strong>
                <p>Personaliza colores, departamentos, categorías, especialidades y reglas de asignación.</p>
              </article>
              <article>
                <strong>3. El equipo opera con trazabilidad</strong>
                <p>Los empleados crean incidencias y los técnicos las gestionan con contexto y seguimiento completo.</p>
              </article>
              <article>
                <strong>4. La empresa gana control</strong>
                <p>Todo queda centralizado, visible y listo para tomar decisiones con mejores datos.</p>
              </article>
            </div>
          </div>

          <div className="landing__story">
            <div className="landing__story-visual">
              <div className="landing__story-orb" />
              <div className="landing__story-board">
                <div className="landing__story-bar" />
                <div className="landing__story-line" />
                <div className="landing__story-line short" />
                <div className="landing__story-panel">
                  <div className="landing__story-panel-header">Seguimiento centralizado</div>
                  <div className="landing__story-panel-item">Incidencias abiertas y resueltas en un solo panel</div>
                  <div className="landing__story-panel-item">Trazabilidad entre empleado, técnico y jefe</div>
                </div>
              </div>
            </div>

            <div className="landing__highlight">
              <div className="landing__quote">
                <span>“</span>
                <p>Queríamos que Sirtly se viera como un producto serio, útil y adaptable a cada empresa, no como un gestor genérico más.</p>
              </div>
              <div className="landing__team">
                <div className="landing__contact-intro-tag">Proyecto de 2º DAW</div><br></br>
                <div className="landing__team-badge">Mauro y Pau</div>
                <h3>Estudiantes de DAW impulsando una solución real</h3>
                <p>Hemos planteado Sirtly como un producto diferencial: sólido en backend, claro en frontend y preparado para escalar con empresas y roles distintos.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing__section landing__contact" id="contacto">
          <div className="landing__section-head">
            <div className="landing__eyebrow landing__eyebrow--dark">Contacto</div>
            <h2>Contacta con nosotros y envíanos tu mensaje</h2>
            <div className="landing__contact-intro">
              
            </div>
          </div>

          <div className="landing__contact-grid">
            <form className="landing__contact-form" onSubmit={submitContact}>
              <label>Nombre</label>
              <input value={contactForm.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Tu nombre" />

              <label>Email</label>
              <input type="email" value={contactForm.email} onChange={(e) => updateField('email', e.target.value)} placeholder="tu@empresa.com" />

              <label>Empresa</label>
              <input value={contactForm.company} onChange={(e) => updateField('company', e.target.value)} placeholder="Nombre de tu empresa" />

              <label>Telefono</label>
              <input
                type="tel"
                inputMode="tel"
                maxLength={11}
                pattern="^\+?[0-9]{8,10}$"
                title="Teléfono válido: solo números y + opcional al inicio (máximo 11 caracteres)"
                value={contactForm.phone}
                onChange={(e) => {
                  const raw = e.target.value
                  const sanitized = raw
                    .replace(/[^0-9+]/g, '')
                    .replace(/(?!^)\+/g, '')
                    .slice(0, 11)
                  updateField('phone', sanitized)
                }}
                placeholder="+3460011122"
              />

              <label>Mensaje</label>
              <textarea
                rows={5}
                value={contactForm.message}
                onChange={(e) => updateField('message', e.target.value)}
                placeholder="Cuéntanos cómo quieres contactar con nosotros o qué te gustaría comentar"
              />

              <button className="btn btn--primary landing__contact-submit" type="submit">Enviar mensaje</button>
            </form>


          </div>
        </section>
      </main>

      <footer className="landing__footer">
        <div className="landing__footer-shell">
          <div className="landing__footer-brand">
            <PublicBrandLogo brandName="Sirtly" product />
            <div>
              <div className="landing__footer-title">Sirtly</div>
              <p>Portal de incidencias multiempresa con foco en claridad, personalización y una experiencia profesional.</p>
            </div>
          </div>

          <div className="landing__footer-links">
            <div>
              <span className="landing__footer-heading">Producto</span>
              <button type="button" onClick={() => scrollTo('ventajas')}>Ventajas</button>
              <button type="button" onClick={() => scrollTo('contacto')}>Contacto</button>
            </div>
            <div>
              <span className="landing__footer-heading">Portal</span>
              <button type="button" onClick={onGoLogin}>Iniciar sesión</button>
              <button type="button" onClick={() => scrollTo('contacto')}>Escríbenos</button>
            </div>
            <div>
              <span className="landing__footer-heading">Proyecto</span>
              <p>Desarrollado como propuesta diferencial dentro de 2º DAW.</p>
            </div>
          </div>
        </div>

        <div className="landing__footer-bottom">
          <span>© 2026 Sirtly. Todos los derechos reservados.</span>
          <span className="landing__license-links">
            <a href={LICENSE_SOURCE_URL} target="_blank" rel="noopener noreferrer">MIT (código)</a>
            {' · '}
            <a href={LICENSE_ASSETS_URL} target="_blank" rel="noopener noreferrer">CC BY-NC 4.0 (documentación/assets)</a>
          </span>
          <span>Diseñado para presentar una solución real, visual y escalable.</span>
        </div>
      </footer>
    </div>
  )
}

function readPublicViewFromHash(fallback = 'welcome') {
  if (typeof window === 'undefined') return fallback
  return window.location.hash === '#login' ? 'login' : fallback
}

function LoginScreen({ onSubmit, onBack }) {
  return (
    <div className="login">
      <div className="login__shell">
        <div className="login__hero">
          <div className="login__brand">
            <PublicBrandLogo brandName="Sirtly" product />
            <div>
              <div className="brand-title">Sirtly</div>
              <div className="brand-sub">Gestión de incidencias multiempresa</div>
            </div>
          </div>

          <div className="login__copy">
            <h2>Controla incidencias, equipos y empresas desde un solo lugar</h2>
            <p>Una plataforma clara para operar el soporte técnico multiempresa con seguimiento, trazabilidad y asignación eficiente.</p>
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

          <div className="login__footer">
            © 2026 Sirtly. Todos los derechos reservados.
            {' '}
            <a href={LICENSE_SOURCE_URL} target="_blank" rel="noopener noreferrer">MIT</a>
            {' · '}
            <a href={LICENSE_ASSETS_URL} target="_blank" rel="noopener noreferrer">CC BY-NC 4.0</a>
          </div>
        </div>

        <div className="login__stage">
          <div className="login__card">
            <div className="login__card-top">
              <button className="login__back" type="button" onClick={onBack}>Volver al inicio</button>
            </div>
            <h1>Iniciar sesión</h1>
            <p>Accede a tu panel de gestión</p>
            <form noValidate onSubmit={onSubmit}>
              <label>Email</label>
              <input name="email" type="email" placeholder="tu@empresa.com" />
              <label>Contraseña</label>
              <input name="password" type="password" placeholder="••••••••" />
              <button className="btn btn--primary login__submit" type="submit">Iniciar sesión</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
