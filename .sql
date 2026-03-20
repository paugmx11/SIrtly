CREATE DATABASE IF NOT EXISTS sirtly_db;
USE sirtly_db;
-- EMPRESAS
CREATE TABLE companies (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(150) NOT NULL,
   cif VARCHAR(50),
   email VARCHAR(150) UNIQUE,
   phone VARCHAR(30),
   address VARCHAR(255),
   status ENUM('active','inactive') DEFAULT 'active',
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- PERSONALIZACIÓN DE EMPRESA
CREATE TABLE company_settings (
   id INT AUTO_INCREMENT PRIMARY KEY,
   company_id INT UNIQUE,
   primary_color VARCHAR(20),
   secondary_color VARCHAR(20),
   logo VARCHAR(255),
   system_name VARCHAR(150),
   favicon VARCHAR(255),
   assignment_mode ENUM('manual','auto','specialty') DEFAULT 'manual',
   categories JSON,
   priorities JSON,
   departments JSON,
   specialties JSON,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP NULL,
   FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
-- ROLES
CREATE TABLE roles (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(50) NOT NULL
);
INSERT INTO roles (name) VALUES
('admin'),
('supervisor'),
('jefe_empresa'),
('tecnico'),
('empleado');
-- USUARIOS
CREATE TABLE users (
   id INT AUTO_INCREMENT PRIMARY KEY,
   company_id INT NULL,
   role_id INT NOT NULL,
   name VARCHAR(120) NOT NULL,
   last_name VARCHAR(120),
   email VARCHAR(150) UNIQUE NOT NULL,
   password VARCHAR(255) NOT NULL,
   phone VARCHAR(30),
   department VARCHAR(120),
   specialty VARCHAR(120),
   active BOOLEAN DEFAULT TRUE,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
   FOREIGN KEY (role_id) REFERENCES roles(id)
);
-- TOKENS (Laravel Sanctum)
CREATE TABLE personal_access_tokens (
   id INT AUTO_INCREMENT PRIMARY KEY,
   tokenable_type VARCHAR(255) NOT NULL,
   tokenable_id INT NOT NULL,
   name VARCHAR(255) NOT NULL,
   token VARCHAR(64) NOT NULL UNIQUE,
   abilities TEXT,
   last_used_at TIMESTAMP NULL,
   expires_at TIMESTAMP NULL,
   created_at TIMESTAMP NULL,
   updated_at TIMESTAMP NULL,
   INDEX tokenable_index (tokenable_type, tokenable_id)
);
-- ESTADOS DE INCIDENCIA
CREATE TABLE incident_status (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(50) NOT NULL
);
INSERT INTO incident_status (name) VALUES
('abierta'),
('en_progreso'),
('resuelta'),
('cerrada');
-- INCIDENCIAS
CREATE TABLE incidents (
   id INT AUTO_INCREMENT PRIMARY KEY,
   company_id INT NOT NULL,
   created_by INT NOT NULL,
   assigned_to INT,
   status_id INT NOT NULL,
   title VARCHAR(200) NOT NULL,
   description TEXT,
   category VARCHAR(120),
   priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP NULL,
   FOREIGN KEY (company_id) REFERENCES companies(id),
   FOREIGN KEY (created_by) REFERENCES users(id),
   FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
   FOREIGN KEY (status_id) REFERENCES incident_status(id)
);
-- HISTORIAL DE ESTADOS
CREATE TABLE incident_status_history (
   id INT AUTO_INCREMENT PRIMARY KEY,
   incident_id INT NOT NULL,
   status_id INT NOT NULL,
   changed_by INT NOT NULL,
   changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (incident_id) REFERENCES incidents(id),
   FOREIGN KEY (status_id) REFERENCES incident_status(id),
   FOREIGN KEY (changed_by) REFERENCES users(id)
);
-- COMENTARIOS
CREATE TABLE incident_comments (
   id INT AUTO_INCREMENT PRIMARY KEY,
   incident_id INT NOT NULL,
   user_id INT NOT NULL,
   comment TEXT NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (incident_id) REFERENCES incidents(id),
   FOREIGN KEY (user_id) REFERENCES users(id)
);
-- ARCHIVOS ADJUNTOS
CREATE TABLE incident_attachments (
   id INT AUTO_INCREMENT PRIMARY KEY,
   incident_id INT NOT NULL,
   file_path VARCHAR(255) NOT NULL,
   uploaded_by INT,
   uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (incident_id) REFERENCES incidents(id),
   FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- NOTIFICACIONES
CREATE TABLE notifications (
   id INT AUTO_INCREMENT PRIMARY KEY,
   user_id INT NOT NULL,
   type VARCHAR(50) NOT NULL,
   title VARCHAR(150) NOT NULL,
   body TEXT,
   read_at TIMESTAMP NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SEED DATA (demo)
-- Roles
INSERT INTO roles (id, name) VALUES
(1, 'admin'),
(2, 'supervisor'),
(3, 'jefe_empresa'),
(4, 'tecnico'),
(5, 'empleado')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Incident statuses
INSERT INTO incident_status (id, name) VALUES
(1, 'abierta'),
(2, 'en_progreso'),
(3, 'resuelta'),
(4, 'cerrada')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Companies
INSERT INTO companies (id, name, cif, email, phone, address, status) VALUES
(1, 'TechSolutions S.L.', 'B12345678', 'info@techsolutions.es', '+34 912 345 678', 'Calle Mayor 1, Madrid', 'active'),
(2, 'InnovaGroup S.A.', 'A87654321', 'contacto@innovagroup.es', '+34 933 456 789', 'Av. Diagonal 120, Barcelona', 'active'),
(3, 'DataCore Systems', 'B11223344', 'admin@datacore.es', '+34 961 234 567', 'Gran Vía 55, Valencia', 'active'),
(4, 'NexTech Ibérica', 'B99887766', 'info@nextech.es', '+34 954 321 098', 'Calle Real 22, Sevilla', 'inactive'),
(5, 'CloudBase España', 'A55667788', 'hola@cloudbase.es', '+34 916 543 210', 'Paseo del Prado 10, Madrid', 'active')
ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email);

-- Company settings
INSERT INTO company_settings (id, company_id, primary_color, secondary_color, logo, system_name, favicon, assignment_mode, categories, priorities, departments, specialties)
VALUES
(1, 1, '#2D61E5', '#7C3AED', NULL, 'TechSolutions', NULL, 'manual', JSON_ARRAY('Hardware','Software','Red','Acceso','Otros'), JSON_ARRAY('Baja','Media','Alta','Crítica'), JSON_ARRAY('Desarrollo','Marketing','RRHH','Soporte'), JSON_ARRAY('Redes','Software','Hardware')),
(2, 2, '#10B981', '#6366F1', NULL, 'InnovaGroup', NULL, 'auto', JSON_ARRAY('Hardware','Software','Red'), JSON_ARRAY('Baja','Media','Alta','Crítica'), JSON_ARRAY('Producto','Ventas'), JSON_ARRAY('Redes','Software')),
(3, 3, '#F97316', '#0EA5E9', NULL, 'DataCore', NULL, 'specialty', JSON_ARRAY('Infraestructura','Seguridad'), JSON_ARRAY('Baja','Media','Alta','Crítica'), JSON_ARRAY('IT'), JSON_ARRAY('Redes','Seguridad'))
ON DUPLICATE KEY UPDATE company_id=VALUES(company_id);

-- Users (password: asdqwe123)
INSERT INTO users (id, company_id, role_id, name, last_name, email, password, phone, department, specialty, active)
VALUES
(1, NULL, 1, 'Admin', 'Sistema', 'admin@sistema.com', '$2y$12$sqKqs.Z7BtagBnPLMJwLFOdHtpG/gdse.gMWy1coRbSTQwmXUnlP.', NULL, NULL, NULL, 1),
(2, NULL, 2, 'Roberto', 'Sánchez Vega', 'roberto@incidencias.app', '$2y$12$0m2XpvLxqkMFwlSmnySYd.rCEAPw8Gl/HP/26sw07Hjdlqvzl/xh2', NULL, NULL, NULL, 1),
(3, NULL, 2, 'Elena', 'Morales Díaz', 'elena@incidencias.app', '$2y$12$0m2XpvLxqkMFwlSmnySYd.rCEAPw8Gl/HP/26sw07Hjdlqvzl/xh2', NULL, NULL, NULL, 1),
(10, 1, 3, 'Carlos', 'Martínez López', 'carlos@techsolutions.es', '$2y$12$0m2XpvLxqkMFwlSmnySYd.rCEAPw8Gl/HP/26sw07Hjdlqvzl/xh2', '+34 612 345 678', NULL, NULL, 1),
(11, 2, 3, 'Laura', 'García Fernández', 'laura@innovagroup.es', '$2y$12$0m2XpvLxqkMFwlSmnySYd.rCEAPw8Gl/HP/26sw07Hjdlqvzl/xh2', '+34 623 456 789', NULL, NULL, 1),
(12, 3, 3, 'Miguel', 'Rodríguez Sanz', 'miguel@datacore.es', '$2y$12$0m2XpvLxqkMFwlSmnySYd.rCEAPw8Gl/HP/26sw07Hjdlqvzl/xh2', '+34 634 567 890', NULL, NULL, 1),
(20, 1, 4, 'Javier', 'Fernández Castro', 'javier@techsolutions.es', '$2y$12$0m2XpvLxqkMFwlSmnySYd.rCEAPw8Gl/HP/26sw07Hjdlqvzl/xh2', NULL, NULL, 'Redes', 1),
(21, 1, 4, 'María', 'Delgado Ruiz', 'maria@techsolutions.es', '$2y$12$0m2XpvLxqkMFwlSmnySYd.rCEAPw8Gl/HP/26sw07Hjdlqvzl/xh2', NULL, NULL, 'Software', 1),
(22, 1, 4, 'Luis', 'Herrera Mora', 'luis@techsolutions.es', '$2y$12$0m2XpvLxqkMFwlSmnySYd.rCEAPw8Gl/HP/26sw07Hjdlqvzl/xh2', NULL, NULL, 'Hardware', 1),
(30, 1, 5, 'Ana', 'López Martín', 'ana@techsolutions.es', '$2y$12$0m2XpvLxqkMFwlSmnySYd.rCEAPw8Gl/HP/26sw07Hjdlqvzl/xh2', NULL, 'Desarrollo', NULL, 1),
(31, 1, 5, 'David', 'Torres Ruiz', 'david@techsolutions.es', '$2y$12$0m2XpvLxqkMFwlSmnySYd.rCEAPw8Gl/HP/26sw07Hjdlqvzl/xh2', NULL, 'Marketing', NULL, 1),
(32, 1, 5, 'Sara', 'Navarro Gil', 'sara@techsolutions.es', '$2y$12$0m2XpvLxqkMFwlSmnySYd.rCEAPw8Gl/HP/26sw07Hjdlqvzl/xh2', NULL, 'RRHH', NULL, 1),
(33, 1, 5, 'Pedro', 'Gómez Sanz', 'pedro@techsolutions.es', '$2y$12$0m2XpvLxqkMFwlSmnySYd.rCEAPw8Gl/HP/26sw07Hjdlqvzl/xh2', NULL, 'Soporte', NULL, 1)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Incidents
INSERT INTO incidents (id, company_id, created_by, assigned_to, status_id, title, description, category, priority, created_at, updated_at)
VALUES
(100, 1, 30, 20, 1, 'Error en servidor de correo', 'El servidor de correo no responde desde las 8:00.', 'Redes', 'high', '2024-12-15', '2024-12-15'),
(101, 1, 31, 22, 2, 'Impresora planta 2 no funciona', 'La impresora no imprime desde ayer.', 'Hardware', 'medium', '2024-12-14', '2024-12-14'),
(102, 1, 32, 21, 2, 'Actualización CRM fallida', 'Fallo durante el despliegue del CRM.', 'Software', 'urgent', '2024-12-13', '2024-12-13'),
(103, 1, 33, 20, 3, 'VPN sin acceso remoto', 'No hay acceso externo por VPN.', 'Redes', 'high', '2024-12-12', '2024-12-12'),
(104, 1, 30, 21, 4, 'Licencia Office expirada', 'Licencias caducadas en equipos.', 'Software', 'low', '2024-12-10', '2024-12-10'),
(105, 1, 31, 22, 1, 'Monitor parpadea intermitente', 'El monitor presenta parpadeos.', 'Hardware', 'low', '2024-12-16', '2024-12-16')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Incident status history
INSERT INTO incident_status_history (incident_id, status_id, changed_by, changed_at)
VALUES
(100, 1, 20, '2024-12-15 09:00:00'),
(101, 2, 22, '2024-12-14 10:00:00'),
(102, 2, 21, '2024-12-13 11:00:00'),
(103, 3, 20, '2024-12-12 12:00:00');

-- Comments
INSERT INTO incident_comments (incident_id, user_id, comment, created_at)
VALUES
(100, 30, 'El servidor de correo no responde desde las 8:00 de la mañana.', '2024-12-15 09:30:00'),
(100, 20, 'He revisado el servidor. El servicio SMTP está caído. Reiniciando el servicio y verificando los logs.', '2024-12-15 10:15:00'),
(100, 20, 'El servicio se reinició correctamente pero hay un problema con el certificado SSL. Estoy renovándolo.', '2024-12-15 11:00:00');

-- Attachments
INSERT INTO incident_attachments (incident_id, file_path, uploaded_by, uploaded_at)
VALUES
(100, 'attachments/demo-error-mail.pdf', 30, '2024-12-15 09:35:00');

-- Notifications
INSERT INTO notifications (user_id, type, title, body, read_at, created_at)
VALUES
(2, 'incident', 'Nueva incidencia', 'Se creó una incidencia en TechSolutions S.L.', NULL, NOW()),
(20, 'incident', 'Incidencia asignada', 'Se te asignó: Error en servidor de correo', NULL, NOW());
