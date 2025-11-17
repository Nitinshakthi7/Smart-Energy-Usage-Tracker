# Smart Energy Usage Tracker

A simple full‑stack web application to track and visualize home electricity usage. Users can register, log in, define a home with rooms and devices, then submit energy readings for each device to see usage and cost over time.

## Folder Structure

```text
Smart-Energy-Usage-Tracker/
├─ backend/              # Express + MongoDB API
│  ├─ config/            # Database connection (Mongoose)
│  ├─ controllers/       # Route handlers (auth, homes, readings, analytics)
│  ├─ middleware/        # Auth (JWT) and validation
│  ├─ models/            # Mongoose models (User, Home, EnergyReading, Alert)
│  ├─ routes/            # API route definitions
│  └─ server.js          # Express app entrypoint
├─ frontend/             # Static frontend (HTML/CSS/JS)
│  └─ js/                # Client-side scripts (auth, dashboard, API helper)
├─ package.json          # Node project config (backend scripts & deps)
└─ README.md             # Project documentation
```

## How to Use This Project (Locally)

1. **Prerequisites**
   - Node.js (v18+ recommended)
   - npm
   - MongoDB running (local or Atlas connection string)

2. **Install and run**
   ```bash
   git clone https://github.com/<your-username>/Smart-Energy-Usage-Tracker.git
   cd Smart-Energy-Usage-Tracker
   npm install
   ```

3. **Environment variables** – create a `.env` file in the project root:
   ```env
   MONGO_URI=mongodb://localhost:27017/smart-energy-tracker
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=30d
   PORT=5000
   ```

4. **Start the backend API**
   ```bash
   npm run dev   # or: npm start
   ```

5. **Open the frontend**
   - Open `frontend/index.html` directly in your browser, **or**
   - Serve the `frontend/` folder with any static server (e.g. VS Code Live Server).

6. **Authentication & usage flow**
   - Use the API (or the website forms) to:
     1. Register a user
     2. Log in and get a JWT token
     3. Create a home
     4. Add rooms to the home
     5. Add devices to a room
     6. Submit energy readings for devices

Base API URL (default): `http://localhost:5000/api`

---

## Postman / API Examples

All authenticated requests must include:

```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### 1. Register

```http
POST /api/auth/register
Host: localhost:5000
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

### 2. Login

Use the returned `token` as `Bearer <token>` for the next requests.

```http
POST /api/auth/login
Host: localhost:5000
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### 3. Create Home (no default rooms/devices)

```http
POST /api/homes
Host: localhost:5000
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Home",
  "electricityRate": 7.5
}
```

Response will contain the created home, including its `_id`:

```json
{
  "success": true,
  "data": {
    "_id": "<homeId>",
    "name": "My Home",
    "electricityRate": 7.5,
    "rooms": []
  }
}
```

### 4. Add Room to Home

```http
POST /api/homes/<homeId>/rooms
Host: localhost:5000
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Living Room",
  "icon": "🛋️"
}
```

The response will include the updated home with the new room inside `rooms[]`. Grab the room’s `_id` for the next step.

### 5. Add Device to a Room

```http
POST /api/homes/<homeId>/rooms/<roomId>/devices
Host: localhost:5000
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "TV",
  "type": "TV",
  "powerRating": 150
}
```

This stores the device in MongoDB. You can confirm with:

```http
GET /api/homes
Host: localhost:5000
Authorization: Bearer <token>
```

You will see your home, rooms, and devices, including the device’s `_id`.

### 6. Add Energy Data (Single Reading)

Important: Energy readings can only be submitted via Postman or direct API calls. The website interface does not support adding readings directly.
Use the `homeId`, `roomId`, and `deviceId` obtained from the previous responses.

```http
POST /api/readings
Host: localhost:5000
Authorization: Bearer <token>
Content-Type: application/json

{
  "homeId": "<homeId>",
  "roomId": "<roomId>",
  "deviceId": "<deviceId>",
  "watts": 150,
  "duration": 600000
}
```

- `watts` – power draw in watts (often equal to the device’s `powerRating`)
- `duration` – usage duration in milliseconds (e.g. 600000 ms = 10 minutes)

After submitting readings, the dashboard and history views in the website will use this real data from MongoDB.
