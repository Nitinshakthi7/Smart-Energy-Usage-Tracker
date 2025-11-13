const express = require('express');
const dotenv = require('dotenv');

dotenv.config();
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const readingRoutes = require('./routes/readingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/homes', homeRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'Smart Energy Tracker API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            homes: '/api/homes',
            readings: '/api/readings',
            analytics: '/api/analytics'
        }
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
});