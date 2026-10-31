const mongoose = require('mongoose');

const printJobSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    material: { type: String, required: true },
    printingCost: { type: Number, required: true, default: 0 },
    designCost:   { type: Number, required: true, default: 0 },
    cost:         { type: Number, required: true },   // always = printingCost + designCost
    status: { 
        type: String, 
        default: 'Pending', 
        enum: ['Pending', 'Printing', 'Completed', 'Billed'] 
    }
}, { timestamps: true });

module.exports = mongoose.model('PrintJob', printJobSchema);