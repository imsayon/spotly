'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Merchant, Outlet } from '@spotly/types';
import { useAuthStore } from '@/store/auth.store';
import { useQueueStore } from '@/store/queue.store';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Users, ArrowRight, Loader } from 'lucide-react';
import Link from 'next/link';

export default function MerchantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, signInWithGoogle } = useAuthStore();
  const { joinQueue } = useQueueStore();

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [joiningOutlet, setJoiningOutlet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/merchant/${id}`),
      api.get(`/outlet/merchant/${id}`),
    ]).then(([merchantRes, outletsRes]) => {
      setMerchant(merchantRes.data.data);
      setOutlets(outletsRes.data.data ?? []);
      setLoading(false);
    });
  }, [id]);

  const handleJoin = async (outletId: string) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    setJoiningOutlet(outletId);
    try {
      const entry = await joinQueue(outletId);
      router.push(`/queue/${entry.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to join queue');
    } finally {
      setJoiningOutlet(null);
    }
  };

  if (loading) {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-brand-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Merchants</span>
          </Link>
          <h1 className="text-lg font-bold text-gradient hidden md:block">{merchant?.name}</h1>
          <div className="w-12" /> {/* Spacer for centering */}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Merchant Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="relative overflow-hidden rounded-3xl mb-8">
            {/* Background gradient banner */}
            <div className="h-48 bg-gradient-brand relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-[100px]" />
              </div>
              <div className="text-8xl relative z-10">🏪</div>
            </div>
          </div>

          <div className="card p-8">
            <h1 className="text-4xl font-bold text-white mb-2">{merchant?.name}</h1>
            <div className="flex items-center gap-2 text-brand-400 font-semibold text-lg mb-6">
              <span className="px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30">
                {merchant?.category}
              </span>
            </div>
            <p className="text-gray-400 max-w-2xl">
              Join one of our outlets and get real-time updates on your token. Experience seamless queue management.
            </p>
          </div>
        </motion.div>

        {/* Outlets Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Users className="w-5 h-5 text-black" />
            </div>
            Select an Outlet
          </h2>

          {outlets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card text-center py-16"
            >
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-400 text-lg font-medium">No outlets available yet</p>
              <p className="text-gray-500 text-sm mt-2">Please check back later</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {outlets.map((outlet, index) => (
                <motion.div
                  key={outlet.id}
                  id={`outlet-${outlet.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="group"
                >
                  <div className="card p-6 flex items-start justify-between cursor-pointer relative overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-brand opacity-0 group-hover:opacity-5 rounded-full blur-3xl transition-opacity duration-300" />

                    <div className="relative z-10 flex-1">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gradient transition-all">
                        {outlet.name}
                      </h3>
                      {outlet.address && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{outlet.address}</span>
                        </div>
                      )}
                    </div>

                    <button
                      id={`join-btn-${outlet.id}`}
                      onClick={() => handleJoin(outlet.id)}
                      disabled={joiningOutlet === outlet.id}
                      className="relative z-10 ml-4 btn-primary whitespace-nowrap disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {joiningOutlet === outlet.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin mr-2" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <span>Join Queue</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-4">
              <span className="text-xl">⚡</span>
            </div>
            <h4 className="font-semibold text-white mb-2">Instant Join</h4>
            <p className="text-sm text-gray-400">Join any outlet with just one tap</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4">
              <span className="text-xl">📲</span>
            </div>
            <h4 className="font-semibold text-white mb-2">Live Updates</h4>
            <p className="text-sm text-gray-400">Real-time notifications for your token</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-4">
              <span className="text-xl">🎯</span>
            </div>
            <h4 className="font-semibold text-white mb-2">No Waiting Area</h4>
            <p className="text-sm text-gray-400">Come when it&apos;s your turn</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
                  onClick={() => handleJoin(outlet.id)}
                  disabled={joiningOutlet === outlet.id}
                  className="btn-primary ml-4 shrink-0"
                >
                  {joiningOutlet === outlet.id ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Joining...
                    </span>
                  ) : !user ? (
                    'Sign in to join'
                  ) : (
                    'Join Queue'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
