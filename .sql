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
