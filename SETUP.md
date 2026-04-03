# 🎫 Spotly Consumer System - Setup Guide

Complete guide to set up and run the entire Spotly consumer queue management system with backend API and React Native frontend.

## ✨ What You'll Get

A fully functional real-time queue management system with:
- **Backend**: Express + Node.js + Socket.IO (port 3000)
- **Frontend**: React Native (Expo) with real-time socket updates
- **Real-time Updates**: Live position tracking, notifications, and queue advancement
- **In-Memory Database**: Perfect for MVP and testing

## 🖥️ System Requirements

### Minimum

- Node.js 16+ (recommended 18 LTS)
- npm 8+ or yarn
- 2GB RAM
- Modern browser or mobile device

### For Mobile Testing

Choose one:
- **iOS**: Mac with Xcode + iPhone simulator
- **Android**: Android Studio + Android emulator or physical device
- **Web**: Any modern web browser

## 📋 Prerequisites

1. **Install Node.js**

   - Download from https://nodejs.org/ (LTS version)
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **Install Expo CLI** (for mobile testing)

   ```bash
   npm install -g expo-cli
   ```

3. **Clone/Navigate to Project**

   ```bash
   cd /path/to/spotly
   ```

## 🚀 Installation

### Option 1: Using Setup Script (Linux/Mac)

```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Installation

#### Step 1: Install Backend Dependencies

```bash
cd server/consumer-api
npm install
```

#### Step 2: Install Frontend Dependencies

```bash
cd ../.. # Back to root
cd client/consumer
npm install
```

## 🎯 Running the System

### Terminal 1: Start Backend Server

```bash
cd server/consumer-api
npm run dev
```

Expected output:
```
╔═══════════════════════════════════════════════════════╗
║         🎫 Spotly Consumer API Server                ║
║                                                       ║
║  Status: Running ✓                                   ║
║  Port: 3000                                          ║
║  Socket.IO: Enabled ✓                               ║
║  WebSocket: ws://localhost:3000                      ║
║  API: http://localhost:3000/api/v1                   ║
╚═══════════════════════════════════════════════════════╝
```

✅ Backend is now running on `http://localhost:3000`

### Terminal 2: Start Frontend

```bash
cd client/consumer
npm start
```

Expected output:
```
Expo DevTools is running at http://localhost:19000

LAN: exp://192.168.x.x:19000
Press 'a' for Android, 'i' for iOS, 'w' for web
```

### Terminal 3 (Optional): Run Tests

While both are running, optionally test endpoints:

```bash
curl http://localhost:3000/api/v1/merchants
```

## 📱 Accessing the Frontend

### On Web

Press `w` in the frontend terminal:
```
→ Press 'i' to open iOS simulator
→ Press 'a' to open Android emulator
→ Press 'w' to open web browser
```

Browser will open at `http://localhost:19000`

### On iOS Simulator

```bash
cd client/consumer
npm run ios
```

### On Android Emulator

```bash
cd client/consumer
npm run android
```

### On Physical Device

1. Download Expo Go app from App Store / Play Store
2. Scan QR code from terminal with Expo Go
3. App loads on your device

## 🧪 Testing the Complete Flow

### Step 1: Open Frontend

Navigate to home screen and see merchants.

### Step 2: Join Queue

1. Tap a merchant from the list
2. Tap "Join Queue Now"
3. See your token number appear

### Step 3: Test Real-time Updates

Open multiple browser tabs (or devices) to see real-time position updates across and between clients.

### Step 4: Advance Queue (Admin Endpoint)

In a new terminal, manually advance the queue:

```bash
# Call next customer
curl -X POST http://localhost:3000/api/v1/merchants/merchant-1/queue/call-next
```

In the app, you'll see notification "You're Called! 📢"

### Step 5: Confirm Arrival

Tap "I've Arrived" button in the app notification.

### Step 6: Check Completion

Your status will change to "✅ Service Complete"

## 🔌 API Testing with cURL

### Get All Merchants

