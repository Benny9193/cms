import express, { Application } from 'express';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { swaggerSpec } from './config/swagger';
import indexRoutes from './routes';

const app: Application = express();

// Initialize Sentry for error tracking (if SENTRY_DSN is set)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: config.nodeEnv,
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,
  });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  console.log('Sentry error tracking enabled');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve uploaded files statically
app.use('/uploads', express.static(config.upload.uploadDir));

// Routes
app.use('/api', indexRoutes);

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
