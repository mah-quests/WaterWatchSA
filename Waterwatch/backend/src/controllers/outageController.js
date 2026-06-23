const { validationResult } = require('express-validator');
const Outage = require('../models/Outage');

const getOutages = async (req, res) => {
  try {
    const { suburb, municipality, status } = req.query;
    const outages = await Outage.findAll({ suburb, municipality, status });
    res.json(outages);
  } catch (err) {
    console.error('getOutages error:', err);
    res.status(500).json({ error: 'Failed to retrieve outages' });
  }
};

const getOutageById = async (req, res) => {
  try {
    const outage = await Outage.findById(req.params.id);
    if (!outage) return res.status(404).json({ error: 'Outage not found' });
    res.json(outage);
  } catch (err) {
    console.error('getOutageById error:', err);
    res.status(500).json({ error: 'Failed to retrieve outage' });
  }
};

const createOutage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { suburb, municipality, description, latitude, longitude } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const outage = await Outage.create({
      suburb,
      municipality,
      description,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      photoUrl,
      reportedBy: req.user.id,
    });

    res.status(201).json(outage);
  } catch (err) {
    console.error('createOutage error:', err);
    res.status(500).json({ error: 'Failed to create outage' });
  }
};

const updateOutage = async (req, res) => {
  try {
    const outage = await Outage.findById(req.params.id);
    if (!outage) return res.status(404).json({ error: 'Outage not found' });

    const allowedFields = ['status', 'description'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    const updated = await Outage.update(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    console.error('updateOutage error:', err);
    res.status(500).json({ error: 'Failed to update outage' });
  }
};

const deleteOutage = async (req, res) => {
  try {
    const outage = await Outage.findById(req.params.id);
    if (!outage) return res.status(404).json({ error: 'Outage not found' });

    await Outage.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('deleteOutage error:', err);
    res.status(500).json({ error: 'Failed to delete outage' });
  }
};

module.exports = { getOutages, getOutageById, createOutage, updateOutage, deleteOutage };
