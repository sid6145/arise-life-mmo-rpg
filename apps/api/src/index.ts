import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.routes';
import questRoutes from './routes/quest.routes';
import goalRoutes from './routes/goal.routes';

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3005',
  process.env.CLIENT_ORIGIN,
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // default permissive for dev/staging, credentials supported
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'life-rpg-api',
  });
});

// App routes
app.use('/api/users', userRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/goals', goalRoutes);

app.listen(PORT, () => {
  console.log(`[api] Server running on http://localhost:${PORT}`);
});
