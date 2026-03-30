# Queue Management System - Setup & API Documentation

## 🚀 Project Overview

This is a real-time queue management system with two main client applications:
- **Consumer App**: Users join queues and track their position
- **Merchant App**: Queue managers view and advance queues

## 📦 Tech Stack

- **Frontend**: React 19 + Vite
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client
- **Routing**: React Router v6
- **Backend**: NestJS with WebSockets

## 📁 Project Structure

```
spotly/
├── client/
│   ├── consumer/
│   │   ├── onenest/  (Main React Vite App)
│   │   │   └── src/
│   │   │       ├── api/           (API clients)
│   │   │       ├── components/    (Reusable components)
│   │   │       ├── hooks/         (Custom hooks)
│   │   │       ├── pages/         (Page components)
│   │   │       ├── store/         (Zustand store)
│   │   │       ├── styles/        (CSS files)
│   │   │       ├── utils/         (Utilities like Socket.io)
│   │   │       └── App.jsx
│   │   └── src/  (Shared utilities)
│   └── merchant/ (Merchant app - similar structure)
└── server/      (NestJS backend)
```

## 🔌 Installation

### Install Dependencies

```bash
# In onenest directory
cd spotly/client/consumer/onenest
npm install

# Or if using yarn
yarn install
```

### Start Development Server

```bash
npm run dev
# or
yarn dev
```

The app will be available at `http://localhost:5173`

## 🌐 Real-Time Setup

### Socket.io Connection

The app automatically initializes a Socket.io connection on load:

```javascript
// In App.jsx
import { initializeSocket } from './utils/socket';

useEffect(() => {
  initializeSocket();
}, []);
```

**Connection settings** (in `src/utils/socket.js`):
- Base URL: `http://localhost:3000` (Backend)
- Reconnection: Enabled with exponential backoff
- Max attempts: 5
- Reconnection delay: 1s - 5s

## 📊 State Management (Zustand)

### Consumer State

```javascript
{
  // User info
  user: { id, name, email },
  
  // Queue tracking
  currentQueue: { id, name, ...},
  position: 5,
  status: 'waiting' | 'served' | 'completed',
  
  // Real-time updates
  queueUpdated: timestamp,
  positionChanged: newPosition,
  queueAdvanced: userInfo
}
```

### Merchant State

```javascript
{
  queueList: [...],
  activeToken: tokenNumber,
  merchantStats: {
    totalUsers: number,
    usersServed: number,
    avgWaitTime: number
  }
}
```

### Store Usage

```javascript
import { useStore } from './store/index.js';

const { position, currentQueue, setPosition } = useStore();
```

## 📡 API Integration

### Base Configuration

- **Base URL**: `http://localhost:3000`
- **Timeout**: 10 seconds
- **Authentication**: Ready for Bearer token (see interceptors)

### Consumer Endpoints (Required)

#### 1. Join Queue
```
POST /queue/join
Request:
{
  "queueId": "string",
  "userName": "string"
}

Response:
{
  "queue": { id, name, avgWaitTime, ... },
  "position": number,
  "success": boolean
}
```

#### 2. Get Queue Status
```
GET /queue/:queueId/status
Response:
{
  "queueId": "string",
  "userPosition": number,
  "totalUsers": number,
  "avgWaitTime": number,
  "status": "string"
}
```

#### 3. Leave Queue
```
POST /queue/leave
Request:
{
  "queueId": "string",
  "userId": "string"
}

Response:
{
  "success": boolean,
  "message": "string"
}
```

#### 4. Available Queues
```
GET /queue/available
Response: [
  {
    "id": "string",
    "name": "string",
    "currentPosition": number,
    "avgWaitTime": number,
    "totalUsers": number
  }
]
```

### Merchant Endpoints (Required)

#### 1. Create Queue
```
POST /merchant/queue
Request:
{
  "name": "string",
  "merchantId": "string"
}

Response:
{
  "queueId": "string",
  "name": "string"
}
```

#### 2. Get Queue List
```
GET /merchant/queues
Response: [
  {
    "id": "string",
    "name": "string",
    "users": [...],
    "stats": {...}
  }
]
```

