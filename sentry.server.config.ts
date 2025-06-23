import * as Sentry from '@sentry/nuxt'

Sentry.init({
  dsn: 'https://b48b60dc267751b697fba8c5d42f1ea8@o4509546408509440.ingest.us.sentry.io/4509546410016768',

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
})
