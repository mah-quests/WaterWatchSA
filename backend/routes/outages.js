const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../middleware/auth');

/* GET /api/outages */
router.get('/', async (req, res) => {
  const { status, severity, province, municipality, limit = 50, offset = 0 } = req.query;
  const conditions = [];
  const params     = [];

  if (status)       { params.push(status);       conditions.push(`o.status = $${params.length}`); }
  if (severity)     { params.push(severity);     conditions.push(`o.severity = $${params.length}`); }
  if (province)     { params.push(province);     conditions.push(`o.province = $${params.length}`); }
  if (municipality) { params.push(municipality); conditions.push(`o.municipality = $${params.length}`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  params.push(Math.min(parseInt(limit) || 50, 200));
  params.push(parseInt(offset) || 0);

  try {
    const { rows } = await db.query(
      `SELECT o.*, u.first_name || ' ' || u.last_name AS reporter_name
       FROM outages o
       LEFT JOIN users u ON u.id = o.reported_by
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ outages: rows });
  } catch (err) {
    console.error('list outages error:', err);
    res.status(500).json({ message: 'Could not fetch outages.' });
  }
});

/* GET /api/outages/:id */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*, u.first_name || ' ' || u.last_name AS reporter_name
       FROM outages o LEFT JOIN users u ON u.id = o.reported_by
       WHERE o.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Outage not found.' });
    res.json({ outage: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch outage.' });
  }
});

/* POST /api/outages */
router.post('/', requireAuth, async (req, res) => {
  const { title, description, severity, province, municipality, suburb, address, lat, lng } = req.body;
  if (!title) return res.status(400).json({ message: 'title is required.' });

  try {
    const { rows } = await db.query(
      `INSERT INTO outages
         (reported_by, title, description, severity, province, municipality, suburb, address, lat, lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        req.user.id, title, description || null,
        severity || 'medium', province || null, municipality || null,
        suburb || null, address || null,
        lat ? parseFloat(lat) : null, lng ? parseFloat(lng) : null,
      ]
    );
    res.status(201).json({ outage: rows[0] });
  } catch (err) {
    console.error('create outage error:', err);
    res.status(500).json({ message: 'Could not create outage.' });
  }
});

/* PATCH /api/outages/:id/status */
router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status, note, estimated_resolution } = req.body;
  const VALID = ['reported', 'investigating', 'in_progress', 'resolved'];
  if (!VALID.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${VALID.join(', ')}` });
  }

  try {
    const extras = status === 'resolved' ? ', resolved_at = NOW()' : '';
    const { rows } = await db.query(
      `UPDATE outages
       SET status = $1, updated_at = NOW() ${extras}
           ${estimated_resolution ? ', estimated_resolution = $3' : ''}
       WHERE id = $2
       RETURNING *`,
      estimated_resolution
        ? [status, req.params.id, estimated_resolution]
        : [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Outage not found.' });

    if (note) {
      await db.query(
        `INSERT INTO outage_updates (outage_id, posted_by, message, status_change)
         VALUES ($1, $2, $3, $4)`,
        [req.params.id, req.user.id, note, status]
      );
    }

    res.json({ outage: rows[0] });
  } catch (err) {
    console.error('update status error:', err);
    res.status(500).json({ message: 'Could not update outage.' });
  }
});

/* GET /api/outages/:id/updates */
router.get('/:id/updates', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ou.*, u.first_name || ' ' || u.last_name AS poster_name
       FROM outage_updates ou
       LEFT JOIN users u ON u.id = ou.posted_by
       WHERE ou.outage_id = $1
       ORDER BY ou.created_at DESC`,
      [req.params.id]
    );
    res.json({ updates: rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch updates.' });
  }
});

/* POST /api/outages/:id/updates */
router.post('/:id/updates', requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: 'message is required.' });

  try {
    const { rows } = await db.query(
      `INSERT INTO outage_updates (outage_id, posted_by, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, req.user.id, message]
    );
    await db.query('UPDATE outages SET updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.status(201).json({ update: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Could not post update.' });
  }
});

module.exports = router;
