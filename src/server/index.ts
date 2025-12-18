import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { chatRoute } from './routes/chat';
import { promptsRoute } from './routes/prompts';
import { modelsRoute } from './routes/models';
import { providersRoute } from './routes/providers';
import { themeRoute } from './routes/theme';
import { runStartupChecks, printStartupReport } from './lib/startup';

// Run startup checks
const { canStart, checks } = runStartupChecks();
printStartupReport(checks, canStart);

if (!canStart) {
  process.exit(1);
}

const app = new Hono();

// Enable CORS for development
app.use('/api/*', cors());

// API routes
app.route('/api/chat', chatRoute);
app.route('/api/prompts', promptsRoute);
app.route('/api/models', modelsRoute);
app.route('/api/providers', providersRoute);
app.route('/api/theme', themeRoute);

// Serve static files from client build
app.use('/*', serveStatic({ root: './dist/client' }));

// Fallback to index.html for SPA routing
app.get('*', serveStatic({ path: './dist/client/index.html' }));

const port = Number(process.env.PORT) || 3000;

try {
  Bun.serve({
    port,
    fetch: app.fetch,
  });
  console.log(`Server running at http://localhost:${port}`);
} catch (error) {
  if (error instanceof Error && error.message.includes('address already in use')) {
    console.error(`\n❌ Port ${port} is already in use.\n`);
    console.error(`   To fix this, you can either:`);
    console.error(`   1. Stop the process using port ${port}`);
    console.error(`   2. Use a different port: PORT=3001 bun run dev\n`);
    process.exit(1);
  }
  throw error;
}

export { app };
