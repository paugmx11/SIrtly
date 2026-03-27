# Sirtly - Multi-Company Incident Management System

## Project Repository
- GitHub repository: `git@github.com:paugmx11/SIrtly.git`
- Public repository URL: `https://github.com/paugmx11/SIrtly`

## License
- Source code: `MIT` license. See `LICENSE`
- Documentation and original visual/presentation assets: `CC BY-NC 4.0`. See `LICENSE-ASSETS.md`
- Third-party resources must keep their original licenses and should only be used if legally compatible

## Stack
- Backend: PHP, Laravel, REST API
- Frontend: JavaScript, React, Vite
- Database: MySQL
- Authentication: Laravel Sanctum
- Recommended DB client: DBeaver

## Core Features
- Multi-company incident management
- Role-based access control for `admin`, `supervisor`, `jefe_empresa`, `tecnico`, and `empleado`
- Authentication with Laravel Sanctum tokens
- Company and user management
- Incident lifecycle management with assignment and status flow
- Comments, attachments, and internal notifications
- Company-level branding and workflow settings

## Requirements
- PHP 8.2+
- Composer
- Node.js 20+
- npm 10+
- MySQL 8.x compatible server

## Project Structure
```text
sirtly/
├── backend/                # Laravel API
├── frontend/               # React + Vite application
├── .sql                    # Canonical database schema + demo data
└── README.md
```

## Backend Architecture
The backend is implemented in Laravel using Eloquent ORM as the data access layer.

Eloquent follows the Active Record pattern, where each model represents a database table and exposes CRUD operations directly from PHP without writing raw SQL for the application logic.

This was chosen because:
- it is built into Laravel with no extra integration layer
- it speeds up development with less boilerplate
- it makes entity relationships easier to define and maintain
- it keeps the API code more readable and consistent

The system is built around Eloquent models such as:
- `User`
- `Company`
- `CompanySetting`
- `Role`
- `Incident`
- `Comment`
- `IncidentAttachment`
- `IncidentStatus`
- `IncidentStatusHistory`
- `Notification`

Key Eloquent relationships currently implemented:
- `Company -> users`
- `Company -> incidents`
- `Company -> settings`
- `User -> company`
- `User -> role`
- `User -> createdIncidents`
- `User -> assignedIncidents`
- `User -> comments`
- `User -> notifications`
- `Role -> users`
- `Incident -> company`
- `Incident -> creator`
- `Incident -> assignee`
- `Incident -> status`
- `Incident -> comments`
- `Incident -> attachments`
- `Incident -> statusHistory`
- `Comment -> incident`
- `Comment -> user`
- `CompanySetting -> company`
- `IncidentAttachment -> incident`
- `IncidentAttachment -> uploader`
- `IncidentStatusHistory -> incident`
- `IncidentStatusHistory -> status`
- `IncidentStatusHistory -> user`
- `Notification -> user`

## Versions
- PHP: `^8.2`
- Laravel: `^12.0`
- Laravel Sanctum: `^4.3`
- React: `^19.2.0`
- React DOM: `^19.2.0`
- Vite: `^7.3.1`
- ESLint: `^9.39.1`
- MySQL: project schema targets MySQL 8.x compatible syntax

## Roles
- `admin`: internal platform administrator. Can create companies, company managers, supervisors, and other admins.
- `supervisor`: read-only access to global company and incident data.
- `jefe_empresa`: manages users, incidents, and company settings inside one company.
- `tecnico`: works on assigned incidents, updates status, adds comments, uploads attachments.
- `empleado`: creates incidents and tracks their own incidents.

## User Creation Flow
- The first `admin` is inserted manually in the database.
- An `admin` can create:
  - companies
  - `admin`
  - `supervisor`
  - `jefe_empresa`
- A `jefe_empresa` can create:
  - `tecnico`
  - `empleado`

There is no public registration flow.

## Login Flow
- Single login form for every role.
- Endpoint: `POST /api/auth/login`
- The backend returns the authenticated user and their role.
- The frontend uses that role to load the correct dashboard automatically.

