# Digital Twin of a Human - Behavior Prediction System 🧠 

A state-of-the-art full-stack and AI-powered system designed to learn user behavior, track productivity, and intelligently predict future actions. It visually presents data through a highly premium Cyber-Teal, glassmorphism-styled dashboard.

## 🌟 Overview & Capabilities

The Digital Twin system seamlessly maps human digital habits into a structured mathematical model using modern AI/ML.

- **Real-Time Data Collection:** Log daily activity via a smart UI panel or background APIs.
- **Behavior Modeling & Prediction:** Simulates logical next steps and forecasts your daily productivity.
- **Real-time Engine:** Uses WebSockets to send intelligent focus requests when you drift into a series of distraction activities.
- **Twin Profile:** Auto-generates a living profile mapping your strongest hours and ideal focus patterns.

## 🚀 Architecture Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Recharts (Glassmorphism + Dark Mode).
- **Backend API:** Node.js, Express, Socket.io, JWT Authentication.
- **Database:** MongoDB (Mongoose Schema with compound indexes).
- **ML Service:** Python 3.10+, FastAPI, PyTorch/scikit-learn (Mocks implemented for initial deployment scalability).

## 📂 Folder Structure

```text
/digital-twin
  ├── /frontend      # React Dashboard (Vite + Tailwind)
  ├── /backend       # Node.js API (Express + MongoDB)
  ├── /ml-service    # Python AI Engine (FastAPI)
```

## 🛠️ Installation & Testing locally

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB instance running locally on `mongodb://localhost:27017`

### 1. ML Service (Port 8000)
```bash
cd ml-service
python -m venv venv
source venv/Scripts/activate # On Windows PowerShell: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Spring Boot Backend (Port 5000)
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
*(Ensure MongoDB is running on port 27017 or update `backend/src/main/resources/application.yml`)*

### 3. Frontend Dashboard (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

## 📜 API Documentation

### Backend (`/api`)
- `POST /auth/login` | `POST /auth/signup` -> JWT Generation
- `POST /activity/log` -> Log new habit/activity
- `GET /prediction/next-action` -> ML inference for action prediction
- `GET /insights` -> Comprehensive daily/weekly aggregations

### ML Microservice (`/predict`)
- `POST /predict/next-action` -> Payload includes massive payload of sequence events. Uses time-series prediction.
- `POST /predict/productivity` -> Forecasting mechanism.

## 🤝 Next Steps
- Implement full continuous background scraping (e.g. Chrome Extension) to auto-fill the activity log.
- Swap out the mocked ML fallbacks in FastAPI with fully trained weights (.pt/.h5).

---
*Built for the ultimate behavior simulation experience.*
