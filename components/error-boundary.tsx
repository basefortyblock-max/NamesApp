"use client"

import React from "react"
import { AlertCircle } from "lucide-react"

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}