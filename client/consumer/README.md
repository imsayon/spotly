# 🎫 Spotly Consumer App

A production-ready React Native queue management consumer application built with Expo, TypeScript, Zustand, and Socket.IO.

## ✨ Features

- **Real-time Queue Tracking**: Live position updates via WebSocket
- **Token Management**: Automatic token generation and lifecycle management
- **Push Notifications**: Get alerts when you're getting close to your turn
- **Location-based Discovery**: Find nearby merchants and services
- **Offline Support**: Falls back to mock data when backend unavailable
- **Type-Safe**: Full TypeScript implementation
- **Responsive UI**: Mobile-first design with Tailwind-inspired styling
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 🏗️ Project Structure

```
consumer/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home screen (merchant list)
│   └── queue/
│       └── [merchantId].tsx # Queue status screen
├── components/            # Reusable UI components
│   ├── MerchantCard.tsx
│   ├── QueueStatus.tsx
│   ├── TokenDisplay.tsx
│   ├── PositionTracker.tsx
│   ├── StatusBadge.tsx
│   ├── Loader.tsx
│   ├── ErrorBanner.tsx
│   └── NotificationBanner.tsx
├── hooks/                 # Custom React hooks
│   ├── useQueue.ts       # Main queue operations hook
│   ├── useSocket.ts      # Socket connection management
│   └── useQueueStatus.ts # Queue status tracking
├── services/             # External service integrations
│   ├── api.ts            # API client with interceptors
│   └── socket.ts         # WebSocket client setup
├── store/                # Zustand state stores
│   ├── userStore.ts      # User/auth state
│   ├── merchantStore.ts  # Merchant list state
│   └── queueStore.ts     # Queue entry state
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── constants/            # Configuration constants
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ or 18+
- Expo CLI
- npm or yarn

### Installation

```bash
# Navigate to consumer app
cd client/consumer

# Install dependencies
npm install

# Or with yarn
yarn install
```

### Development

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Type Checking

```bash
npm run type-check
```

## 📱 Key Screens

### Home Screen (`/`)

- Lists nearby merchants with queue status
- Location-based discovery
- Pull-to-refresh functionality
- Fallback to mock data if API unavailable

### Queue Status Screen (`/queue/[merchantId]`)

- Join queue button with confirmation
- Real-time position tracking
- ETA estimation
- Status badges (Waiting, Called, Served, Missed)
- Live connection indicator
- Leave queue option
- Mark as arrived action

## 🧠 State Management (Zustand)

### `useQueueStore`

Manages queue entry state:
- Current entry and position
- Status tracking
- Real-time updates
- API operations (join, leave, getStatus, markArrived)

```typescript
const { entry, position, status, join, leave } = useQueueStore();
```

### `useMerchantStore`

Manages merchant list:
- Nearby merchants
- Selected merchant
- Loading/error states

```typescript
const { merchants, selected, loading } = useMerchantStore();
```

### `useUserStore`

Manages user profile:
- User info
- Authentication state
- Profile updates

```typescript
const { user, isAuthenticated, login, logout } = useUserStore();
```

## 🪝 Custom Hooks

### `useQueue(merchantId)`

Main hook for queue operations:

```typescript
const {
  entry,        // Current queue entry
  loading,      // Loading state
  error,        // Error message
  position,     // Current position in queue
  status,       // Queue status
  eta,          // Estimated time (minutes)
  connected,    // Socket connection status
  join,         // Function to join queue
  leave,        // Function to leave queue
  arrive,       // Function to mark as arrived
} = useQueue(merchantId);
```

### `useSocket(merchantId?)`

Manages socket connection and events:

```typescript
const { connected } = useSocket(merchantId);
```

### `useQueueStatus(threshold?)`

Tracks queue status and triggers notifications:

```typescript
const {
  position,
  eta,
  shouldNotify,
  hasNotified,
  isWaiting,
  isCalled,
} = useQueueStatus(5); // Notify when position <= 5
```

## 🔌 API Endpoints

### Merchants

```typescript
// Find nearby merchants
GET /merchants?lat={lat}&lng={lng}&category={category}

// Get single merchant
GET /merchants/{merchantId}

// Get queue state
GET /merchants/{merchantId}/queue-state
```

### Queue

```typescript
// Join queue
POST /merchants/{merchantId}/queue
Body: { userId }

// Get queue status
GET /queue/{entryId}

// Leave queue
DELETE /queue/{entryId}

// Mark as arrived
POST /queue/{entryId}/arrived
Body: { otp }
```

### Users

```typescript
// Register/upsert user
POST /users
Body: { phone, name }

