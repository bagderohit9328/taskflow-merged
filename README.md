## Features
 
| Feature | Details |
|---|---|
| Task Assignment & Prioritization | Assign tasks with deadline and priority (Critical / High / Medium / Low) |
| Deadline Tracking & Notifications | Daily email reminders via `@Scheduled` cron job |
| Progress Reporting | Analytics dashboard with completion rates and team performance |
| Role-Based Permissions | Admin / Editor / Viewer roles with method-level security |
| Real-Time Collaboration | Live comments and task updates via WebSocket (STOMP + SockJS) |
| Secure Authentication | JWT-based stateless auth with BCrypt password hashing |
 
---
 
## Project Structure
 
```
taskflow-merged/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/taskflow/
    │   │   ├── TaskFlowApplication.java
    │   │   ├── config/
    │   │   │   ├── DataInitializer.java       ← Seeds demo data on first run
    │   │   │   ├── GlobalExceptionHandler.java
    │   │   │   ├── MvcConfig.java             ← Static resource + upload serving
    │   │   │   ├── SecurityConfig.java        ← JWT + CORS + RBAC
    │   │   │   └── WebSocketConfig.java       ← STOMP broker
    │   │   ├── controller/
    │   │   │   ├── AuthController.java        POST /api/auth/login|register
    │   │   │   ├── CommentController.java     GET|POST|DELETE /api/tasks/{id}/comments
    │   │   │   ├── FileController.java        POST /api/tasks/{id}/files | GET /api/files/{id}/download
    │   │   │   ├── TaskController.java        CRUD /api/tasks + /api/tasks/reports
    │   │   │   └── UserController.java        GET|PATCH /api/users
    │   │   ├── dto/
    │   │   │   ├── AuthDTOs.java
    │   │   │   ├── CommentDTOs.java
    │   │   │   ├── FileDTOs.java
    │   │   │   └── TaskDTOs.java
    │   │   ├── entity/
    │   │   │   ├── Comment.java
    │   │   │   ├── Task.java
    │   │   │   ├── TaskFile.java
    │   │   │   └── User.java
    │   │   ├── repository/                    ← Spring Data JPA interfaces
    │   │   ├── scheduler/
    │   │   │   └── DeadlineScheduler.java     ← Daily 8 AM deadline check
    │   │   ├── security/
    │   │   │   ├── JwtAuthenticationFilter.java
    │   │   │   ├── JwtUtils.java
    │   │   │   ├── UserDetailsImpl.java
    │   │   │   └── UserDetailsServiceImpl.java
    │   │   └── service/
    │   │       ├── AuthService.java
    │   │       ├── CommentService.java
    │   │       ├── FileService.java
    │   │       ├── NotificationService.java
    │   │       ├── TaskService.java
    │   │       └── UserService.java
    │   └── resources/
    │       ├── application.properties
    │       └── static/                        ← Frontend (served by Spring Boot)
    │           ├── index.html                 Login
    │           ├── register.html
    │           ├── dashboard.html
    │           ├── css/
    │           │   ├── style.css
    │           │   └── dashboard.css
    │           ├── js/
    │           │   ├── api.js                 Fetch wrapper + helpers
    │           │   ├── auth.js                Login/logout/guard
    │           │   ├── dashboard.js
    │           │   ├── my-tasks.js
    │           │   ├── tasks-page.js
    │           │   ├── team.js
    │           │   └── websocket.js           STOMP/SockJS client
    │           └── pages/
    │               ├── tasks.html
    │               ├── my-tasks.html
    │               ├── team.html
    │               ├── reports.html
    │               └── roles.html
    └── test/
        └── TaskFlowApplicationTests.java
```
 
---
 
## Prerequisites
 
- Java 17+
- Maven 3.8+
- MySQL 8.0+
 
---
 
## Setup & Run
 
### 1. Create the MySQL database
 
```sql
CREATE DATABASE taskflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
 
### 2. Configure `application.properties`
 
Edit `src/main/resources/application.properties`:
 
```properties
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
 
# Optional: configure Gmail SMTP for email reminders
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```
 
### 3. Run the application
 
```bash
mvn spring-boot:run
```
 
### 4. Open in browser
 
```
http://localhost:8080
```
 
---
 
## Demo Credentials
 
Seeded automatically on first run by `DataInitializer`:
 
| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin |
| `sarah` | `sarah123` | Editor |
| `mike` | `mike123` | Editor |
| `priya` | `priya123` | Viewer |
 
---
 
## REST API Reference
 
### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public |
 
### Tasks
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/tasks` | All |
| GET | `/api/tasks/my` | All |
| GET | `/api/tasks/{id}` | All |
| GET | `/api/tasks/search?q=` | All |
| POST | `/api/tasks` | Admin, Editor |
| PUT | `/api/tasks/{id}` | Admin, Editor |
| PATCH | `/api/tasks/{id}/status` | Admin, Editor |
| DELETE | `/api/tasks/{id}` | Admin |
| GET | `/api/tasks/reports` | Admin, Editor |
 
### Comments
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/tasks/{id}/comments` | All |
| POST | `/api/tasks/{id}/comments` | All |
| DELETE | `/api/tasks/{taskId}/comments/{id}` | Author, Admin |
 
### Files
| Method | Endpoint | Role |
|---|---|---|
| POST | `/api/tasks/{id}/files` | Admin, Editor |
| GET | `/api/files/{id}/download` | All |
| DELETE | `/api/files/{id}` | Admin, Editor |
 
### Users
| Method | Endpoint | Role |
|---|---|---|
| GET | `/api/users` | Admin, Editor |
| GET | `/api/users/{id}` | All |
| PATCH | `/api/users/{id}/role` | Admin |
| PATCH | `/api/users/{id}/toggle-active` | Admin |
 
---
 
## WebSocket
 
Connect via STOMP over SockJS at `/ws`.
 
| Channel | Event |
|---|---|
| `/topic/tasks` | Task status changes |
| `/user/queue/notifications` | Personal: task assigned, deadline |
| `/topic/tasks/{id}/comments` | New comment on specific task |
 
---
 
## Security Architecture
 
```
Request → JwtAuthenticationFilter
             ↓ validates Bearer token
           SecurityContextHolder.setAuthentication()
             ↓
           authorizeHttpRequests rules
             ↓
           @PreAuthorize on service methods
             ↓
           Controller → Service → Repository
```
 
Passwords hashed with **BCrypt** (10 rounds). JWT signed with **HS512**. Token expiry: **24 hours**.
 
---
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.2 |
| Security | Spring Security 6 + JWT (jjwt 0.11) |
| Persistence | Spring Data JPA + Hibernate |
| Database | MySQL 8 |
| Real-time | WebSocket + STOMP + SockJS |
| Email | Spring Mail (JavaMailSender) |
| Frontend | HTML5 + CSS3 + Vanilla JavaScript |
| Build | Maven |
 
