const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, firstName: user.first_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function safeUser(u) {
  return {
    id:           u.id,
    firstName:    u.first_name,
    lastName:     u.last_name,
    email:        u.email,
    phone:        u.phone,
    role:         u.role,
    province:     u.province,
    municipality: u.municipality,
    suburb:       u.suburb,
    language:     u.language,
    alertSms:     u.alert_sms,
    alertEmail:   u.alert_email,
    alertPush:    u.alert_push,
    createdAt:    u.created_at,
  };
}

/* POST /api/auth/register */
router.post('/register', async (req, res) => {
  const {
    firstName, lastName, email, phone, password,
    province, municipality, suburb, streetAddress, postalCode,
    language, alertSms, alertEmail, alertPush,
  } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'firstName, lastName, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  try {
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      `INSERT INTO users
         (first_name, last_name, email, phone, password_hash,
          province, municipality, suburb, street_address, postal_code,
          language, alert_sms, alert_email, alert_push)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        firstName, lastName, email.toLowerCase(), phone || null, hash,
        province || null, municipality || null, suburb || null,
        streetAddress || null, postalCode || null,
        language || 'en',
        alertSms  !== false,
        alertEmail !== false,
        alertPush === true,
      ]
    );

    const user = rows[0];
    res.status(201).json({ token: signToken(user), user: safeUser(user) });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    res.json({ token: signToken(user), user: safeUser(user) });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

/* GET /api/auth/me */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: safeUser(rows[0]) });
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ message: 'Could not fetch user.' });
  }
});

module.exports = router;
