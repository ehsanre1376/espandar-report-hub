import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import authRoutes from './routes/auth';
import ntlmAuthRoutes from './routes/auth.ntlm';
import captchaRoutes from './routes/captcha';
import reportsRoutes from './routes/reports';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3051;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow requests from localhost on any port (for development)
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Allow requests from the configured frontend URL
    if (origin === FRONTEND_URL) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all origins in development
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'WWW-Authenticate', 'X-Requested-With'],
  exposedHeaders: ['WWW-Authenticate'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for captcha
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key', // It's recommended to use an environment variable
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' } // Use secure cookies in production
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      port: PORT,
      frontendUrl: FRONTEND_URL,
      ldapConfigured: true, // Configured in ldap.config.ts (defaults to DC0.espandarco.com)
    },
  });
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', captchaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', ntlmAuthRoutes); // Add NTLM authentication routes
app.use('/api/reports', reportsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 Espandar Authentication API');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`📋 LDAP URL: ${process.env.LDAP_URL || 'Not configured'}`);
  console.log(`📋 LDAP Base DN: ${process.env.LDAP_BASE_DN || 'Not configured'}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ Ready to accept authentication requests!');
  console.log('✅ NTLM authentication enabled');
  console.log('═══════════════════════════════════════════════════');
});


// Log all environment variables for debugging purposes
console.log('--- Environment Variables ---');
console.log(process.env);
console.log('---------------------------');

