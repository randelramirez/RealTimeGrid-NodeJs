import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import path from 'path';

import { EmployeeSocketController } from './sockets/EmployeeSocketController.js';
import { employeesController } from './controllers/EmployeesController.js';
import employeesRouter from './routes/employees.js';
import { db } from './utils/Database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5047;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/employees', employeesRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new SocketServer(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Initialize Employee Hub
const employeeHub = new EmployeeSocketController(io);
employeesController.setEmployeeHub(employeeHub);

// Initialize database and start server
async function startServer() {
  try {
    console.log('🗄️  Initializing database...');
    await db.initializeDatabase();
    console.log('✅ Database initialized and seeded successfully');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO server ready for real-time connections`);
      console.log(`🎯 Accepting connections from: ${CLIENT_ORIGIN}`);
      console.log(`📊 API endpoints:`);
      console.log(`   - GET    /api/employees`);
      console.log(`   - GET    /api/employees/:id`);
      console.log(`   - POST   /api/employees`);
      console.log(`   - PUT    /api/employees/:id`);
      console.log(`   - DELETE /api/employees/:id`);
      console.log(`   - GET    /health`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