// Get profile
GET /users/me

// Update profile
PATCH /users/me
Body: { partial user data }
```

## 🔌 WebSocket Events

### Emit

```typescript
// Join room
socket.emit('joinRoom', merchantId)

// Leave room
socket.emit('leaveRoom', merchantId)
```

### Listen

```typescript
// Queue updated
socket.on('queue_updated', (data) => {
  // { position?, status?, eta?, event }
})

// Position changed
socket.on('position_changed', (data) => {
  // { position, eta? }
})

// User called
socket.on('queue_called', (data) => {
  // { tokenNumber, otp? }
})

// Queue advanced
socket.on('queue_advanced', (data) => {
  // { currentToken, nextToken? }
})
```

## 🎨 UI Components

### TokenDisplay

Displays token number prominently:

```typescript
<TokenDisplay tokenNumber={42} size="large" />
```

### PositionTracker

Shows position and ETA:

```typescript
<PositionTracker position={5} eta={10} status="WAITING" />
```

### StatusBadge

Status indicator:

```typescript
<StatusBadge status="WAITING" size="medium" />
```

### NotificationBanner

Notification display:

```typescript
<NotificationBanner
  visible={true}
  type="called"
  title="You're Called!"
  message="Please proceed to counter"
  action={{ label: 'Arrived', onPress: () => {} }}
/>
```

### ErrorBanner

Error display:

```typescript
<ErrorBanner
  visible={!!error}
  message={error}
  type="error"
  onDismiss={() => setError(null)}
/>
```

## 🛠️ Utilities

### Formatting

```typescript
import { formatTime, formatDate, formatPhone } from '@/utils';

formatTime(new Date());           // "02:30 PM"
formatDate(new Date());           // "Apr 2, 2026"
formatPhone("1234567890");        // "(123) 456-7890"
```

### Queue Helpers

```typescript
import { 
  isQueueEntryActive,
  getStatusLabel,
  calculateETA,
} from '@/utils';

isQueueEntryActive(entry);        // true if WAITING or CALLED
getStatusLabel('WAITING');        // "Waiting in Queue"
calculateETA(5, 2);               // 10 (minutes)
```

### Validation

```typescript
import { isValidOTP, isValidPhone } from '@/utils';

isValidOTP("123456");             // true
isValidPhone("1234567890");       // true
```

## ⚙️ Configuration

Environment variables (`.env.local`):

```
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_WS_URL=http://localhost:3000
```

See `constants/index.ts` for application-wide configuration.

## 🔄 Real-time Updates

The app uses Socket.IO for real-time updates:

1. **Connection**: Auto-connects on mount if merchantId provided
2. **Events**: Listens for position, status, and called events
3. **State Sync**: Updates Zustand store automatically
4. **Cleanup**: Properly disconnects on unmount
5. **Reconnection**: Auto-reconnects with exponential backoff

## 🧪 Mock Data

When API is unavailable, the app uses mock merchants:

```typescript
import { MOCK_MERCHANTS } from '@/types';

// Automatically used as fallback in home screen
```

## 📊 Error Handling

Comprehensive error handling:

1. **API Errors**: Intercepted with user-friendly messages
2. **Network Errors**: Fallback to mock data
3. **Socket Errors**: Auto-reconnection with backoff
4. **Validation Errors**: Input validation with warnings
5. **State Errors**: Safe fallbacks with null checks

## 🔐 Best Practices

1. **Type Safety**: All components and functions are fully typed
2. **Error Boundaries**: Wrap screens with error handling
3. **Cleanup**: Always cleanup socket listeners on unmount
4. **Loading States**: Show feedback for all async operations
5. **Accessibility**: Use semantic component names and clear labels
6. **Performance**: Memoize callbacks and use efficient re-renders

## 🚨 Known Limitations

- Authentication is mocked (MOCK_USER_ID)
- Location requires permission grant
- Offline mode shows mock data (read-only)
- OTP validation is server-side

## 📝 TODO

- [ ] Implement real authentication
- [ ] Add push notifications
- [ ] Persist user preferences
- [ ] Add analytics
- [ ] Implement crash reporting
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Implement dark mode
- [ ] Add multi-language support
- [ ] Add accessibility features

## 🤝 Contributing

1. Maintain TypeScript strict mode
2. Follow existing code style
3. Add proper error handling
4. Update types when adding features
5. Test on both iOS and Android

## 📄 License

Proprietary - Spotly Inc.

## 📞 Support

For issues or questions, open an issue or contact the development team.
