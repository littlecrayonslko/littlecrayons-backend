import express from 'express';
import cors from 'cors';
import mainRouter from './route/route.js';

const app = express();

// Allowed Origins (Production domains + local dev)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://littlecrayons.org',
  'https://www.littlecrayons.org',
  'https://littlecrayons.in',
  'https://www.littlecrayons.in'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman, mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check if origin is explicitly in allowed list or is a Vercel preview domain
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app');

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// All API Routes
app.use('/api', mainRouter);

// 404 Route Catch-All
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

export default app;