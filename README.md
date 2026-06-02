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

<img width="1024" height="666" alt="9" src="https://github.com/user-attachments/assets/fad073d2-685a-4682-8d0b-d99e4483445e" />
<img width="1024" height="666" alt="8" src="https://github.com/user-attachments/assets/ff831a6b-f9ba-4798-9c71-a62902c66d3b" />
<img width="1024" height="666" alt="7" src="https://github.com/user-attachments/assets/98e2e342-7ec6-4547-b88e-a0e2bf217b5a" />
<img width="1024" height="666" alt="6" src="https://github.com/user-attachments/assets/6e62f103-26d7-4ddf-9775-b3da2fb0f8d4" />
<img width="1024" height="666" alt="5" src="https://github.com/user-attachments/assets/304a7cde-72d0-4ed7-a5ed-3d29efef8a8a" />
<img width="1024" height="666" alt="4" src="https://github.com/user-attachments/assets/0229a208-e10e-4db3-904e-3221aad87071" />
<img width="1024" height="666" alt="3" src="https://github.com/user-attachments/assets/c957fe11-7420-4500-b91b-584a845b3281" />
<img width="1024" height="666" alt="2" src="https://github.com/user-attachments/assets/0581d121-09c7-4e30-a670-5d9f76547ee8" />
<img width="1024" height="666" alt="1" src="https://github.com/user-attachments/assets/a5e80805-6fbc-4028-a7ed-e4db6c59b6ba" />

