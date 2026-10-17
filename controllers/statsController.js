const Invoice = require('../models/Invoice');
const PrintJob = require('../models/PrintJob');
const Customer = require('../models/Customer');

// GET /api/stats - Aggregate dashboard statistics
const getStats = async (req, res) => {
    try {
        // Run all aggregation queries in parallel for performance
        const [
            totalRevenueResult,
            pendingInvoiceValueResult,
            jobStatusCounts,
            totalCustomers,
            recentInvoices,
            materialsResult
        ] = await Promise.all([
            // Total revenue from all Paid invoices
            Invoice.aggregate([
                { $match: { paymentStatus: 'Paid' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),

            // Total value of all Pending invoices
            Invoice.aggregate([
                { $match: { paymentStatus: 'Pending' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),

            // Count of print jobs grouped by status
            PrintJob.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),

            // Total number of customers
            Customer.countDocuments(),

            // 5 most recent invoices (populated)
            Invoice.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('customer', 'name phone'),

            // Material breakdown and total production volume
            PrintJob.aggregate([
                {
                    $group: {
                        _id: '$material',
                        weight: { $sum: '$weightInGrams' },
                        cost: { $sum: '$cost' },
                        count: { $sum: 1 },
                        time: { $sum: '$printTimeHours' }
                    }
                }
            ])
        ]);

        // Transform jobStatusCounts array into a friendly object
        // e.g. [{ _id: 'Pending', count: 3 }] -> { Pending: 3, Printing: 0, ... }
        const statusMap = { Pending: 0, Printing: 0, Completed: 0, Billed: 0 };
        jobStatusCounts.forEach(item => {
            if (statusMap.hasOwnProperty(item._id)) {
                statusMap[item._id] = item.count;
            }
        });

        // Process material breakdown
        const materialBreakdown = materialsResult.map(item => ({
            material: item._id,
            weight: item.weight,
            cost: item.cost,
            count: item.count
        }));

        const totalProduction = materialsResult.reduce((acc, curr) => {
            acc.weight += curr.weight;
            acc.time += curr.time;
            return acc;
        }, { weight: 0, time: 0 });

        res.status(200).json({
            totalRevenue: totalRevenueResult[0]?.total || 0,
            pendingInvoiceValue: pendingInvoiceValueResult[0]?.total || 0,
            printJobsByStatus: statusMap,
            totalCustomers,
            recentInvoices,
            productionVolume: totalProduction,
            materialBreakdown
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStats };
