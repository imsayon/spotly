"use client"

import React, { Component, ReactNode } from "react"

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 40, textAlign: 'center', background: '#050509', color: '#fff' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Something went wrong</h2>
            <button onClick={() => this.setState({ hasError: false })} style={{ padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
