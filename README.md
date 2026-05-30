# AttendX — Student Attendance Management System

A production-grade 3-tier attendance management system built with Spring Boot, React, and MariaDB.

## Tech Stack
- **Frontend:** React + Vite + Nginx
- **Backend:** Java 21 + Spring Boot 3.5 + Spring Data JPA
- **Database:** MariaDB
- **Infrastructure:** Docker + Docker Compose + Kubernetes

## Architecture
## Local Development

### Prerequisites
- Docker Desktop
- Java 21+
- Node 20+

### Run with Docker (recommended)
```bash
git clone https://github.com/YOUR_USERNAME/AttendanceApp.git
cd AttendanceApp
cp .env.example .env
# Edit .env with your values
docker-compose up --build
```
Open http://localhost

### Run without Docker
```bash
# Terminal 1 — Backend
cd backend
DB_URL=jdbc:mariadb://localhost:3306/attendance \
DB_USERNAME=attendx \
DB_PASSWORD=yourpassword \
java -jar target/attendance-backend-1.0.0.jar

# Terminal 2 — Frontend
cd frontend/attendance-frontend
npm install
npm run dev
```

## Default Credentials
- Teacher password: `teacher123`
- Student login: select name + Gmail set by teacher

## Project Structure
AttendanceApp/
├── backend/          # Spring Boot REST API
├── frontend/         # React + Vite dashboard
├── docker-compose.yml
└── .env.example
