const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/outageController');

const outageValidation = [
  body('suburb').notEmpty().trim().escape(),
  body('municipality').notEmpty().trim().escape(),
  body('description').notEmpty().isLength({ max: 1000 }).trim().escape(),
  body('latitude').isFloat({ min: -35, max: -22 }),
  body('longitude').isFloat({ min: 16, max: 33 }),
];

router.get('/', ctrl.getOutages);
router.get('/:id', ctrl.getOutageById);
router.post('/', verifyToken, upload.single('photo'), outageValidation, ctrl.createOutage);
router.put('/:id', verifyToken, ctrl.updateOutage);
router.delete('/:id', verifyToken, ctrl.deleteOutage);

module.exports = router;
