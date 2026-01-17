const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount all routes under /api
app.use('/api', authRoutes);
app.use('/api', productRoutes);
app.use('/api', cartRoutes);
app.use('/api', adminRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend API running on port ${PORT}.`);
});