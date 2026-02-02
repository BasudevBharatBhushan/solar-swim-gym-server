import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import routes from './routes';
import { setLocationContext } from './middlewares/setLocationContext';
import { optionalAuth } from './middlewares/auth';

const app: Application = express();

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Basic health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Apply optional authentication middleware (extracts JWT if present)
app.use('/api/v1', optionalAuth);

// Apply location context middleware (sets RLS session variable)
app.use('/api/v1', setLocationContext);

// API Routes
app.use('/api/v1', routes);


// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Solar Swim Gym Backend API v1',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message
  });
});

export default app;
