const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../middleware/auth');

/* GET /api/water-quality */
router.get('/', async (req, res) => {
  const { province, municipality, status, limit = 50, offset = 0 } = req.query;
  const conditions = [];
  const params     = [];

  if (province)     { params.push(province);     conditions.push(`province = $${params.length}`); }
  if (municipality) { params.push(municipality); conditions.push(`municipality = $${params.length}`); }
  if (status)       { params.push(status);       conditions.push(`status = $${params.length}`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  params.push(Math.min(parseInt(limit) || 50, 200));
  params.push(parseInt(offset) || 0);

  try {
    const { rows } = await db.query(
      `SELECT * FROM water_quality ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ records: rows });
  } catch (err) {
    console.error('list water quality error:', err);
    res.status(500).json({ message: 'Could not fetch water quality data.' });
  }
});

/* GET /api/water-quality/latest — one record per (province, municipality) */
router.get('/latest', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT ON (province, municipality)
        id, province, municipality, suburb, status, ph, turbidity, chlorine, notes, created_at
      FROM water_quality
      ORDER BY province, municipality, created_at DESC
    `);
    res.json({ records: rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch latest water quality.' });
  }
});

/* POST /api/water-quality */
router.post('/', requireAuth, async (req, res) => {
  const { province, municipality, suburb, status, ph, turbidity, chlorine, notes } = req.body;

  if (!status) return res.status(400).json({ message: 'status is required.' });

  try {
    const { rows } = await db.query(
      `INSERT INTO water_quality
         (reported_by, province, municipality, suburb, status, ph, turbidity, chlorine, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.user.id,
        province || null, municipality || null, suburb || null,
        status,
        ph        ? parseFloat(ph)        : null,
        turbidity ? parseFloat(turbidity) : null,
        chlorine  ? parseFloat(chlorine)  : null,
        notes     || null,
      ]
    );
    res.status(201).json({ record: rows[0] });
  } catch (err) {
    console.error('create water quality error:', err);
    res.status(500).json({ message: 'Could not submit reading.' });
  }
});

module.exports = router;
