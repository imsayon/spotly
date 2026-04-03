# 🎫 Spotly Consumer API

Real-time queue management backend with Socket.IO support for the Spotly consumer app.

## ✨ Features

- **In-Memory Database**: Simple storage for MVP
- **Real-time Queue Updates**: WebSocket via Socket.IO
- **Token-Based Queue**: Automatic token assignment
- **Position Tracking**: Live position updates
- **Auto Queue Advancement**: Automatic progression through queue
- **Missed Handling**: Auto-timeout after 30 seconds of being called
- **CORS Enabled**: Works with frontend on different ports
- **TypeScript**: Full type safety

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ or 18+
- npm or yarn

### Installation

```bash
cd server/consumer-api

# Install dependencies
npm install
```

### Development

```bash
# Run with ts-node (hot reload)
npm run dev

# Server will start on http://localhost:3000
```

### Production Build

```bash
# Build TypeScript
npm run build

# Run compiled code
npm start
```

## 📚 API Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-04-03T12:00:00.000Z"
}
```

### Merchants

#### List Merchants

```http
GET /api/v1/merchants
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "merchant-1",
      "name": "The Coffee Hub",
      "category": "Coffee Shop",
      "address": "123 Main St, Downtown",
      "lat": 40.7128,
      "lng": -74.006,
      "isOpen": true,
      "rating": 4.5,
      "queueState": {
        "merchantId": "merchant-1",
        "currentToken": 5,
        "nextToken": 12,
        "totalWaiting": 7,
        "avgWaitTime": 2
      }
    }
  ]
}
```

#### Get Single Merchant

```http
GET /api/v1/merchants/:id
```

### Queue Operations

#### Join Queue

```http
POST /api/v1/merchants/:merchantId/queue
Content-Type: application/json

{
  "userId": "user-123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "entry-uuid",
    "merchantId": "merchant-1",
    "userId": "user-123",
    "tokenNumber": 12,
    "status": "WAITING",
    "position": 7,
    "createdAt": "2026-04-03T12:00:00.000Z",
    "eta": 14
  }
}
```

#### Get Queue Status

```http
GET /api/v1/queue/:entryId
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "entry-uuid",
    "merchantId": "merchant-1",
    "userId": "user-123",
    "tokenNumber": 12,
    "status": "WAITING",
    "position": 5,
    "createdAt": "2026-04-03T12:00:00.000Z",
    "eta": 10
  }
}
```

#### Mark Arrived (Serve)

```http
POST /api/v1/queue/:entryId/arrived
Content-Type: application/json

{
  "otp": "123456"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "entry-uuid",
    "status": "SERVED",
    "servedAt": "2026-04-03T12:05:00.000Z"
  }
}
```

#### Leave Queue

```http
DELETE /api/v1/queue/:entryId
```

Response:
```json
{
  "success": true,
  "message": "Successfully left queue"
}
```

### Admin Operations

#### Call Next Customer

```http
POST /api/v1/merchants/:merchantId/queue/call-next
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "entry-uuid",
    "tokenNumber": 6,
    "status": "CALLED"
  }
}
```

#### Advance Queue

```http
POST /api/v1/merchants/:merchantId/queue/advance
```

Response:
```json
{
  "success": true,
  "data": {
    "merchantId": "merchant-1",
    "currentToken": 6,
    "nextToken": 12,
    "totalWaiting": 6
  }
}
```

#### Get Queue State

```http
GET /api/v1/merchants/:merchantId/queue-state
```

## 🔌 WebSocket Events

### Connect

```typescript
// Client initiates connection
socket = io('http://localhost:3000');
```

### Emit

#### Join Merchant Room

```typescript
socket.emit('joinRoom', 'merchant-1');
```

#### Leave Merchant Room

```typescript
socket.emit('leaveRoom', 'merchant-1');
```

### Listen

#### Queue Updated

```typescript
socket.on('queue_updated', (data) => {
  console.log('Queue update:', data);
  // {
  //   event: 'joined' | 'called' | 'served' | 'missed' | 'cancelled',
  //   tokenNumber: number,
  //   position?: number,
  //   status?: string,
  //   totalWaiting?: number,
  //   timestamp: string
  // }
});
```

#### Position Changed

```typescript
socket.on('position_changed', (data) => {
  console.log('Position updated:', data);
  // {
  //   position: number,
  //   eta?: number,
  //   timestamp: string
  // }
});
```

#### Queue Called

```typescript
socket.on('queue_called', (data) => {
  console.log('You are called!', data);
  // {
  //   tokenNumber: number,
  //   entryId: string,
  //   timestamp: string
  // }
});
```

#### Queue Advanced

```typescript
socket.on('queue_advanced', (data) => {
  console.log('Queue advanced:', data);
  // {
  //   currentToken: number,
  //   nextToken: number,
  //   totalWaiting: number,
  //   timestamp: string
  // }
});
```

## 🏗️ Architecture

### Database Layer (`db.ts`)

In-memory database with:
- Merchants collection
- Queue entries tracking
- Queue state management
- User records
- Automatic missed timeout (30s)

### Server (`server.ts`)

Express + Socket.IO with:
- CORS support
- Request logging
- Error handling
- WebSocket event management
- API route handlers

### Entry Point (`index.ts`)

Server initialization with:
- Port listening
- Graceful shutdown
- Error handling
- Console logging

## 🔄 Queue Flow

```
1. User joins queue
   ↓
