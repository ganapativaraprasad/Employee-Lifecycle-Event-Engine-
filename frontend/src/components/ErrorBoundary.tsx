import React from 'react'

type State = {
  hasError: boolean
  error?: any
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="max-w-2xl w-full bg-white rounded-2xl p-6 border border-red-200">
            <h2 className="text-xl font-semibold text-red-700">An error occurred</h2>
            <pre className="mt-4 text-sm text-red-600 whitespace-pre-wrap">{String(this.state.error)}</pre>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Open the browser console for full details.</p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
