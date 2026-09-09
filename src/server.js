import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';           // <-- Must have .js
import { pool } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const [result] = await pool.query('SELECT 1 + 1 AS health');
    if (result && result[0].health === 2) {
      console.log('✅ Connected to MySQL database successfully.');
    }

    // 2. Start HTTP listener
    const server = app.listen(PORT, () => {
      console.log(`🚀 Little Crayons Server is running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`🖼️  Gallery API:  http://localhost:${PORT}/api/gallery`);
    });

    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('🔒 HTTP server closed.');
        try {
          await pool.end();
          console.log('📦 Database connection pool closed.');
          process.exit(0);
        } catch (err) {
          console.error('❌ Error during DB pool shutdown:', err.message);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Server failed to start due to database error:');
    console.error(error.message);
    process.exit(1);
  }
}

startServer();