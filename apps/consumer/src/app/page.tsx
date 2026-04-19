"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Ic, AuthModal, THEME, Orb } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const { user, signInWithGoogle, loading: authLoading } = useAuthStore()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    if (!authLoading && user) router.push('/home')
  }, [user, authLoading, router])

  if (!mounted) return (
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
      background: '#050509', 
      color: '#fff', 
      position: 'relative', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* BACKGROUND ELEMENTS */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <Orb x="-10%" y="-10%" size="80%" color="rgba(245,196,24,.07)" anim="orb1 20s infinite" />
        <Orb x="70%" y="20%" size="60%" color="rgba(255,99,22,.04)" anim="orb2 25s infinite" />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, transparent, #050509 95%)' }} />
      </div>

      {/* TOP NAV */}
      <nav style={{ 
        padding: '24px clamp(24px, 5vw, 64px)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: THEME.gradients.consumer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic.Zap />
          </div>
          <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: -1 }}>spotly.</span>
        </div>
        <button 
          onClick={() => window.open('http://localhost:3001', '_blank')}
          style={{ 
            background: 'rgba(255,255,255,.03)', 
            border: '1px solid rgba(255,255,255,.08)', 
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

      {/* MAIN CONTENT */}
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
            background: 'rgba(245,196,24,.05)', 
            border: '1px solid rgba(245,196,24,.15)',
            color: '#f5c418',
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 1.5
          }}>
            <Ic.Sparkle /> Skip lines near you
          </div>
        </motion.div>

        <motion.h2 variants={itemVars} style={{ 
          fontSize: 'clamp(48px, 9vw, 92px)', 
          fontWeight: 900, 
          lineHeight: 0.9, 
          letterSpacing: -4,
          marginBottom: 32,
          maxWidth: 900
        }}>
          Skip the line.<br/>
          <span style={{ background: THEME.gradients.consumer, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Reclaim your time.</span>
        </motion.h2>

        <motion.p variants={itemVars} style={{ 
          fontSize: 'clamp(17px, 2vw, 21px)', 
          color: 'rgba(255,255,255,.35)', 
          maxWidth: 640, 
          lineHeight: 1.6,
          marginBottom: 48,
          fontWeight: 500
        }}>
          Join any queue digitally. Track your status live. Arrive only when you’re next.
          The absolute finest way to wait.
        </motion.p>

        <motion.div variants={itemVars}>
          <motion.button 
            whileHover={{ scale: 1.05, y: -4, boxShadow: '0 25px 50px rgba(245,196,24,.25)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAuthModalOpen(true)}
            style={{ 
              background: THEME.gradients.consumer, 
              color: '#000', 
              padding: '20px 56px', 
              borderRadius: 20, 
              fontSize: 18, 
              fontWeight: 900, 
              border: 'none', 
              cursor: 'pointer',
              boxShadow: '0 15px 35px rgba(245,196,24,.2)',
            }}
          >
            Start Discovering
          </motion.button>
        </motion.div>
      </motion.main>

      {/* FOOTER STATS */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        style={{ 
          padding: '40px', 
          borderTop: '1px solid rgba(255,255,255,.05)',
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(24px, 8vw, 96px)',
          background: 'rgba(255,255,255,.01)'
        }}
      >
        {[
          { label: 'Time Saved', val: '12k hrs+' },
          { label: 'Live Spots', val: '200+' },
          { label: 'Partner Outlets', val: '85' }
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 2 }}>{s.val}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.2)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onGoogleAuth={signInWithGoogle}
        isLoading={authLoading}
        title="Elevate your experience"
        variant="consumer"
      />
    </div>
  )
}
