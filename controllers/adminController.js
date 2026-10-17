const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. පළවෙනි පාරට Admin කෙනෙක් හදාගැනීම (Register)
const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // මේ email එකෙන් දැනටමත් admin කෙනෙක් ඉන්නවද බලනවා
        const adminExists = await Admin.findOne({ email });
        if (adminExists) return res.status(400).json({ message: 'Admin already exists' });

        // Password එක Hash කරනවා (හැක් කරන්න බැරි වෙන්න වෙනස් කරනවා)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // අලුත් Admin ව Database එකට සේව් කරනවා
        const admin = await Admin.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Admin Login වීම (Login)
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Email එක Database එකේ තියෙනවද බලනවා
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        // ගහපු Password එකයි, Database එකේ තියෙන Hash කරපු Password එකයි සමානද බලනවා
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // ඔක්කොම හරි නම්, Token එකක් හදලා දෙනවා (පැය 24ක් මේකෙන් වැඩ කරන්න පුළුවන්)
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({
            message: 'Login successful',
            token, // මේ Token එක තමයි ඩිජිටල් යතුර
            admin: { id: admin._id, name: admin.name, email: admin.email }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerAdmin, loginAdmin };