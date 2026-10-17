const express = require('express');
const router = express.Router();

const { createInvoice, updatePaymentStatus, getInvoices, updateInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

// POST request එකක් ආවම createInvoice function එක run වෙනවා
router.post('/', protect, createInvoice);

// GET - Invoices ඔක්කොම බලන්න (Filter සහ Pagination හදපු එක)
router.get('/', protect, getInvoices);

// pay කරන Route එක 
router.put('/:id/pay', protect, updatePaymentStatus);

// edit කරන Route එක 
router.put('/:id', protect, updateInvoice);

module.exports = router;