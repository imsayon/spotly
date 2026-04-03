/**
 * Consumer API Server Entry Point
 * Starts the Express + Socket.IO server
 */

import { httpServer } from './server';

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║         🎫 Spotly Consumer API Server                ║
║                                                       ║
║  Status: Running ✓                                   ║
║  Port: ${PORT}                                              ║
║  Socket.IO: Enabled ✓                               ║
║  WebSocket: ws://localhost:${PORT}                          ║
║  API: http://localhost:${PORT}/api/v1                      ║
║                                                       ║
║  Real-time Features:                                ║
║  • Queue position tracking                          ║
║  • Status notifications                             ║
║  • Automatic queue advancement                      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

export default httpServer;
