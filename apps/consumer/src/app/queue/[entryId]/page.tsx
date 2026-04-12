'use client';

import { useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueueStore } from '@/store/queue.store';
import { useAuthStore } from '@/store/auth.store';
import { joinOutletRoom, leaveOutletRoom, getSocket } from '@/lib/socket';
import { QueueUpdatePayload, TokenCalledPayload } from '@spotly/types';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Bell, Users } from 'lucide-react';
import Link from 'next/link';

export default function QueueTrackerPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { myEntry, entries, currentToken, leaveQueue, handleQueueUpdate, handleTokenCalled } =
    useQueueStore();

  // Fetch latest entry state on mount
  useEffect(() => {
    if (!entryId) return;
    (async () => {
      try {
        const res = await import('@/lib/api').then((m) =>
          m.default.get(`/queue/entry/${entryId}`),
        );
        useQueueStore.setState({ myEntry: res.data.data });
      } catch {
        router.push('/');
      }
    })();
  }, [entryId, router]);

  // Subscribe to the outlet's WebSocket room
  useEffect(() => {
    if (!myEntry) return;
    const { outletId } = myEntry;
    joinOutletRoom(outletId);

    const socket = getSocket();

    const onQueueUpdate = (payload: QueueUpdatePayload) => {
      handleQueueUpdate(payload);
    };

    const onTokenCalled = (payload: TokenCalledPayload) => {
      handleTokenCalled(payload.tokenNumber);
    };

    socket.on('queue_update', onQueueUpdate);
    socket.on('token_called', onTokenCalled);

    return () => {
      leaveOutletRoom(outletId);
      socket.off('queue_update', onQueueUpdate);
      socket.off('token_called', onTokenCalled);
    };
  }, [myEntry, handleQueueUpdate, handleTokenCalled]);

  const handleLeave = async () => {
    if (!myEntry) return;
    if (!confirm('Are you sure you want to leave the queue?')) return;
    await leaveQueue(myEntry.id);
    router.push('/');
  };

  if (!myEntry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent"
        />
      </div>
    );
  }

  const waitingAhead = entries.filter(
    (e) => e.status === 'WAITING' && e.tokenNumber < myEntry.tokenNumber,
  ).length;

  const statusConfig = {
    WAITING: { label: 'In Queue', color: 'text-yellow-400', bg: 'from-yellow-900/30 to-orange-900/20', icon: '⏳', glow: 'shadow-[0_0_60px_rgba(250,204,21,0.3)]' },
    CALLED: { label: 'Your Turn! 🎉', color: 'text-green-400', bg: 'from-green-900/40 to-emerald-900/30', icon: '🔔', glow: 'shadow-[0_0_80px_rgba(34,197,94,0.4)] animate-pulse' },
    SERVED: { label: 'Served ✓', color: 'text-blue-400', bg: 'from-blue-900/30 to-cyan-900/20', icon: '✓', glow: 'shadow-[0_0_40px_rgba(59,130,246,0.3)]' },
    MISSED: { label: 'Missed', color: 'text-red-400', bg: 'from-red-900/30 to-orange-900/20', icon: '✕', glow: 'shadow-[0_0_40px_rgba(239,68,68,0.3)]' },
  };

  const status = statusConfig[myEntry.status];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-brand-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back Home</span>
          </Link>
          <h1 className="text-lg font-bold text-gradient">Your Queue</h1>
          <div className="w-24" /> {/* Spacer */}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Token Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`card-glass bg-gradient-to-b ${status.bg} ${status.glow} text-center mb-8 p-12 rounded-3xl relative overflow-hidden`}
          >
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-brand opacity-5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10"
            >
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-semibold">Your Token Number</p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
                className={`text-9xl font-black text-white mb-6 font-mono`}
              >
                {myEntry.tokenNumber}
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`text-2xl font-bold ${status.color} mb-2`}
              >
                {status.label}
              </motion.p>
              {myEntry.status === 'CALLED' && (
                <motion.p
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="text-green-400 text-lg font-semibold"
                >
                  Please proceed to the counter now!
                </motion.p>
              )}
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          {myEntry.status === 'WAITING' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              <div className="card p-6 text-center">
                <p className="text-sm text-gray-400 mb-2 flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  People Ahead
                </p>
                <p className="text-4xl font-bold text-brand-400">{waitingAhead}</p>
                {waitingAhead === 0 && <p className="text-xs text-green-400 mt-2 font-semibold">You're next! 🎉</p>}
              </div>
              <div className="card p-6 text-center">
                <p className="text-sm text-gray-400 mb-2 flex items-center justify-center gap-2">
                  <Bell className="w-4 h-4" />
                  Current Token
                </p>
                <p className="text-4xl font-bold text-orange-400">{currentToken || '—'}</p>
                <p className="text-xs text-gray-500 mt-2 font-semibold">Calling now...</p>
              </div>
            </motion.div>
          )}

          {/* Called Notification */}
          {myEntry.status === 'CALLED' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="card border-2 border-green-500 bg-green-900/20 text-center mb-8 p-8 rounded-2xl"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h3 className="text-2xl font-bold text-green-300 mb-2">It's Your Turn!</h3>
              <p className="text-gray-300">Head to the counter immediately</p>
            </motion.div>
          )}

          {/* Live Queue List */}
          {entries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6 mb-8"
            >
              <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Live Queue Status
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {entries.slice(0, 10).map((e, index) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`flex items-center justify-between text-sm rounded-xl px-4 py-3 transition-all ${
                      e.id === myEntry.id
                        ? 'bg-gradient-brand text-black font-bold border-2 border-brand-500/50'
                        : e.status === 'CALLED'
                        ? 'bg-green-900/20 border border-green-500/50'
                        : e.status === 'SERVED'
                        ? 'bg-blue-900/20 border border-blue-500/30 opacity-75'
                        : 'bg-surface border border-border'
                    }`}
                  >
                    <span className="font-mono font-bold text-lg">#{e.tokenNumber.toString().padStart(3, '0')}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      e.status === 'WAITING' ? 'bg-yellow-500/20 text-yellow-400' :
                      e.status === 'CALLED' ? 'bg-green-500/20 text-green-400' :
                      e.status === 'SERVED' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {e.status}
                    </span>
                    {e.id === myEntry.id && <span className="text-xs font-bold">← You</span>}
                  </motion.div>
                ))}
                {entries.length > 10 && (
                  <p className="text-center text-xs text-gray-500 py-2">+{entries.length - 10} more in queue</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Leave Queue Button */}
          {(myEntry.status === 'WAITING' || myEntry.status === 'CALLED') && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              id="leave-queue-btn"
              onClick={handleLeave}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-red-900/20 border border-red-500/50 text-red-400 font-semibold hover:bg-red-900/40 hover:border-red-500/70 transition-all duration-300 active:scale-95"
            >
              <LogOut className="w-5 h-5" />
              Leave Queue
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

        {myEntry.status === 'SERVED' && (
          <a href="/" className="btn-primary w-full text-center block">
            Find another queue
          </a>
        )}
      </div>
    </div>
  );
}
