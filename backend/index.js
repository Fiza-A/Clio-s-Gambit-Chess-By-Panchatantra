import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { buildReport, getCollection, getDashboard, recordAction } from './data/database.js';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import coachRoutes from './routes/coachRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (_req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Chess by Panchatantra API</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #FAF7F0;
            color: #111827;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          main {
            max-width: 680px;
            padding: 32px;
            border: 1px solid rgba(169, 119, 33, .22);
            border-radius: 18px;
            background: #FFFDF8;
            box-shadow: 0 18px 42px rgba(17, 24, 39, .08);
          }
          h1 {
            margin: 0 0 12px;
            font-family: Georgia, Cambria, "Times New Roman", serif;
          }
          a {
            color: #A97721;
            font-weight: 800;
          }
          code {
            background: #FFF4D8;
            padding: 2px 6px;
            border-radius: 6px;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Chess by Panchatantra API</h1>
          <p>The backend is running. Open the Vite app on <a href="http://127.0.0.1:5174/student">http://127.0.0.1:5174/student</a>.</p>
          <p>API health: <code>/api/health</code></p>
        </main>
      </body>
    </html>
  `);
});

app.get('/api/:role/dashboard', (req, res) => {
  const dashboard = getDashboard(req.params.role);
  if (!dashboard) return res.status(404).json({ error: 'Unknown dashboard role' });
  return res.json(dashboard);
});

app.get('/api/:role/report', (req, res) => {
  const report = buildReport(req.params.role);
  if (!report.dashboard) return res.status(404).json({ error: 'Unknown dashboard role' });
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.role}-dashboard-report.json"`);
  return res.json(report);
});

app.get('/api/collections/:name', (req, res) => {
  res.json({ name: req.params.name, items: getCollection(req.params.name) });
});

app.post('/api/actions', (req, res) => {
  const entry = recordAction(req.body);
  res.status(201).json({ ok: true, message: `${entry.label || entry.action} completed`, entry });
});

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'chess-by-panchatantra' }));

app.listen(port, () => {
  console.log(`Chess by Panchatantra API running on http://localhost:${port}`);
});
