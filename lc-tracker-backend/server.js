require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const auth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const sessionRoutes = require('./routes/sessions');
const statsRouter = sessionRoutes.statsRouter;

const app = express();

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin.startsWith('chrome-extension://') || origin.includes('localhost')) {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
}));

app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use('/api', auth);
app.use('/api/sessions', sessionRoutes);
app.use('/api/stats', statsRouter);

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[LC Tracker] MongoDB connected');
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`[LC Tracker] Server on port ${port}`));
  })
  .catch(err => {
    console.error('[LC Tracker] MongoDB connection failed', err);
    process.exit(1);
  });
