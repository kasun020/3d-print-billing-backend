const mongoose = require('mongoose');

const printJobSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    material: { type: String, required: true },
    weightInGrams: { type: Number, required: true },
    materialRatePerGram: { type: Number, default: 0 },
    printTimeHours: { type: Number, required: true },
    timeRatePerHour: { type: Number, default: 0 },
    cost: { type: Number, required: true },
    status: { 
        type: String, 
        default: 'Pending', 
        enum: ['Pending', 'Printing', 'Completed', 'Billed'] 
    }
}, { timestamps: true });

module.exports = mongoose.model('PrintJob', printJobSchema);