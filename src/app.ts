import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';
import indexRoutes from './routes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(config.upload.uploadDir));

// Routes
app.use('/api', indexRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
