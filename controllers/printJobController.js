const PrintJob = require('../models/PrintJob');

// Get all Print Jobs (with optional ?status= filter)
const getPrintJobs = async (req, res) => {
    try {
        const filter = {};
        // Allow filtering by status, e.g. GET /api/print-jobs?status=Pending
        if (req.query.status) {
            filter.status = req.query.status;
        }
        const jobs = await PrintJob.find(filter)
            .populate('customer', 'name phone')
            .sort({ createdAt: -1 });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// අලුත් Print Job එකක් පද්ධතියට ඇතුලත් කිරීම
const createPrintJob = async (req, res) => {
    try {
        // Frontend එකෙන් එවන data අතරින් rates දෙකත් අපි මෙතනදී ලබා ගන්නවා
        const { 
            customerId,
            fileName, 
            material, 
            weightInGrams, 
            printTimeHours, 
            materialRatePerGram, // Frontend එකෙන් එවන ග්‍රෑම් එකක මිල
            timeRatePerHour      // Frontend එකෙන් එවන පැයක මිල
        } = req.body;

        // --- බිල ගණනය කිරීමේ ලොජික් එක (Pricing Logic) ---
        
        // සම්පූර්ණ Print Job එකේ Cost එක හදනවා (Frontend එකෙන් ආපු rates පාවිච්චි කරලා)
        const calculatedCost = (weightInGrams * materialRatePerGram) + (printTimeHours * timeRatePerHour);

        // Database එකට යවන්න Model එකට දත්ත ටික දානවා
        const newPrintJob = new PrintJob({
            customer: customerId,
            fileName,
            material,
            weightInGrams,
            printTimeHours,
            cost: calculatedCost 
        });

        // Database එකේ Save කරනවා
        const savedJob = await newPrintJob.save();
        
        // Populate customer to return complete object to frontend
        const populatedJob = await PrintJob.findById(savedJob._id).populate('customer', 'name phone');
        
        // සාර්ථක වුණාම Frontend එකට Result එක යවනවා
        res.status(201).json(populatedJob);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a Print Job's status (Pending -> Printing -> Completed only)
// 'Billed' status is managed automatically by the Invoice system, not manually.
const updatePrintJobStatus = async (req, res) => {
    try {
        const { status } = req.body;

        // Validate that 'Billed' cannot be set manually from this endpoint
        const allowedStatuses = ['Pending', 'Printing', 'Completed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ 
                message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}. 'Billed' is set automatically by the invoice system.`
            });
        }

        const job = await PrintJob.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Print job not found.' });
        }

        // Prevent status change on a job that is already Billed
        if (job.status === 'Billed') {
            return res.status(400).json({ 
                message: 'Cannot change status of a job that is already Billed to an invoice.' 
            });
        }

        job.status = status;
        const updatedJob = await job.save();
        res.status(200).json(updatedJob);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Full Edit Print Job (Update all fields and sync Invoices)
const Invoice = require('../models/Invoice');

const updatePrintJob = async (req, res) => {
    try {
        const { 
            fileName, 
            customer, // this is the customer ID
            material, 
            weightInGrams, 
            materialRatePerGram, 
            printTimeHours, 
            timeRatePerHour,
            status 
        } = req.body;

        const job = await PrintJob.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Print job not found.' });
        }

        // Recalculate cost
        const calculatedCost = (Number(weightInGrams) * Number(materialRatePerGram || 0)) + 
                               (Number(printTimeHours) * Number(timeRatePerHour || 0));

        // Update fields
        if (fileName !== undefined) job.fileName = fileName;
        if (customer !== undefined) job.customer = customer || null;
        if (material !== undefined) job.material = material;
        if (weightInGrams !== undefined) job.weightInGrams = weightInGrams;
        if (materialRatePerGram !== undefined) job.materialRatePerGram = materialRatePerGram;
        if (printTimeHours !== undefined) job.printTimeHours = printTimeHours;
        if (timeRatePerHour !== undefined) job.timeRatePerHour = timeRatePerHour;
        job.cost = calculatedCost;
        if (status !== undefined) job.status = status;

        const updatedJob = await job.save();

        // Auto-Sync Linked Invoices
        const linkedInvoices = await Invoice.find({ printJobs: updatedJob._id }).populate('printJobs');
        for (let invoice of linkedInvoices) {
            // Recalculate invoice total
            const newTotal = invoice.printJobs.reduce((sum, pj) => sum + (pj.cost || 0), 0);
            invoice.totalAmount = newTotal;
            
            // Keep customer reference consistent
            if (customer && invoice.customer.toString() !== customer.toString()) {
                invoice.customer = customer;
            }
            await invoice.save();
        }

        const populatedJob = await PrintJob.findById(updatedJob._id).populate('customer', 'name phone email');
        res.status(200).json(populatedJob);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPrintJobs, createPrintJob, updatePrintJobStatus, updatePrintJob };