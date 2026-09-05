import cors from 'cors';
import express from 'express';
import { streamRouter } from './routes/stream.js';

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: ALLOWED_ORIGINS }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/stream', streamRouter);

app.listen(PORT, () => {
  console.log(`Servidor de streaming escuchando en el puerto ${PORT}`);
});
