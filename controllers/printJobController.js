const PrintJob = require('../models/PrintJob');
const Invoice   = require('../models/Invoice');

// Get all Print Jobs (with optional ?status= filter)
const getPrintJobs = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        const jobs = await PrintJob.find(filter)
            .populate('customer', 'name phone')
            .sort({ createdAt: -1 });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new Print Job
const createPrintJob = async (req, res) => {
    try {
        const { customerId, fileName, material, printingCost, designCost } = req.body;

        const pCost = Number(printingCost) || 0;
        const dCost = Number(designCost)   || 0;
        const totalCost = pCost + dCost;

        const newPrintJob = new PrintJob({
            customer:     customerId || null,
            fileName,
            material,
            printingCost: pCost,
            designCost:   dCost,
            cost:         totalCost,
        });

        const savedJob    = await newPrintJob.save();
        const populatedJob = await PrintJob.findById(savedJob._id).populate('customer', 'name phone');
        res.status(201).json(populatedJob);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a Print Job's status (Pending -> Printing -> Completed only)
const updatePrintJobStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['Pending', 'Printing', 'Completed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ 
                message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}. 'Billed' is set automatically.`
            });
        }

        const job = await PrintJob.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Print job not found.' });

        if (job.status === 'Billed') {
            return res.status(400).json({ message: 'Cannot change status of a job that is already Billed.' });
        }

        job.status = status;
        const updatedJob = await job.save();
        res.status(200).json(updatedJob);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Full Edit Print Job (Update all fields and sync linked Invoices)
const updatePrintJob = async (req, res) => {
    try {
        const { fileName, customer, material, printingCost, designCost, status } = req.body;

        const job = await PrintJob.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Print job not found.' });

        const pCost = Number(printingCost) || 0;
        const dCost = Number(designCost)   || 0;
        const totalCost = pCost + dCost;

        if (fileName     !== undefined) job.fileName     = fileName;
        if (customer     !== undefined) job.customer     = customer || null;
        if (material     !== undefined) job.material     = material;
        if (printingCost !== undefined) job.printingCost = pCost;
        if (designCost   !== undefined) job.designCost   = dCost;
        job.cost = totalCost;
        if (status !== undefined) job.status = status;

        const updatedJob = await job.save();

        // Auto-Sync Linked Invoices
        const linkedInvoices = await Invoice.find({ printJobs: updatedJob._id }).populate('printJobs');
        for (let invoice of linkedInvoices) {
            invoice.totalAmount = invoice.printJobs.reduce((sum, pj) => sum + (pj.cost || 0), 0);
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