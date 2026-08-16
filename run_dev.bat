@echo off
title Digital Twin Development Launcher
echo Starting Digital Twin Services...

:: 1. Start ML Service (Port 8000)
echo Starting Python ML Service...
start "Digital Twin: ML Service" cmd /k "cd ml-service && .\venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: 2. Start Spring Boot Backend (Port 5000)
echo Starting Java Spring Boot Backend...
start "Digital Twin: Spring Backend" cmd /k "set \"JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot\" && cd backend && .\apache-maven-3.9.6\bin\mvn spring-boot:run"

:: 3. Start Frontend Dev Client (Port 5173)
echo Starting React Frontend...
start "Digital Twin: React Frontend" cmd /k "cd frontend && npm run dev"

echo All services launched! Keep the terminal windows open to view logs.
pause
