# Upgraded version of Student Attendance v1

<h1>AttendX</h1>
A production-grade 3-tier attendance management system built with Spring Boot, React, and MariaDB.

## Tech Stack
- **Frontend:** React + Vite + Nginx
- **Backend:** Java 21 + Spring Boot 3.5 + Spring Data JPA
- **Database:** MariaDB
- **Infrastructure:** Docker + Docker Compose + Kubernetes

## Architecture

<img width="1472" height="1960" alt="image" src="https://github.com/user-attachments/assets/ef9ae69b-0d46-400c-a826-a61490f4c948" />


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

<h1>ScreenShots Of Updated UI</h1>

<img width="1024" height="666" alt="1" src="https://github.com/user-attachments/assets/621446c5-a632-4361-87a3-45ef4c1853b2" />
<img width="1024" height="666" alt="2" src="https://github.com/user-attachments/assets/d3d0d9c1-6d4d-40bc-b801-4dfa1d3ff65c" />
<img width="1024" height="666" alt="3" src="https://github.com/user-attachments/assets/82b36ce7-fc92-43cc-abbb-37661b8b66de" />
<img width="1024" height="666" alt="4" src="https://github.com/user-attachments/assets/3c1a1bce-cb90-43c6-873a-dd09ce504f07" />
<img width="1024" height="666" alt="5" src="https://github.com/user-attachments/assets/1a4d6a61-cded-4d9f-b2a1-5958414d878a" />
<img width="1024" height="666" alt="6" src="https://github.com/user-attachments/assets/b36a7779-ee4a-459d-9abe-c64773284c60" />
<img width="1024" height="666" alt="8" src="https://github.com/user-attachments/assets/d6d7ea90-d477-4f3e-a9f4-1271c70315be" />
<img width="1024" height="666" alt="7" src="https://github.com/user-attachments/assets/483520d9-0b0a-4c6d-b427-39fa4c96188d" />
<img width="1024" height="666" alt="9" src="https://github.com/user-attachments/assets/f6e2975c-4dbc-4b8f-b404-ec271a7486b5" />

