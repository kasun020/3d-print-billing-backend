const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    // 1. Request එකේ Header එකේ 'Authorization' කියලා එකක් තියෙනවද, ඒක පටන් ගන්නේ 'Bearer' වලින්ද කියලා බලනවා
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 2. 'Bearer ' කියන කෑල්ල අයින් කරලා Token එක විතරක් වෙන් කරගන්නවා
            token = req.headers.authorization.split(' ')[1];

            // 3. Token එක හරිද කියලා අපේ JWT_SECRET එක දාලා චෙක් කරනවා
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 4. Token එක හරි නම්, ඒකේ තියෙන Admin ගේ ID එක request එකට අමුණනවා (ඉස්සරහට පාවිච්චි කරන්න)
            req.admin = decoded;

            // 5. ආරක්ෂකයා ගේට්ටුව ඇරලා ඇතුලට යන්න දෙනවා (ඊළඟ function එකට යවනවා)
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // Token එකක් කොහෙත්ම එවලා නැත්නම්
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };