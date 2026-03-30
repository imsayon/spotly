# Consumer Application - Queue Management System

## Overview

The Consumer App allows users to join queues, track their real-time position, and receive notifications when they're about to be served.

## Features

✅ **Queue Management**
- Browse available queues
- Join queues with your name
- Real-time position tracking
- Live updates via Socket.io

✅ **User Experience**
- Clean, responsive UI
- Real-time position updates
- Notification when near turn
- Easy queue exit

✅ **Real-time Updates**
- Socket.io for instant updates
- Automatic reconnection
- Smooth animations

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Backend server running on port 3000

### Installation

```bash
cd spotly/client/consumer/onenest
npm install
```

### Start Development

```bash
npm run dev
```

App will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── api/
│   └── client.js          # Centralized API client with interceptors
├── components/
│   ├── LoadingSpinner.jsx
│   └── ...                # Reusable components
├── hooks/
│   └── useQueue.js        # Custom hooks for queue operations
├── pages/
│   ├── Home.jsx           # Browse & select queues
│   ├── JoinQueue.jsx      # Join queue form
│   └── QueueStatus.jsx    # Position tracker
├── store/
│   └── index.js           # Zustand store (state management)
├── styles/
│   ├── Home.css
│   ├── JoinQueue.css
│   ├── QueueStatus.css
│   └── LoadingSpinner.css
├── utils/
│   └── socket.js          # Socket.io initialization & helpers
├── App.jsx                # Main app with routing
├── main.jsx               # Entry point
└── index.css              # Global styles
```

## Key Files

### 1. API Client (`src/api/client.js`)
- Centralized Axios instance
- Request/response interceptors
- Error handling
- Token support (ready for auth)

### 2. Socket Setup (`src/utils/socket.js`)
- Singleton socket instance
- Auto-reconnection
- Event debugging

### 3. State Management (`src/store/index.js`)
- Consumer state (user, queue, position, status)
- Merchant state (for future merchant features)
- Loading & error states
- Real-time update triggers

### 4. Custom Hooks (`src/hooks/useQueue.js`)
- `useJoinQueue()` - Join queue operation
- `useLeaveQueue()` - Leave queue operation
- `useQueueStatus()` - Fetch queue status
- `useQueueUpdates()` - Listen to real-time updates

## Page Routes

| Route | Purpose |
|-------|---------|
| `/` | Home - Browse queues |
| `/join/:queueId` | Join Queue - Enter name |
| `/queue/:queueId/status` | Queue Status - Track position |

## API Endpoints Used

### Read [SETUP_AND_API_DOCUMENTATION.md](../SETUP_AND_API_DOCUMENTATION.md) for full details

**Consumer Endpoints:**
- `GET /queue/available` - Get available queues
- `POST /queue/join` - Join a queue
- `GET /queue/:queueId/status` - Check position
- `POST /queue/leave` - Leave queue

## Real-time Events

### Listen to (Consumer)
- `position_changed` - Your position updated
- `queue_advanced` - Someone was served
- `queue_updated` - General queue update
- `queue_cancelled` - Queue closed

### Emit (Consumer)
- `request_position` - Request position update
- `user_leaving` - Notify leaving

## Environment Setup

Create `.env` file in project root:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

Update `src/api/client.js` and `src/utils/socket.js` to use if needed.

## State Shape

```javascript
{
  // User
  user: { id: null, name: null, email: null },
  setUser: (user) => void,

  // Current Queue
  currentQueue: null,
  setCurrentQueue: (queue) => void,

  // Position in Queue
  position: null,
  setPosition: (position) => void,

  // Status
  status: null, // 'waiting' | 'served' | 'completed'
  setStatus: (status) => void,

  // UI
  loading: false,
  error: null,
  
  // Real-time
  queueUpdated: timestamp | null,
  positionChanged: position | null,
  queueAdvanced: user | null,
  
  // Utilities
  resetConsumerState: () => void,
  clearError: () => void,
  clearAll: () => void,
}
```

## Example Usage

### Joining a Queue

```javascript
import { useJoinQueue } from './hooks/useQueue';

function MyComponent() {
  const { joinQueue } = useJoinQueue();

  const handleJoin = async () => {
    try {
      await joinQueue('queue-123', 'John Doe');
      // User joined successfully
    } catch (error) {
      console.error('Failed to join:', error);
    }
  };

  return <button onClick={handleJoin}>Join</button>;
}
```

### Tracking Position

```javascript
import { useQueueUpdates } from './hooks/useQueue';
import { useStore } from './store/index';

function PositionTracker() {
  // Automatically sets up socket listeners
  useQueueUpdates();

  const { position } = useStore();

  return <div>Your Position: {position}</div>;
}
```

## Component Examples

### Home Page
Lists available queues and provides join buttons.

### Join Queue Page
Simple form to enter user name before joining queue.

### Queue Status Page
Shows:
- Current position (large, animated)
- Queue statistics
- Notifications when near turn
- Leave queue button

## Styling

- Mobile-first responsive design
- Smooth animations and transitions
- Gradient backgrounds
- Color-coded status badges
- Accessible form inputs

## Performance Considerations

1. **Socket events** are throttled to prevent excessive re-renders
2. **API calls** use proper error handling and timeout
3. **State updates** are minimal and targeted
4. **CSS** is modular to prevent bloat

## Debugging

### Browser DevTools

1. **Network tab**: Check API calls
2. **Console**: Watch for errors
3. **React DevTools**: Inspect state changes
4. **Coverage tab**: Check unused CSS/JS

### Socket.io Inspector

Check socket connection in browser console:
```javascript
// In browser console
console.log(socket.id); // Should show socket ID
socket.on('*', (event, data) => console.log(event, data)); // Log all events
```

## Common Issues

**Queue not updating:**
- Check if backend is running
- Verify Socket.io connection: `console.log(socket.connected)`
- Check browser console for errors

**API calls failing:**
- Verify backend URL in `api/client.js`
- Check CORS headers
- Look at backend logs

**Styling issues:**
- Clear browser cache
- Rebuild: `npm run build`
- Check CSS file imports

## Contributing

When adding features:
1. Create feature branch
2. Follow existing patterns
3. Test socket events
4. Test on mobile viewport
5. Update documentation

## Additional Resources

- [React Documentation](https://react.dev)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)
- [Axios Documentation](https://axios-http.com/docs/intro)

## License

MIT
