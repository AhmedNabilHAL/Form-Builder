# Form Builder Application

A full-stack form builder application that allows users to create forms, publish them, submit responses, and review submissions.

This repository contains both:

- **form-builder-frontend**: React + Vite + TypeScript + Material UI + React Hook Form + TanStack Query
- **form-builder-api**: Spring Boot + MongoDB + MapStruct

The application is structured to support:

- Creating and editing forms
- Rendering public forms dynamically
- Submitting form responses
- Viewing form submissions
- File upload support
- Local development with MongoDB
- Production-ready deployment preparation with Docker files

---
## Running Locally

Follow these steps to run the application on your machine.

### Prerequisites

Make sure you have installed:

- Git
- Docker
- Node.js 18+
- npm
- Java 21
- Maven 3.9+

---

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <your-repository-folder>
```

---

### 2. Start MongoDB locally with Docker

Run the following command:

```bash
docker run -d \
  --name form-builder-mongo \
  -p 27017:27017 \
  -v form_builder_mongo_data:/data/db \
  mongo:latest
```

To verify it is running:

```bash
docker ps
```

MongoDB will be available at:

```text
mongodb://localhost:27017
```

---

### 3. Configure and run the backend

Go to the backend folder:

```bash
cd backend
```

Create or verify this file:

`src/main/resources/application-dev.properties`

with this content:

```properties
spring.data.mongodb.uri=mongodb://localhost:27017/form_builder

logging.level.com.aiagentictask.form_builder_api=DEBUG

app.cors.allowed-origins=http://localhost:5173
app.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
app.cors.allowed-headers=*
app.cors.allow-credentials=false
app.cors.max-age=3600

app.upload.dir=uploads/dev

app.security.enable-hsts=false
```

Run the backend with the `dev` profile.

Linux / macOS:

```bash
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
```

Windows PowerShell:

```powershell
$env:SPRING_PROFILES_ACTIVE="dev"
mvn spring-boot:run
```

The backend will run at:

```text
http://localhost:8080
```

The API base URL will be:

```text
http://localhost:8080/api
```

---

### 4. Configure and run the frontend

Open a new terminal and go to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a file named:

`.env`

inside the `frontend` folder with this content:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Your frontend folder should now look like this:

```text
frontend/
  .env
  package.json
  src/
  ...
```

Run the frontend:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

---

### 5. Open the application

Open this URL in your browser:

```text
http://localhost:5173
```

---

### Local Development URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Backend API: `http://localhost:8080/api`
- MongoDB: `mongodb://localhost:27017`

---

### Useful Docker commands

Stop MongoDB:

```bash
docker stop form-builder-mongo
```

Start it again:

```bash
docker start form-builder-mongo
```

View logs:

```bash
docker logs -f form-builder-mongo
```

Remove it completely:

```bash
docker rm -f form-builder-mongo
```

---

### Troubleshooting

#### CORS error in the browser

Make sure the backend is started with the `dev` profile:

```bash
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
```

and verify that `application-dev.properties` contains:

```properties
app.cors.allowed-origins=http://localhost:5173
```

#### Frontend cannot reach backend

Check that:

- the backend is running on port `8080`
- the `.env` file exists inside `frontend/`
- `VITE_API_BASE_URL=http://localhost:8080/api`
- the MongoDB container is running

#### MongoDB connection error

Make sure Docker is running and the MongoDB container is up:

```bash
docker ps
```

---

### Summary

To run locally:

1. Start MongoDB with Docker
2. Run the backend with `SPRING_PROFILES_ACTIVE=dev`
3. Create `frontend/.env`
4. Run the frontend with `npm run dev`
5. Open `http://localhost:5173`

## Project Structure

```text
.
├── form-builder-frontend/   # React + Vite application
└── form-builder-api/    # Spring Boot API
```
