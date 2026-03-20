# Sirtly - Multi-Company Incident Management System

## Project Repository
- GitHub repository: `git@github.com:paugmx11/SIrtly.git`
- Public repository URL: `https://github.com/paugmx11/SIrtly`

## Stack
- Backend: PHP, Laravel, REST API
- Frontend: JavaScript, React, Vite
- Database: MySQL
- Authentication: Laravel Sanctum
- Recommended DB client: DBeaver

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

SESSION_DRIVER=database
```

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
- The frontend consumes live API data. There are no mock datasets in the current UI flow.
- Form validation exists in both frontend and backend for core fields such as email, password, phone, CIF, and required fields.
- File uploads use Laravel public storage, so `php artisan storage:link` is required.
- Admin user creation, supervisor creation, company manager creation, employee creation, technician creation, company creation, company editing, and incident editing are aligned with the current UI and API rules.

## Feature Commit Traceability
The project history is organized around functional milestones. Relevant commits currently available in the repository:

- `5cc70b3` - Initial project setup with Laravel backend and React frontend
- `0c90e0c` - Backend aligned with SQL schema and role flow
- `e489e33` - Initial project README
- `da3b500` - Documentation for `sessions` and `personal_access_tokens`
- `b673f4e` - Frontend aligned with database-driven flow and seeds
- `c119d5b` - Laravel API routing bootstrap and Sanctum fix
- `06411c8` - Incident flow UI, notifications, and attachments

## Suggested Issue Mapping
If you need the repository to show explicit issue tracking, create GitHub issues associated with these functional blocks:

- `Issue 1` - Initial project setup and repository structure
- `Issue 2` - SQL schema design and role model alignment
- `Issue 3` - Authentication with Laravel Sanctum
- `Issue 4` - User and company management
- `Issue 5` - Incident lifecycle implementation
- `Issue 6` - Comments, attachments, and notifications
- `Issue 7` - Frontend integration with real API data
- `Issue 8` - Validation, documentation, and final review

This environment does not have the GitHub CLI installed, so actual GitHub issues must be created directly in the repository web interface.