## Main API Endpoints
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/registerCompany`
- `POST /api/auth/registerUser`
- `GET /api/companies`
- `POST /api/companies`
- `PUT /api/companies/{id}`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}`
- `GET /api/incidents`
- `GET /api/incidents/{id}`
- `POST /api/incidents`
- `PUT /api/incidents/{id}`
- `DELETE /api/incidents/{id}`
- `PATCH /api/incidents/{id}/status`
- `PATCH /api/incidents/{id}/assign`
- `GET /api/incidents/{id}/comments`
- `POST /api/incidents/{id}/comments`
- `GET /api/incidents/{id}/attachments`
- `POST /api/incidents/{id}/attachments`
- `GET /api/company-settings`
- `PUT /api/company-settings`
- `GET /api/stats/system`
- `GET /api/stats/company`
- `GET /api/stats/by-company`
- `GET /api/stats/by-technician`
- `GET /api/notifications`
- `POST /api/notifications/{id}/read`
- `POST /api/notifications/read-all`

## Current Frontend Status
- Real login against the Laravel API.
- Dashboards by role.
- CRUD available for users from admin and company manager screens.
- Company creation and company editing from admin screens.
- Incident creation, editing, deletion, status updates, assignment, comments, and attachments.
- Employees can edit their own incidents.
- Notifications panel with unread state.
- Company settings screen connected to the API.
- Frontend forms validate required fields before sending requests.
- Backend validation also enforces email, password, phone, CIF, and required field rules.

## Database
The project uses the root `.sql` file as the source of truth.

Schema responsibility is split as follows:
- `.sql` defines and creates the database structure
- `.sql` also includes the demo seed data used by the project
- Eloquent models do not create tables
- Eloquent models are used to query, create, update, delete, and relate existing records
- Laravel migrations exist in the repository, but they are not the canonical schema source for this project

In practice, this means:
- the MySQL schema should be created from the root `.sql` file
- the backend application should use Eloquent models to work with that schema
- `php artisan migrate` should not be used as the main way to build the project database, because it can diverge from the SQL schema

This project keeps `.sql` as the authoritative schema definition and Eloquent as the ORM layer for application logic.

Main tables:
- `companies`
- `company_settings`
- `roles`
- `users`
- `personal_access_tokens`
- `incident_status`
- `incidents`
- `incident_status_history`
- `incident_comments`
- `incident_attachments`
- `notifications`

The root `.sql` file already includes demo seed data.

## Environment
Example `backend/.env` values:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sirtly_db
DB_USERNAME=root
DB_PASSWORD=asdqwe123

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

## Local Environment Notes

Each developer must keep their own local `backend/.env` file. This file is ignored by Git and is not shared through GitHub.

Recommended Laravel local configuration for this project:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sirtly_db
DB_USERNAME=your_mysql_user
DB_PASSWORD=your_mysql_password

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

Why these values matter:
- `SESSION_DRIVER=file`: avoids requiring a `sessions` table in MySQL
- `CACHE_STORE=file`: avoids requiring a `cache` table in MySQL
- `QUEUE_CONNECTION=sync`: runs jobs immediately in local development and avoids queue storage setup

Important:
- The project uses the root `.sql` file as the source of truth for the database schema
- Do not rely on Laravel migrations to create framework tables such as `sessions` or `cache`
- If a teammate pulls the project for the first time, they must create their own `backend/.env` based on these values

## Local URLs
- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000/api`
- Backend root: `http://127.0.0.1:8000`

Notes:
- The frontend is the main application entry point for day-to-day use
- The backend root is a Laravel web route context and is not the main product UI
- Most API endpoints require a Bearer token and should be tested with Postman, Insomnia, curl, or the frontend itself

## Local Setup
Import the SQL schema and demo data first.

Backend:

```bash
cd backend
composer install
php artisan key:generate
php artisan storage:link
php artisan serve
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Demo Credentials
- Email: `admin@sistema.com`
- Password: `asdqwe123`

## Notes
- The repository includes automated PHPUnit tests for authentication, authorization, incident workflow, comments, branding settings, and core management flows.
- Test execution uses a dedicated MySQL testing database (`sirtly_test`) instead of the project `.sql` schema in order to keep application tests isolated from local demo data.
- Code is distributed under the MIT license, while documentation and original project presentation assets are covered by CC BY-NC 4.0.
- The frontend consumes live API data. There are no mock datasets in the current UI flow.
- Form validation exists in both frontend and backend for core fields such as email, password, phone, CIF, and required fields.
- File uploads use Laravel public storage, so `php artisan storage:link` is required.
- Admin user creation, supervisor creation, company manager creation, employee creation, technician creation, company creation, company editing, and incident editing are aligned with the current UI and API rules.
