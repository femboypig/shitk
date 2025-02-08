const express = require('express');
const path = require('path');
const cors = require('cors');

// Initialize express app
const app = express();
const port = 3000;

// CORS middleware configuration
app.use(cors({
    origin: ['http://localhost:3000', 'https://id.vk.com'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Something broke!');
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Error loading page');
    }
});

app.get('/auth/vk/callback', (req, res) => {
    try {
        const code = req.query.code;
        console.log('Received code:', code);
        res.send('Authentication successful!');
    } catch (error) {
        console.error('Auth callback error:', error);
        res.status(500).send('Authentication error');
    }
});

// Start server with error handling
const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}).on('error', (error) => {
    console.error('Server failed to start:', error);
});

// Handle process errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
}); 