```bash
curl http://localhost:3000/api/v1/merchants
```

### Join Queue

```bash
curl -X POST http://localhost:3000/api/v1/merchants/merchant-1/queue \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "merchantId": "merchant-1",
    "tokenNumber": 5,
    "status": "WAITING",
    "position": 2,
    "eta": 4
  }
}
```

### Get Queue Status

```bash
curl http://localhost:3000/api/v1/queue/{entryId}
```

### Call Next Customer

```bash
curl -X POST http://localhost:3000/api/v1/merchants/merchant-1/queue/call-next
```

### Mark Arrived

```bash
curl -X POST http://localhost:3000/api/v1/queue/{entryId}/arrived \
  -H "Content-Type: application/json" \
  -d '{"otp": "123456"}'
```

### Leave Queue

```bash
curl -X DELETE http://localhost:3000/api/v1/queue/{entryId}
```

## 🔧 Build for Production

### Backend

```bash
cd server/consumer-api
npm run build
npm start
```

### Frontend

```bash
cd client/consumer
eas build --platform ios
eas build --platform android
```

## 📊 Project Structure

```
spotly/
├── client/
│   └── consumer/               # React Native Expo app
│       ├── app/               # Screens (navigation)
│       ├── components/        # Reusable UI components
│       ├── hooks/             # Custom React hooks
│       ├── services/          # API & Socket clients
│       ├── store/             # Zustand state management
│       ├── types/             # TypeScript definitions
│       ├── utils/             # Utilities & helpers
│       ├── constants/         # App configuration
│       └── package.json
│
└── server/
    └── consumer-api/          # Express + Socket.IO backend
        ├── src/
        │   ├── index.ts       # Entry point
        │   ├── server.ts      # Express setup
        │   ├── db.ts          # In-memory database
        │   └── types.ts       # TypeScript definitions
        └── package.json
```

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill the process using port 3000
# Linux/Mac:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Or change the port:

```bash
PORT=3001 npm run dev
```

### Expo Won't Connect

1. Ensure both backend and frontend are running
2. Check network connectivity
3. Clear cache:
   ```bash
   expo cache clean
   npm start -- --reset-cache
   ```

### API Errors (404, CORS)

1. Verify backend is running: `curl http://localhost:3000/health`
2. Check frontend `.env.example`:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
   EXPO_PUBLIC_WS_URL=http://localhost:3000
   ```

### Socket.IO Not Connecting

1. Ensure backend is running
2. Check browser console for errors
3. Verify port 3000 is accessible
4. Try polling transport:
   ```bash
   # Edit socket.ts
   transports: ['polling', 'websocket']
   ```

### Black Screen on Startup

This is normal for Expo on first load. Press:
- `w` for web
- `a` for Android
- `i` for iOS

## 📚 Documentation

- **Backend API**: See [server/consumer-api/README.md](server/consumer-api/README.md)
- **Frontend App**: See [client/consumer/README.md](client/consumer/README.md)

## 🎯 Key Features to Test

- ✅ View merchants
- ✅ Join queue
- ✅ See position in real-time
- ✅ Get position updates via socket
- ✅ Receive "You're Called" notification
- ✅ Confirm arrival ("I've Arrived")
- ✅ Automatic queue advancement
- ✅ Missed notification (30s timeout)
- ✅ Leave queue
- ✅ Error handling

## 📞 Support

- Check terminal logs for errors
- Verify both backend and frontend are running
- Ensure network connectivity between devices
- Check firewall settings if on different machines

## 🎓 Learning Resources

- [Express.js](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [React Native](https://reactnative.dev/)
- [Expo](https://docs.expo.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zustand](https://github.com/pmndrs/zustand)

## ✨ Next Steps After Setup

1. Customize merchant data in [server/consumer-api/src/db.ts](server/consumer-api/src/db.ts)
2. Add database (MongoDB, PostgreSQL)
3. Implement authentication
4. Add push notifications
5. Deploy to production
6. Add more features

---

**Enjoy your Spotly consumer system! 🚀**
