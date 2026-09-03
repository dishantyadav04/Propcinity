import { setMaxListeners } from 'node:events'

// Prevent EPIPE crashes when the terminal/IDE disconnects from stdout/stderr
// mid-session (common on Windows) — without this, an unhandled EPIPE write
// error takes down the entire dev server.
function guardAgainstEpipe(stream: NodeJS.WriteStream) {
  stream.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EPIPE') return
    throw err
  })
}
guardAgainstEpipe(process.stdout)
guardAgainstEpipe(process.stderr)

// Raise the events listener cap defensively to avoid
// spurious MaxListenersExceededWarning (Serwist + Sentry add
// close listeners to ServerResponse objects).
try {
  setMaxListeners(20)
} catch (e) {
  // swallow — defensive only
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
