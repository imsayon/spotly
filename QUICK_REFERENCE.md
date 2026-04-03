# 🎫 Spotly - Quick Reference Card

## 🚀 Quick Start Commands

### Install Everything
```bash
# Backend
cd server/consumer-api && npm install

# Frontend
cd client/consumer && npm install
```

### Run Development Environment

**Terminal 1 - Backend:**
```bash
cd server/consumer-api
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd client/consumer
npm start
# Choose: 'w' (web), 'i' (iOS), 'a' (Android)
```

## 📚 Essential API Endpoints

### Health & Status
```bash
curl http://localhost:3000/health
```

### Merchants
```bash
# List all merchants
curl http://localhost:3000/api/v1/merchants

# Get single merchant
curl http://localhost:3000/api/v1/merchants/merchant-1
```

### Queue Operations
```bash
# Join queue
curl -X POST http://localhost:3000/api/v1/merchants/merchant-1/queue \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123"}'

# Get status
curl http://localhost:3000/api/v1/queue/{entryId}

# Mark arrived
curl -X POST http://localhost:3000/api/v1/queue/{entryId}/arrived \
  -H "Content-Type: application/json" \
  -d '{"otp": "123456"}'

# Leave queue
curl -X DELETE http://localhost:3000/api/v1/queue/{entryId}
```

### Admin Operations
```bash
# Call next customer
curl -X POST http://localhost:3000/api/v1/merchants/merchant-1/queue/call-next

# Advance queue
curl -X POST http://localhost:3000/api/v1/merchants/merchant-1/queue/advance
```

## 🔌 Socket.IO Events

### Listen (Client)
```typescript
socket.on('queue_updated', (data) => {...})
socket.on('position_changed', (data) => {...})
socket.on('queue_called', (data) => {...})
socket.on('queue_advanced', (data) => {...})
```

### Emit (Client)
```typescript
socket.emit('joinRoom', 'merchant-1')
socket.emit('leaveRoom', 'merchant-1')
```

## 📱 Frontend Screens

1. **Home** (`/`) - List merchants
2. **Queue** (`/queue/:merchantId`) - Join & track queue

## 🎯 Queue Statuses

| Status | Meaning |
|--------|---------|
| `WAITING` | In queue, waiting to be served |
| `CALLED` | Called to service counter |
| `SERVED` | Service completed |
| `MISSED` | Didn't arrive (30s timeout) |
| `CANCELLED` | User left queue |

## 🔧 Environment Configuration

### Backend (.env)
```
PORT=3000
NODE_ENV=development
```

### Frontend (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_WS_URL=http://localhost:3000
```

## 📁 Key Files

| Path | Purpose |
|------|---------|
| `server/consumer-api/src/server.ts` | Express + Socket.IO setup |
| `server/consumer-api/src/db.ts` | In-memory database |
| `client/consumer/services/api.ts` | API client |
| `client/consumer/services/socket.ts` | Socket client |
| `client/consumer/store/queueStore.ts` | State management |
| `client/consumer/app/queue/[merchantId].tsx` | Queue screen |

## 🧪 Testing

### Run E2E Tests
```bash
# Linux/Mac
cd server/consumer-api && bash test-e2e.sh

# Windows
cd server\consumer-api && test-e2e.bat
```

### Test Sequence
1. Join queue
2. Check status
3. Call next
4. Mark arrived
5. Verify service complete

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `lsof -ti:3000 \| xargs kill -9` |
| Can't connect to API | Verify backend running: `curl http://localhost:3000/health` |
| Real-time not working | Check Socket.IO in DevTools Network tab |
| Frontend won't start | Clear cache: `npm start -- --reset-cache` |

## 📊 Data Models

### QueueEntry
```typescript
{
  id: string                    // UUID
  merchantId: string
  userId: string
  tokenNumber: number           // User-facing token
  status: QueueStatus           // WAITING|CALLED|SERVED|MISSED|CANCELLED
  position: number | null       // Queue position
  createdAt: Date
  eta?: number                  // Minutes
  calledAt?: Date
  servedAt?: Date
  missedAt?: Date
}
```

### QueueState
```typescript
{
  merchantId: string
  currentToken: number          // Being served
  nextToken: number             // Next to assign
  totalWaiting: number
  avgWaitTime: number           // Minutes
}
```

## 🎯 Development Workflow

1. **Make changes** to code
2. **Auto-reload** happens (dev mode)
3. **Test in frontend** (web/iOS/Android)
4. **Use DevTools** for debugging
5. **Check backend logs** for errors

## 🔗 Documentation Links

- [Complete Setup Guide](SETUP.md)
- [Backend Docs](server/consumer-api/README.md)
- [Frontend Docs](client/consumer/README.md)

## 💡 Tips

- Use multiple browser tabs to test real-time updates
- Check browser console for client errors
- Check terminal for server errors
- Use `curl` to test APIs directly
- Export Postman collection for better API testing

## 🚀 Next Steps

1. ✅ Run backend: `npm run dev` (consumer-api)
2. ✅ Run frontend: `npm start` (consumer)
3. ✅ Open on web: Press `w`
4. ✅ Test flow: Home → Select merchant → Join queue → See position
5. ✅ Run admin: `curl -X POST http://localhost:3000/api/v1/merchants/merchant-1/queue/call-next`

---

**Ready to queue? Let's go! 🎫**
