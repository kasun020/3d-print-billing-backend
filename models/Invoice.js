const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    customer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true 
    },
    printJobs: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'PrintJob' 
    }],
    totalAmount: { type: Number, required: true }, 
    paymentStatus: { type: String, default: 'Pending', enum: ['Pending', 'Paid'] }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);