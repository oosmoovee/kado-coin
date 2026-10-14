import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

type BoundaryState = { hasError: boolean }

class ErrorBoundary extends React.Component<React.PropsWithChildren, BoundaryState> {
  state: BoundaryState = { hasError: false }

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Kado Clicker failed to render:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <main className="error-screen"><span>🐶</span><h1>Oops, Kado tripped over a tennis ball.</h1><p>The game hit an unexpected error. Your saved progress should still be safe.</p><button onClick={() => window.location.reload()}>Reload game</button></main>
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </React.StrictMode>,
)
