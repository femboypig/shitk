const express = require('express');
const path = require('path');
const cors = require('cors');

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// CORS middleware configuration
app.use(cors());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Something broke!');
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Добавляем обработку ошибок для promises
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// Routes
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Error loading page');
    }
});

app.post('/auth/vk/login', (req, res) => {
    try {
        const { user_id } = req.body;
        
        // Формируем данные пользователя из полученного user_id
        const userData = {
            vk_id: user_id,
            first_name: "VK",
            last_name: "User",
            photo_url: `https://vk.com/id${user_id}`,
        };

        console.log('User data:', userData);

        res.json({
            success: true,
            message: 'Authentication successful',
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed: ' + error.message
        });
    }
});

app.get('/auth/vk/callback', (req, res) => {
    try {
        const code = req.query.code;
        console.log('Received authorization code:', code);
        if (!code) {
            return res.redirect('/error?error=' + encodeURIComponent('Не получен код авторизации от VK'));
        }
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Callback error:', error);
        res.redirect('/error?error=' + encodeURIComponent(error.message));
    }
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/error', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'error.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Start server with error handling
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}).on('error', (error) => {
    console.error('Server failed to start:', error);
});

// Handle process errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
}); 