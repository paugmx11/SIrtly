import { useState } from 'react'
import './PublicPortal.css'
import sirtlyLogo from '../assets/Logo Sirtly.png'

export default function PublicPortal({ onLogin, onContactSubmit, notifyError }) {
  const [publicView, setPublicView] = useState('welcome')

  return publicView === 'login'
    ? <LoginScreen onBack={() => setPublicView('welcome')} onSubmit={onLogin} />
    : <WelcomePage onGoLogin={() => setPublicView('login')} onContactSubmit={onContactSubmit} notifyError={notifyError} />
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

function WelcomePage({ onGoLogin, onContactSubmit, notifyError }) {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  })

  const updateField = (key, value) => {
    setContactForm((prev) => ({ ...prev, [key]: value }))
  }

  const submitContact = (e) => {
    e.preventDefault()

    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      notifyError('Completa nombre, email y mensaje para enviarnos tu consulta')
      return
    }

    onContactSubmit(contactForm)
    setContactForm({ name: '', email: '', company: '', message: '' })
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      </header>

      <main className="landing__main">
        <section className="landing__hero">
          <div className="landing__hero-copy">
            <div className="landing__eyebrow">Soporte técnico con identidad propia</div>
            <h1>Gestiona incidencias, equipos y empresas desde un portal claro, profesional y preparado para crecer.</h1>
            <p>
              Sirtly está pensado para empresas que necesitan orden, seguimiento y una imagen cuidada.
              Centraliza incidencias, técnicos, empleados, comentarios, adjuntos y estadísticas en un solo lugar.
            </p>

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

          <div className="landing__hero-stack">
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

            <article className="landing__hero-note">
              <div className="landing__hero-note-title">Propuesta de valor</div>
              <p>
                Diseñado para empresas que quieren un portal de incidencias moderno, visualmente adaptable
                y fácil de usar tanto para equipos internos como para responsables de gestión.
              </p>
              <p>
                La idea es simple: que la gestión diaria se sienta ordenada, rápida y coherente con la imagen de cada empresa.
              </p>
            </article>
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
            <h2>Si quieres hablar con nosotros sobre Sirtly, déjanos tus datos y tu mensaje.</h2>
            <div className="landing__contact-intro">
              <div className="landing__contact-intro-tag">Proyecto de 2º DAW</div>
              <p>Una propuesta desarrollada en 2º DAW con foco en experiencia de usuario, arquitectura clara y un producto que destaque visual y funcionalmente.</p>
              <p>Podéis escribirnos para conocer mejor el producto, resolver dudas sobre el flujo de roles y la personalización, proponer mejoras o abrir una conversación directa con nosotros.</p>
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

              <label>Mensaje</label>
              <textarea
                rows={5}
                value={contactForm.message}
                onChange={(e) => updateField('message', e.target.value)}
                placeholder="Cuéntanos cómo quieres contactar con nosotros o qué te gustaría comentar"
              />

              <button className="btn btn--primary landing__contact-submit" type="submit">Enviar mensaje</button>
            </form>

            <aside className="landing__contact-side">
              <article className="landing__contact-panel landing__contact-panel--accent">
                <h3>Hablemos con contexto</h3>
                <p>Cuéntanos brevemente qué te interesa de Sirtly y podremos responderte con una conversación mucho más útil.</p>
              </article>

              <article className="landing__contact-panel">
                <h4>Qué puedes comentarnos</h4>
                <ul>
                  <li>Cómo encajaría Sirtly en una empresa real</li>
                  <li>Dudas sobre roles, asignaciones y personalización</li>
                  <li>Mejoras, feedback o ideas de evolución del producto</li>
                </ul>
              </article>

              <article className="landing__contact-panel landing__contact-panel--compact">
                <span className="landing__contact-kicker">Equipo</span>
                <strong>Estudiantes de 2º DAW</strong>
                <p>Proyecto orientado a producto real, diseño cuidado y arquitectura clara.</p>
              </article>
            </aside>
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
          <span>Diseñado para presentar una solución real, visual y escalable.</span>
        </div>
      </footer>
    </div>
  )
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

          <div className="login__footer">© 2026 Sirtly. Todos los derechos reservados.</div>
        </div>

        <div className="login__stage">
          <div className="login__card">
            <div className="login__card-top">
              <button className="login__back" type="button" onClick={onBack}>Volver al inicio</button>
            </div>
            <h1>Iniciar sesión</h1>
            <p>Accede a tu panel de gestión</p>
            <form onSubmit={onSubmit}>
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
