import app from './app';
import { config } from './config';
import prisma from './utils/db';
import schedulerService from './services/scheduler.service';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    // Initialize scheduler for scheduled publishing and cleanup tasks
    schedulerService.init();

    // Start server
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Health check: http://localhost:${config.port}/api/health`);
      console.log(`API Documentation: http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  schedulerService.stopAll();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  schedulerService.stopAll();
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
