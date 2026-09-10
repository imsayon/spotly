"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Ic } from "@spotly/ui"
import { ConsumerAuthModal } from "@/components/ConsumerAuthModal"
import { useAuthStore } from "@/store/auth.store"
import { env } from "@/lib/env"

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuthStore()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading && user) {
      router.replace("/home")
    }
  }, [loading, mounted, router, user])

  if (!mounted || loading) return (
    <div style={{ height: '100vh', background: '#050509', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '2px solid rgba(255,255,255,.05)', borderTopColor: '#f5c418', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any } }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0d10',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <nav style={{
        padding: '24px clamp(24px, 5vw, 64px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f5c418', color: '#17130a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic.Zap />
          </div>
          <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: -1 }}>spotly.</span>
        </div>
        <button
          onClick={() => {
            const merchantUrl = env.NEXT_PUBLIC_MERCHANT_URL;
            window.open(merchantUrl, '_blank');
          }}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,.2)',
            padding: '10px 20px',
            borderRadius: 12,
            color: 'rgba(255,255,255,.6)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          For Partners
        </button>
      </nav>

      <motion.main
        variants={containerVars}
        initial="hidden"
        animate="visible"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}
      >
        <motion.div variants={itemVars} style={{ marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 99,
            background: 'transparent',
            border: '1px solid rgba(245,196,24,.45)',
            color: '#f5c418',
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 1.5
          }}>
            <Ic.Sparkle /> Nearby queues
          </div>
        </motion.div>

        <motion.h2 variants={itemVars} style={{
          fontSize: 'clamp(42px, 7vw, 76px)',
          fontWeight: 800,
          lineHeight: 1.02,
          letterSpacing: -2.5,
          marginBottom: 24,
          maxWidth: 820
        }}>
          Skip the line.<br />
          <span style={{ color: '#f5c418' }}>Reclaim your time.</span>
        </motion.h2>

        <motion.p variants={itemVars} style={{
          fontSize: 'clamp(17px, 2vw, 21px)',
          color: 'rgba(255,255,255,.35)',
          maxWidth: 640,
          lineHeight: 1.6,
          marginBottom: 48,
          fontWeight: 500
        }}>
          Find a nearby business, join its queue, and get on with your day until it’s your turn.
        </motion.p>

        <motion.div variants={itemVars}>
          <motion.button
            whileHover={{ y: -2, backgroundColor: '#ffd83d' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAuthModalOpen(true)}
            style={{
              background: '#f5c418',
              color: '#000',
              padding: '16px 28px',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              boxShadow: 'none',
            }}
          >
            Start Discovering
          </motion.button>
        </motion.div>
      </motion.main>

      <ConsumerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Elevate your experience"
      />
    </div>
  )
}
