const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

const adminRoutes = require('./routes/adminRoutes');
const printJobRoutes = require('./routes/printJobRoutes');
const customerRoutes = require('./routes/customerRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const statsRoutes = require('./routes/statsRoutes');

//Load environment variables
dotenv.config();

//Connect to database
connectDB();

//Initialize Express app
const app = express();

// ─── CORS Configuration ──────────────────────────────────────────────────────
// Allows requests from the production frontend URL (set via FRONTEND_URL env var)
// and always allows localhost:5173 for local development.
const allowedOrigins = ['http://localhost:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

//Enable JSON request body parsing
app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api/print-jobs', printJobRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/stats', statsRoutes);

//Root route
app.get('/',(req,res) => {
    res.send('3D Print Billing System API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

