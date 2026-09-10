"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Ic, AuthModal } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import { useRouter } from "next/navigation"
import { env } from "@/lib/env"

export default function MerchantLandingPage() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, loading: authLoading } = useAuthStore()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    if (!authLoading && user) router.push('/dashboard')
  }, [user, authLoading, router])

  if (!mounted) return (
    <div style={{ height: '100vh', background: '#0b0d10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      background: '#0b0d10',
      color: '#fff', 
      position: 'relative', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
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
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#1fd97c', color: '#07160f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic.Zap />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -1 }}>spotly.</div>
            <div style={{ fontSize: 9, color: '#1fd97c', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>Business</div>
          </div>
        </div>
        <button 
          onClick={() => {
            const consumerUrl = env.NEXT_PUBLIC_CONSUMER_URL;
            window.open(consumerUrl, '_blank');
          }}
          style={{ 
            background: 'transparent',
            border: '1px solid rgba(255,255,255,.2)',
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
            background: 'transparent',
            border: '1px solid rgba(31,217,124,.45)',
            color: '#1fd97c',
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 2
          }}>
            <Ic.Activity /> For walk-in businesses
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
          Manage your queue.<br/>
          <span style={{ color: '#1fd97c' }}>Keep customers moving.</span>
        </motion.h2>

        <motion.p variants={itemVars} style={{ 
          fontSize: 'clamp(18px, 1.8vw, 22px)', 
          color: 'rgba(255,255,255,0.4)', 
          maxWidth: 680, 
          lineHeight: 1.6,
          marginBottom: 56,
          fontWeight: 500
        }}>
          See who is waiting, call the next customer, and keep the room moving without guesswork.
        </motion.p>

        <motion.div variants={itemVars}>
          <motion.button 
            whileHover={{ y: -2, backgroundColor: '#42e790' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAuthModalOpen(true)}
            style={{ 
              background: '#1fd97c',
              color: '#07160f',
              padding: '16px 28px',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 800,
              border: 'none', 
              cursor: 'pointer',
              boxShadow: 'none',
            }}
          >
            Launch Dashboard
          </motion.button>
        </motion.div>
      </motion.main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onGoogleAuth={signInWithGoogle}
        onEmailAuth={async (email, password, mode, name) => {
          if (mode === 'sign-up') {
            if (!await signUpWithEmail(email, password, name)) return 'Check your email to confirm your account, then sign in.'
          }
          else await signInWithEmail(email, password)
        }}
        isLoading={authLoading}
        title="Welcome, Partner"
        variant="merchant"
      />
    </div>
  )
}