#### 3. Advance Queue (Call Next)
```
POST /merchant/queue/:queueId/advance
Response:
{
  "nextUser": { id, name, position },
  "success": boolean
}
```

#### 4. Remove User
```
POST /merchant/queue/:queueId/remove/:userId
Response:
{
  "success": boolean,
  "message": "string"
}
```

#### 5. Reset Queue
```
POST /merchant/queue/:queueId/reset
Response:
{
  "success": boolean,
  "message": "string"
}
```

## 📡 Socket.io Events

### Consumer Events (Listen)

```javascript
// Real-time position update
socket.on('position_changed', (data) => {
  // { newPosition: number }
});

// Queue advanced (someone served)
socket.on('queue_advanced', (data) => {
  // { currentToken: number, nextUser: { name, ... } }
});

// Queue updated
socket.on('queue_updated', (data) => {
  // { queue, totalUsers, avgWaitTime }
});

// Queue cancelled/closed
socket.on('queue_cancelled', (data) => {
  // { reason: string }
});
```

### Consumer Events (Emit)

```javascript
// Request position update
socket.emit('request_position', { queueId });

// Notify leaving
socket.emit('user_leaving', { queueId, userId });
```

### Merchant Events (Listen)

```javascript
// New user joined
socket.on('user_joined', (data) => {
  // { userId, name, position }
});

// User left
socket.on('user_left', (data) => {
  // { userId, newTotalUsers }
});

// Queue stats updated
socket.on('queue_stats_updated', (data) => {
  // { avgWaitTime, totalUsers, usersServed }
});
```

### Merchant Events (Emit)

```javascript
// Serve next user
socket.emit('advance_queue', { queueId });

// Remove specific user
socket.emit('remove_user', { queueId, userId });

// Reset entire queue
socket.emit('reset_queue', { queueId });
```

## 🪝 Custom Hooks

### useJoinQueue()
```javascript
const { joinQueue } = useJoinQueue();
await joinQueue(queueId, userName);
```

### useLeaveQueue()
```javascript
const { leaveQueue } = useLeaveQueue();
await leaveQueue(userId);
```

### useQueueStatus()
```javascript
const { getQueueStatus } = useQueueStatus();
const status = await getQueueStatus(queueId);
```

### useQueueUpdates()
```javascript
// Automatically sets up socket listeners
useQueueUpdates();
```

## 🎨 Styling

- CSS modules used for component isolation
- Responsive design with mobile-first approach
- Gradient backgrounds and smooth animations
- Directory: `src/styles/`

## ⚠️ Important Notes

1. **Environment Variables**: Create needed settings in `.env` if needed
2. **CORS**: Backend must have CORS enabled for `http://localhost:5173`
3. **Backend URL**: Update API base URL if backend runs on different port
4. **Socket namespace**: Default is '/', can be configured in `src/utils/socket.js`
5. **Auth**: Token-based auth setup ready in `api/client.js` interceptors

## 📝 API Contract Coordination

### Frontend expects:
- Exact response structure as documented
- Socket events named as specified
- HTTP status codes: 200 (success), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)
- Error responses: `{ message: string }` format

### Backend must provide:
- All documented endpoints
- All socket events with correct payloads
- Proper error handling
- CORS headers
- Request validation

## 🧪 Testing the Setup

1. Start backend: `npm run start` (in server directory)
2. Start frontend: `npm run dev` (in consumer/onenest directory)
3. Open `http://localhost:5173`
4. Test flow:
   - View available queues (Home page)
   - Join a queue (Join Queue page)
   - Track position in real-time (Queue Status page)
   - Leave queue to return to Home

## 🔧 Troubleshooting

- **Socket not connecting**: Check if backend is running on port 3000
- **API calls failing**: Verify backend is running and CORS is configured
- **Position not updating**: Check Socket.io connection in browser DevTools
- **Styles not loading**: Ensure CSS files are imported in components

## 📚 Next Steps

1. Implement Merchant app using same patterns
2. Add authentication system
3. Implement user profiles
4. Add push notifications
5. Implement queue analytics dashboard
