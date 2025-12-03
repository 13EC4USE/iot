"use client"

import React, { type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: (error: Error) => ReactNode
}

interface State {
  error: Error | null
  hasError: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null, hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error, hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback?.(this.state.error) || (
          <div className="p-4 bg-red-500/10 border border-red-500 rounded text-red-400">
            <h2 className="font-bold">เกิดข้อผิดพลาด</h2>
            <p className="text-sm">{this.state.error.message}</p>
          </div>
        )
      )
    }

    return this.props.children
  }
}
