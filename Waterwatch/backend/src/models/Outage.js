const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const VALID_STATUSES = ['reported', 'confirmed', 'in_progress', 'resolved'];

const Outage = {
  async findAll({ suburb, municipality, status } = {}) {
    const conditions = [];
    const values = [];

    if (suburb) {
      conditions.push(`suburb ILIKE $${values.length + 1}`);
      values.push(`%${suburb}%`);
    }
    if (municipality) {
      conditions.push(`municipality ILIKE $${values.length + 1}`);
      values.push(`%${municipality}%`);
    }
    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT id, suburb, municipality, description, photo_url, status,
              ST_Y(location::geometry) AS latitude,
              ST_X(location::geometry) AS longitude,
              reported_by, created_at, updated_at
       FROM outages ${where} ORDER BY created_at DESC`,
      values
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, suburb, municipality, description, photo_url, status,
              ST_Y(location::geometry) AS latitude,
              ST_X(location::geometry) AS longitude,
              reported_by, created_at, updated_at
       FROM outages WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ suburb, municipality, description, latitude, longitude, photoUrl, reportedBy }) {
    const { rows } = await pool.query(
      `INSERT INTO outages (suburb, municipality, description, location, photo_url, status, reported_by)
       VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($5, $4), 4326), $6, 'reported', $7)
       RETURNING id, suburb, municipality, description, photo_url, status,
                 ST_Y(location::geometry) AS latitude,
                 ST_X(location::geometry) AS longitude,
                 reported_by, created_at`,
      [suburb, municipality, description, latitude, longitude, photoUrl, reportedBy]
    );
    return rows[0];
  },

  async update(id, fields) {
    const setClauses = Object.keys(fields).map((key, i) => {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      return `${col} = $${i + 1}`;
    });
    const values = [...Object.values(fields), id];
    const { rows } = await pool.query(
      `UPDATE outages SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );
    return rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM outages WHERE id = $1', [id]);
  },
};

module.exports = Outage;
