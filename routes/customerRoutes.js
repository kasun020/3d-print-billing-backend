const express = require('express');
const router = express.Router();

const { getCustomers, createCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

// GET - Retrieve all customers
router.get('/', protect, getCustomers);

// POST - Create a new customer
router.post('/', protect, createCustomer);

module.exports = router;