2. Backend assigns token
   ↓
3. Socket emits 'queue_updated'
   ↓
4. User position = total_waiting - 1
   ↓
5. ETA = position * avg_wait_time
   ↓
6. When called:
   - Status = "CALLED"
   - 30s timeout set
   ↓
7. If user confirms:
   - Status = "SERVED"
   - Queue advances
   - Next customer called
   ↓
8. If user misses:
   - Status = "MISSED"
   - Queue advances
```

## ⚙️ Configuration

### Environment Variables

```bash
PORT=3000              # Server port (default: 3000)
NODE_ENV=development   # development | production
```

### Constants

- **Default Port**: 3000
- **Missed Timeout**: 30 seconds
- **Avg Wait Time**: 2 minutes per customer
- **CORS**: All origins (configurable)

## 🧪 Testing

### Manual Testing with curl

```bash
# Join queue
curl -X POST http://localhost:3000/api/v1/merchants/merchant-1/queue \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123"}'

# Get queue status
curl http://localhost:3000/api/v1/queue/{entryId}

# Call next
curl -X POST http://localhost:3000/api/v1/merchants/merchant-1/queue/call-next

# Mark arrived
curl -X POST http://localhost:3000/api/v1/queue/{entryId}/arrived \
  -H "Content-Type: application/json" \
  -d '{"otp": "123456"}'
```

### Socket.IO Testing

Use Socket.IO client library or web-based tester:

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('joinRoom', 'merchant-1');
});

socket.on('queue_updated', (data) => {
  console.log('Queue update:', data);
});

socket.on('queue_called', (data) => {
  console.log('Called!', data);
});
```

## 📊 Data Models

### Merchant

```typescript
{
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  isOpen: boolean;
  phone?: string;
  rating?: number;
}
```

### QueueEntry

```typescript
{
  id: string;              // UUID
  merchantId: string;
  userId: string;
  tokenNumber: number;     // Customer-facing token
  status: QueueStatus;     // WAITING, CALLED, SERVED, MISSED, CANCELLED
  position: number | null; // Position in queue
  createdAt: Date;
  calledAt?: Date;
  servedAt?: Date;
  missedAt?: Date;
  eta?: number;            // Estimated time in minutes
  otp?: string;
}
```

### QueueState

```typescript
{
  merchantId: string;
  currentToken: number;    // Token being served
  nextToken: number;       // Next token to assign
  totalWaiting: number;    // People in queue
  avgWaitTime: number;     // Minutes per customer
}
```

## 🔒 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "optional_error_code"
  }
}
```

Status codes:
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **404**: Not Found
- **500**: Server Error

## 🚦 Logging

Server logs important events:

```
[2026-04-03T12:00:00.000Z] POST /api/v1/merchants/merchant-1/queue
[Queue] User user-123 joined merchant merchant-1 with token #12
[Socket] Emitted queue_updated for merchant-1
[Socket] Client connected: socket-id-123
[Socket] socket-id-123 joined room: merchant-1
```

## 🔧 Development Tips

1. **Hot Reload**: Use `npm run dev` for auto-restart on file changes
2. **Logging**: Check console for detailed event information
3. **Testing Clients**: Open multiple tabs to test queue behavior
4. **Admin Endpoints**: Use `/call-next` and `/advance` to simulate real usage

## 📝 Future Enhancements

- [ ] Persistent database (PostgreSQL/MongoDB)
- [ ] Authentication & Authorization
- [ ] Rate limiting
- [ ] Request validation
- [ ] API versioning
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance monitoring
- [ ] Load balancing
- [ ] Queue analytics

## 📄 License

Proprietary - Spotly Inc.

## 📞 Support

For issues or questions, check the logs or contact the team.
