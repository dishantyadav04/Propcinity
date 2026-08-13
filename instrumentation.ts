import { setMaxListeners } from 'node:events'

// Raise the events listener cap defensively in development to avoid
// spurious MaxListenersExceededWarning during Fast Refresh cycles.
if (process.env.NODE_ENV === 'development') {
  try {
    setMaxListeners(20)
  } catch (e) {
    // swallow — defensive only
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
