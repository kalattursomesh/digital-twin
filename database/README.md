# MongoDB Database Schema & Setup

This directory is reserved for database initialization scripts, schemas, and configurations. The Digital Twin behavior prediction system uses **MongoDB** as its primary data store.

## 🚀 Connection Configuration

By default, the backend connects to MongoDB at:
* **Local development:** `mongodb://localhost:27017/digital-twin`
* **Docker execution:** `mongodb://database:27017/digital-twin` (defined in `docker-compose.yml`)

The MongoDB URI can be overridden using the `MONGODB_URI` environment variable.

## 📁 Schemas & Collections

The database contains two main collections:

### 1. `users`
Stores user profile information, authentication credentials, and the generated Twin Profile parameters.
* **Fields:**
  * `_id`: String (UUID or unique identifier)
  * `name`: String
  * `email`: String (Unique index)
  * `password`: String (Bcrypt hashed)
  * `timezone`: String (e.g. `UTC`, `Asia/Kolkata`)
  * `twinProfile`: Object containing:
    * `behaviorCluster`: String (K-Means classified user type, e.g. `Deep Worker`)
    * `averageProductivity`: Double (Overall productivity score out of 10)
    * `dominantActivity`: String (Most frequently logged activity)
    * `lastUpdated`: Date

### 2. `activities`
Tracks all logged daily user habits and behavior telemetry.
* **Fields:**
  * `_id`: String
  * `userId`: String (Index for fast lookup)
  * `activityType`: String (e.g. `coding`, `social_media`, `meetings`)
  * `category`: String (e.g. `productive`, `distraction`, `neutral`)
  * `duration`: Long (in minutes)
  * `startTime`: Date (Indexed for time-series sorting)
  * `endTime`: Date
  * `mlFeatures`: Object containing pre-calculated features:
    * `hourOfDay`: Integer (0-23)
    * `dayOfWeek`: Integer (0-6)
    * `isWeekend`: Boolean
    * `sessionIndex`: Integer
    * `timeSinceLastActivity`: Long
  * `metadata`: Object containing:
    * `productivityScore`: Integer (1-10)
    * `notes`: String

## ⚡ Indexing Strategy

To keep query latencies low during real-time ML inferences, the backend automatically creates indexes:
* `activities` collection has a compound index: `{ userId: 1, startTime: -1 }` to support fetching the most recent activities for predictions.
* `users` has a unique index on `email`.

Auto-index creation is enabled in development through `spring.data.mongodb.auto-index-creation: true` in `application.yml`.
