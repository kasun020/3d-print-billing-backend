const Invoice = require('../models/Invoice');
const PrintJob = require('../models/PrintJob');

// 1. අලුත් බිලක් හැදීම (Duplicate වෙන එක නවත්වන Validation එකත් එක්ක)
const createInvoice = async (req, res) => {
    try {
        const { customerId, printJobIds } = req.body;

        const jobs = await PrintJob.find({ _id: { $in: printJobIds } });

        // [අලුත් වෙනස] - මේ Print Jobs දැනටමත් වෙන බිලකට දාලද කියලා බලනවා
        const alreadyBilledJobs = jobs.filter(job => job.status === 'Billed');
        if (alreadyBilledJobs.length > 0) {
            return res.status(400).json({ 
                message: 'Error: Cannot create invoice. One or more print jobs are already billed.' 
            });
        }

        let calculatedTotal = 0;
        jobs.forEach(job => {
            calculatedTotal += job.cost;
        });

        const newInvoice = new Invoice({
            customer: customerId,
            printJobs: printJobIds,
            totalAmount: calculatedTotal,
            paymentStatus: 'Pending'
        });

        const savedInvoice = await newInvoice.save();

        // Print Jobs වල status එක 'Billed' කරනවා
        await PrintJob.updateMany(
            { _id: { $in: printJobIds } },
            { $set: { status: 'Billed' } }
        );

        const populatedInvoice = await Invoice.findById(savedInvoice._id)
            .populate('customer', 'name phone email')
            .populate('printJobs', 'fileName cost status');

        res.status(201).json(populatedInvoice);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. දැනට තියෙන බිලක් Edit කිරීම (Update Invoice)
const updateInvoice = async (req, res) => {
    try {
        const { customerId, printJobIds } = req.body;
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // සල්ලි ගෙවපු බිල් Edit කරන්න දෙන්නේ නෑ
        if (invoice.paymentStatus === 'Paid') {
            return res.status(400).json({ message: 'Cannot edit an already paid invoice.' });
        }

        // පියවර A: පරණ Print Jobs ටික ආයෙත් 'Pending' තත්ත්වයට පත් කරනවා (නිදහස් කරනවා)
        await PrintJob.updateMany(
            { _id: { $in: invoice.printJobs } },
            { $set: { status: 'Pending' } }
        );

        // පියවර B: අලුතින් එව්ව Print Jobs ටික අරගෙන, ඒවා වෙන බිලක ඒවාද කියලා බලනවා
        const newJobs = await PrintJob.find({ _id: { $in: printJobIds } });
        const alreadyBilledJobs = newJobs.filter(job => job.status === 'Billed');
        
        if (alreadyBilledJobs.length > 0) {
            // එහෙම අවුලක් නම්, අර නිදහස් කරපු පරණ ටික ආයෙත් Billed කරනවා ආරක්ෂාවට
            await PrintJob.updateMany(
                { _id: { $in: invoice.printJobs } },
                { $set: { status: 'Billed' } }
            );
            return res.status(400).json({ message: 'Error: New print jobs selected are already billed to another invoice.' });
        }

        // පියවර C: අලුත් ගාණ හදනවා
        let calculatedTotal = 0;
        newJobs.forEach(job => { calculatedTotal += job.cost; });

        // පියවර D: Invoice එක Update කරනවා
        invoice.customer = customerId || invoice.customer;
        invoice.printJobs = printJobIds;
        invoice.totalAmount = calculatedTotal;
        const updatedInvoice = await invoice.save();

        // පියවර E: අලුත් Print Jobs ටික 'Billed' කියලා ලකුණු කරනවා
        await PrintJob.updateMany(
            { _id: { $in: printJobIds } },
            { $set: { status: 'Billed' } }
        );

        // Update වුණු බිල Frontend එකට යවනවා
        const populatedInvoice = await Invoice.findById(updatedInvoice._id)
            .populate('customer', 'name phone email')
            .populate('printJobs', 'fileName cost status material weightInGrams');

        res.status(200).json(populatedInvoice);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Payment Status එක 'Paid' කරන එක (කලින් හදපු එක)
const updatePaymentStatus = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        
        invoice.paymentStatus = 'Paid';
        const updatedInvoice = await invoice.save();
        res.status(200).json(updatedInvoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Invoices ලිස්ට් එක ගන්න එක (Pagination එක්ක සහ Customer Filter එකක් එක්ක)
const getInvoices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const filter = {};
        if (req.query.customerId) {
            filter.customer = req.query.customerId;
        }

        const totalCount = await Invoice.countDocuments(filter);
        
        const invoices = await Invoice.find(filter)
            .populate('customer', 'name phone email')
            .populate('printJobs', 'fileName cost status')
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        res.status(200).json({
            invoices,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createInvoice, updateInvoice, updatePaymentStatus, getInvoices };