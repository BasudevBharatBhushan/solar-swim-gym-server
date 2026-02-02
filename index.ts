import dotenv from 'dotenv';
import app from './src/app';
import { checkConnection } from './src/config/db';

dotenv.config();

const port = process.env.PORT || 3000;

const server = app.listen(port, async () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`📍 API base: http://localhost:${port}/api/v1`);
  
  await checkConnection();
});

// Prevent process exit (debugging)
setInterval(() => {}, 10000);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Keep the process alive
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});
