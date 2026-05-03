"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Ic, AuthModal, THEME, Orb } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import { useRouter } from "next/navigation"

export default function MerchantLandingPage() {
  const { user, signInWithGoogle, loading: authLoading } = useAuthStore()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    if (!authLoading && user) router.push('/dashboard')
  }, [user, authLoading, router])

  if (!mounted) return (
    <div style={{ height: '100vh', background: '#050509', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,.05)', borderTopColor: '#1fd97c', borderRadius: '50%' }} 
      />
    </div>
  )

  const containerVars = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as any } }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#040407', 
      color: '#fff', 
      position: 'relative', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* AMBIENCE */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <Orb x="-15%" y="-15%" size="85%" color="rgba(31,217,124,.07)" anim="orb1 22s infinite" />
        <Orb x="75%" y="25%" size="65%" color="rgba(0,207,255,.05)" anim="orb2 28s infinite" />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, transparent, #040407 98%)' }} />
      </div>

      {/* NAV */}
      <nav style={{ 
        padding: '24px clamp(24px, 5vw, 64px)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: THEME.gradients.merchant, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic.Zap />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -1 }}>spotly.</div>
            <div style={{ fontSize: 9, color: '#1fd97c', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>Business</div>
          </div>
        </div>
        <button 
          onClick={() => {
            const consumerUrl = process.env.NEXT_PUBLIC_CONSUMER_URL || 'http://localhost:3000';
            window.open(consumerUrl, '_blank');
          }}
          style={{ 
            background: 'rgba(255,255,255,.03)', 
            border: '1px solid rgba(255,255,255,.08)', 
            padding: '10px 22px', 
            borderRadius: 12, 
            color: 'rgba(255,255,255,.5)', 
            fontSize: 14, 
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Consumer View
        </button>
      </nav>

      {/* HERO */}
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
        <motion.div variants={itemVars} style={{ marginBottom: 28 }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 10, 
            padding: '8px 20px', 
            borderRadius: 99, 
            background: 'rgba(31,217,124,.06)', 
            border: '1px solid rgba(31,217,124,.15)',
            color: '#1fd97c',
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 2
          }}>
            <Ic.Activity /> Professional Queue Intelligence
          </div>
        </motion.div>

        <motion.h2 variants={itemVars} style={{ 
          fontSize: 'clamp(44px, 8vw, 84px)', 
          fontWeight: 900, 
          lineHeight: 1.05, 
          letterSpacing: -3,
          marginBottom: 32,
          maxWidth: 960
        }}>
          Manage your queue.<br/>
          <span style={{ background: THEME.gradients.merchant, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Master your efficiency.</span>
        </motion.h2>

        <motion.p variants={itemVars} style={{ 
          fontSize: 'clamp(18px, 1.8vw, 22px)', 
          color: 'rgba(255,255,255,0.4)', 
          maxWidth: 680, 
          lineHeight: 1.6,
          marginBottom: 56,
          fontWeight: 500
        }}>
          The industry leading platform for walk-in management. Eliminate overhead, 
          reduce physical crowds, and delight your customers with precision timing.
        </motion.p>

        <motion.div variants={itemVars}>
          <motion.button 
            whileHover={{ scale: 1.05, y: -4, boxShadow: '0 25px 50px rgba(31,217,124,.25)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAuthModalOpen(true)}
            style={{ 
              background: THEME.gradients.merchant, 
              color: '#fff', 
              padding: '20px 64px', 
              borderRadius: 20, 
              fontSize: 18, 
              fontWeight: 900, 
              border: 'none', 
              cursor: 'pointer',
              boxShadow: '0 15px 35px rgba(31,217,124,.2)',
            }}
          >
            Launch Dashboard
          </motion.button>
        </motion.div>
      </motion.main>

      {/* TRUST SECTION */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        style={{ 
          padding: '48px', 
          borderTop: '1px solid rgba(255,255,255,.04)',
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(32px, 8vw, 120px)',
          background: 'rgba(255,255,255,0.01)'
        }}
      >
        {[
          { label: 'Throughput Boost', val: '+34%' },
          { label: 'Wait Accuracy', val: '99.2%' },
          { label: 'Active Outlets', val: '2.5k+' }
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 2 }}>{s.val}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.2)', textTransform: 'uppercase', letterSpacing: 2 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onGoogleAuth={signInWithGoogle}
        isLoading={authLoading}
        title="Welcome, Partner"
        variant="merchant"
      />
    </div>
  )
}
