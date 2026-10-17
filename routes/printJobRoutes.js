const express = require('express');
const router = express.Router();

const { getPrintJobs, createPrintJob, updatePrintJobStatus, updatePrintJob } = require('../controllers/printJobController');
const { protect } = require('../middleware/authMiddleware');

// GET - Retrieve all print jobs (supports ?status= query param for filtering)
router.get('/', protect, getPrintJobs);

// POST - Create a new print job
router.post('/', protect, createPrintJob);

// PATCH - Update the status of a specific print job
router.patch('/:id/status', protect, updatePrintJobStatus);

// PUT & PATCH - Full update of a print job
router.put('/:id', protect, updatePrintJob);
router.patch('/:id', protect, updatePrintJob);

module.exports = router;