const Customer = require('../models/Customer');

// Get all Customers
const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({}).sort({ createdAt: -1 });
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new Customer
const createCustomer = async (req, res) => {
    try {
        const { name, phone, email } = req.body;

        const newCustomer = new Customer({
            name,
            phone,
            email
        });

        const savedCustomer = await newCustomer.save();
        res.status(201).json(savedCustomer);
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getCustomers, createCustomer };
