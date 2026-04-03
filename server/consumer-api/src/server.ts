/**
 * Main Express server with Socket.IO integration
 * Handles all queue operations and real-time updates
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { db } from './db';
import type { ApiResponse, QueueEntry, Merchant, QueueState } from './types';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST'],
  },
});

// ============= MIDDLEWARE =============

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
    },
  });
});

// ============= SOCKET.IO SETUP =============

const merchantRooms = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join merchant room
  socket.on('joinRoom', (merchantId: string) => {
    socket.join(`merchant-${merchantId}`);
    if (!merchantRooms.has(merchantId)) {
      merchantRooms.set(merchantId, new Set());
    }
    merchantRooms.get(merchantId)!.add(socket.id);
    console.log(
      `[Socket] ${socket.id} joined room: merchant-${merchantId}`
    );
  });

  // Leave merchant room
  socket.on('leaveRoom', (merchantId: string) => {
    socket.leave(`merchant-${merchantId}`);
    const room = merchantRooms.get(merchantId);
    if (room) {
      room.delete(socket.id);
    }
    console.log(
      `[Socket] ${socket.id} left room: merchant-${merchantId}`
    );
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

/**
 * Emit queue update to all clients in merchant room
 */
function emitQueueUpdate(merchantId: string, data: any): void {
  io.to(`merchant-${merchantId}`).emit('queue_updated', {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit position changed
 */
function emitPositionChanged(merchantId: string, data: any): void {
  io.to(`merchant-${merchantId}`).emit('position_changed', {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit queue called
 */
function emitQueueCalled(merchantId: string, entry: QueueEntry): void {
  io.to(`merchant-${merchantId}`).emit('queue_called', {
    tokenNumber: entry.tokenNumber,
    entryId: entry.id,
    timestamp: new Date().toISOString(),
  });
  console.log(
    `[Socket] Emitted queue_called for token #${entry.tokenNumber} at ${merchantId}`
  );
}

/**
 * Emit queue advanced
 */
function emitQueueAdvanced(merchantId: string): void {
  const queueState = db.getQueueState(merchantId);
  if (queueState) {
    io.to(`merchant-${merchantId}`).emit('queue_advanced', {
      currentToken: queueState.currentToken,
      nextToken: queueState.nextToken,
      totalWaiting: queueState.totalWaiting,
      timestamp: new Date().toISOString(),
    });
    console.log(`[Socket] Emitted queue_advanced at ${merchantId}`);
  }
}

// ============= ROUTES =============

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/merchants
 * List all merchants
 */
app.get('/api/v1/merchants', (req: Request, res: Response) => {
  try {
    const merchants = db.getMerchants();
    const withQueueState = merchants.map((merchant) => ({
      ...merchant,
      queueState: db.getQueueState(merchant.id),
    }));

    res.json({
      success: true,
      data: withQueueState,
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch merchants',
      },
    });
  }
});

/**
 * GET /api/v1/merchants/:id
 * Get single merchant
 */
app.get('/api/v1/merchants/:id', (req: Request, res: Response) => {
  try {
    const merchant = db.getMerchant(req.params.id);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Merchant not found' },
      });
    }

    res.json({
      success: true,
      data: {
        ...merchant,
        queueState: db.getQueueState(merchant.id),
      },
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch merchant',
      },
    });
  }
});

/**
 * POST /api/v1/merchants/:merchantId/queue
 * Join queue
 */
app.post('/api/v1/merchants/:merchantId/queue', (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { message: 'userId is required' },
      });
    }

    const merchant = db.getMerchant(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Merchant not found' },
      });
    }

    const entry = db.joinQueue(merchantId, userId);

    // Emit to all subscribers
    emitQueueUpdate(merchantId, {
      event: 'joined',
      tokenNumber: entry.tokenNumber,
      position: entry.position,
      totalWaiting: db.getQueueState(merchantId)?.totalWaiting,
    });

    res.status(201).json({
      success: true,
      data: entry,
    } as ApiResponse<QueueEntry>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to join queue',
      },
    });
  }
});

/**
 * GET /api/v1/queue/:entryId
 * Get queue entry status
 */
app.get('/api/v1/queue/:entryId', (req: Request, res: Response) => {
  try {
    const entry = db.getQueueEntry(req.params.entryId);
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: { message: 'Queue entry not found' },
      });
    }

    res.json({
      success: true,
      data: entry,
    } as ApiResponse<QueueEntry>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get queue status',
      },
    });
  }
});

/**
 * POST /api/v1/queue/:entryId/arrived
 * Mark user as arrived and confirm service
 */
