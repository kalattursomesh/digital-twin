# Digital Twin Architecture & Data Flow

This document details the high-level system architecture and how telemetry data flows through the application components for behavior prediction.

## 🌐 Component Architecture

The application is structured as a decoupled microservices architecture:

```mermaid
graph TD
    Client["React Frontend<br>(Vite + Recharts)"]
    Gateway["Spring Boot Gateway<br>(Java Backend)"]
    ML["FastAPI ML Service<br>(Python AI Engine)"]
    DB[("MongoDB<br>(Database)")]

    Client <-->|HTTP REST & WebSockets| Gateway
    Gateway <-->|MongoDB Driver| DB
    Gateway -->|HTTP POST Inference| ML
```

## 🔄 Behavioral Telemetry & Prediction Flow

Whenever a user transitions between tasks, the data flows dynamically through the system:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React Client
    participant Backend as Spring Boot API
    participant DB as MongoDB
    participant ML as FastAPI Service

    User->>Frontend: Perform/Log Action
    Frontend->>Backend: POST /api/activity/log
    Backend->>DB: Save Activity (Create ML Features)
    Backend->>DB: Query last 50 activities for User
    DB-->>Backend: Return recent activities
    Backend->>ML: POST /predict/next-action (Payload: activities)
    ML-->>Backend: Return predicted next action + confidence
    Backend-->>Frontend: Return predictions + tailored recommendations
    Frontend-->>User: Update Glassmorphism Dashboard
```

## 🔌 WebSocket Alerts Flow
The real-time notification engine utilizes STOMP over WebSockets:
1. User logs a distraction task.
2. The Backend intercepts the event, checking if the current focus session rules are breached.
3. If breached, the Backend pushes a real-time warning message over `/topic/focus-breach` to the Frontend client.
4. The React dashboard instantly shows an alert notification advising the user to pause and reset.
