require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const outageRoutes = require('./routes/outages');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || 'uploads')));

app.use('/api/outages', outageRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`WaterWatch API running on port ${PORT}`));

module.exports = app;