app.post('/api/v1/queue/:entryId/arrived', (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const { otp } = req.body;

    const entry = db.getQueueEntry(entryId);
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: { message: 'Queue entry not found' },
      });
    }

    if (entry.status !== 'CALLED') {
      return res.status(400).json({
        success: false,
        error: { message: 'Can only mark arrived when called' },
      });
    }

    // TODO: Validate OTP in production
    // For MVP, just mark as served
    const updated = db.markAsServed(entryId);

    emitQueueUpdate(entry.merchantId, {
      event: 'served',
      tokenNumber: entry.tokenNumber,
      status: 'SERVED',
    });

    // Call next customer automatically
    const next = db.callNextCustomer(entry.merchantId);
    if (next) {
      emitQueueCalled(entry.merchantId, next);
      emitQueueAdvanced(entry.merchantId);
    }

    res.json({
      success: true,
      data: updated,
    } as ApiResponse<QueueEntry>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to mark as arrived',
      },
    });
  }
});

/**
 * DELETE /api/v1/queue/:entryId
 * Leave queue
 */
app.delete('/api/v1/queue/:entryId', (req: Request, res: Response) => {
  try {
    const entry = db.getQueueEntry(req.params.entryId);
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: { message: 'Queue entry not found' },
      });
    }

    db.leaveQueue(req.params.entryId);

    emitQueueUpdate(entry.merchantId, {
      event: 'cancelled',
      tokenNumber: entry.tokenNumber,
      totalWaiting: db.getQueueState(entry.merchantId)?.totalWaiting,
    });

    res.json({
      success: true,
      message: 'Successfully left queue',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to leave queue',
      },
    });
  }
});

/**
 * POST /api/v1/merchants/:merchantId/queue/call-next (Admin only)
 * Call next customer (for demo/admin purposes)
 */
app.post('/api/v1/merchants/:merchantId/queue/call-next', (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const merchant = db.getMerchant(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Merchant not found' },
      });
    }

    const entry = db.callNextCustomer(merchantId);
    if (!entry) {
      return res.status(400).json({
        success: false,
        error: { message: 'No one in queue' },
      });
    }

    emitQueueCalled(merchantId, entry);
    emitQueueAdvanced(merchantId);

    res.json({
      success: true,
      data: entry,
    } as ApiResponse<QueueEntry>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to call next',
      },
    });
  }
});

/**
 * POST /api/v1/merchants/:merchantId/queue/advance (Admin only)
 * Manually advance queue for testing
 */
app.post('/api/v1/merchants/:merchantId/queue/advance', (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const merchant = db.getMerchant(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Merchant not found' },
      });
    }

    db.advanceQueue(merchantId);
    const queueState = db.getQueueState(merchantId);

    emitQueueAdvanced(merchantId);

    res.json({
      success: true,
      data: queueState,
    } as ApiResponse<QueueState>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to advance queue',
      },
    });
  }
});

/**
 * GET /api/v1/merchants/:merchantId/queue-state
 * Get current queue state
 */
app.get('/api/v1/merchants/:merchantId/queue-state', (req: Request, res: Response) => {
  try {
    const queueState = db.getQueueState(req.params.merchantId);
    if (!queueState) {
      return res.status(404).json({
        success: false,
        error: { message: 'Queue state not found' },
      });
    }

    res.json({
      success: true,
      data: queueState,
    } as ApiResponse<QueueState>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get queue state',
      },
    });
  }
});

// ============= USER ENDPOINTS =============

/**
 * POST /api/v1/users
 * Register or upsert user
 */
app.post('/api/v1/users', (req: Request, res: Response) => {
  try {
    const { userId, name, phone } = req.body;

    if (!userId || !name || !phone) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'userId, name, and phone are required',
        },
      });
    }

    const user = db.upsertUser(userId, name, phone);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to register user',
      },
    });
  }
});

/**
 * GET /api/v1/users/me
 * Get current user (simplified - would use auth in production)
 */
app.get('/api/v1/users/me', (req: Request, res: Response) => {
  try {
    // In production, this would use session/JWT
    // For MVP, return a mock user
    const mockUser = {
      id: 'mockuser',
      name: 'Guest User',
      phone: '+1234567890',
      createdAt: new Date(),
    };

    res.json({
      success: true,
      data: mockUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get profile',
      },
    });
  }
});

/**
 * PATCH /api/v1/users/me
 * Update user profile
 */
app.patch('/api/v1/users/me', (req: Request, res: Response) => {
  try {
    const { userId, ...updates } = req.body;

    // For MVP, just return the updated user
    const updatedUser = {
      id: userId || 'mockuser',
      name: updates.name || 'Guest User',
      phone: updates.phone || '+1234567890',
      createdAt: new Date(),
    };

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update profile',
      },
    });
  }
});

// ============= EXPORTS =============

export { app, httpServer, io };
