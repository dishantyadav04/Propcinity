// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const configuredProductionTraceSampleRate = Number.parseFloat(
  process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.15"
);
const productionTraceSampleRate = Number.isFinite(configuredProductionTraceSampleRate)
  ? configuredProductionTraceSampleRate
  : 0.15;

Sentry.init({
  dsn: "https://cbf495551b261dd7a0f809052a464920@o4511584789921792.ingest.us.sentry.io/4511584914374656",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Known non-actionable noise from third-party in-app browsers (Facebook/Instagram,
  // and similar embedded WebViews) whose own JS bridges fail independently of our code.
  ignoreErrors: [
    "Error invoking postMessage: Java object is gone",
    /Java object is gone/i,
    /JavaScript interface object.*collected/i,
  ],

  // Keep local traces complete while avoiding 100% production tracing on mobile clients.
  tracesSampleRate: process.env.NODE_ENV === "production" ? productionTraceSampleRate : 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
