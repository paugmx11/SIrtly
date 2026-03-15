# Sirtly — Sistema de Gestión de Incidencias Multiempresa

**Stack**
- Backend: PHP (Laravel) — API REST
- Frontend: JavaScript (React)
- Base de datos: MySQL
- Cliente DB recomendado: DBeaver

## Roles del sistema
- `admin` (interno): crea empresas, jefes de empresa, supervisores y otros admins.
- `supervisor` (interno): consulta global, sin modificar datos.
- `jefe_empresa`: gestiona usuarios de su empresa y ve incidencias de su empresa.
- `tecnico`: gestiona incidencias de su empresa (cambia estados, comentarios).
- `empleado`: crea incidencias y ve el estado de las suyas.

## Flujo de creación de usuarios
- Primer `admin`: se crea manualmente en base de datos.
- `admin`: crea empresas, jefes de empresa, supervisores y admins.
- `jefe_empresa`: crea técnicos y empleados de su empresa.

## Endpoints principales (API)
- `POST /api/auth/login`
- `POST /api/auth/registerCompany` (requiere `admin` autenticado)
- `POST /api/auth/registerUser` (requiere `admin` o `jefe_empresa`)
- `GET /api/companies` (admin/supervisor)
- `POST /api/companies` (admin)
- `PUT /api/companies/{id}` (admin)
- `GET /api/users` (admin/jefe_empresa)
- `POST /api/users` (admin/jefe_empresa)
- `PUT /api/users/{id}` (admin/jefe_empresa)
- `DELETE /api/users/{id}` (admin/jefe_empresa)
- `GET /api/incidents`
- `GET /api/incidents/{id}`
- `POST /api/incidents` (solo `empleado`)
- `PATCH /api/incidents/{id}/status` (solo `tecnico`)
- `PATCH /api/incidents/{id}/assign` (tecnico o jefe_empresa)
- `GET /api/incidents/{id}/comments`
- `POST /api/incidents/{id}/comments`
- `GET /api/incidents/{id}/attachments`
- `POST /api/incidents/{id}/attachments`
- `GET /api/company-settings`
- `PUT /api/company-settings`
- `GET /api/stats/system` (admin/supervisor)
- `GET /api/stats/company` (jefe_empresa)
- `GET /api/stats/by-company` (admin/supervisor)
- `GET /api/stats/by-technician` (jefe_empresa)

## Frontend
El frontend consume la API real (no hay datos mock). El rol del usuario se determina desde el backend en el login.

## Base de datos (MySQL)
Usa el archivo `.sql` en la raíz. Esquema actualizado:

```sql
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

-- SEED DATA (demo)
-- Incluye roles, empresas, usuarios, incidencias, comentarios y adjuntos
-- Password demo para usuarios: asdqwe123
-- Puedes ejecutar el .sql completo o solo la sección de seed al final.
```

## Backend (Laravel API)
**Configuración .env**
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sirtly_db
DB_USERNAME=root
DB_PASSWORD=asdqwe123

SESSION_DRIVER=database
```

**Instalación**
```bash
cd backend
composer install
php artisan key:generate
```

**Arranque**
```bash
php artisan serve
```

## Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

## Datos de demo
El archivo `.sql` ahora incluye datos de ejemplo (usuarios, empresas, incidencias, comentarios, adjuntos).
Usuario admin demo:
- email: `admin@sistema.com`
- password: `asdqwe123`

## Notas importantes
- El login es único para todos los roles.
- Si usas `SESSION_DRIVER=database`, asegúrate de tener la tabla `sessions` creada.
- Para pruebas, usa Postman con `Authorization: Bearer <token>`.

## Tablas de autenticación
**`sessions`**
Se usa cuando `SESSION_DRIVER=database`. Almacena las sesiones del middleware `web` (por ejemplo al entrar a `/`).

**`personal_access_tokens`**
La usa Laravel Sanctum para autenticación por token en la API. Cada login crea un token que se guarda aquí y se envía como `Authorization: Bearer <token>`.

## Estructura del proyecto
```
sirtly
├ backend
├ frontend
├ .sql
└ README.md
```
