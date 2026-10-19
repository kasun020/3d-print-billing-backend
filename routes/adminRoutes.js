const express = require('express');
const router = express.Router();
const { registerAdmin, loginAdmin, clearAllData } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// Protected — must be logged in to clear data
router.delete('/clear-data', protect, clearAllData);

module.exports = router;