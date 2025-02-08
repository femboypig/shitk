const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

// Initialize express app
const app = express();
const port = 3000;

// CORS middleware configuration
app.use(cors({
    origin: ['http://localhost:3000', 'https://id.vk.com', 'https://shitk-p.vercel.app'],
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

// Функция для получения данных пользователя через VK API
async function fetchVKUserData(access_token, user_id) {
    try {
        const response = await axios.get(`https://api.vk.com/method/users.get`, {
            params: {
                user_ids: user_id,
                fields: 'photo_200,email',
                access_token: access_token,
                v: '5.131'
            }
        });
        
        const data = response.data;
        
        if (data.error) {
            throw new Error(data.error.error_msg);
        }

        const user = data.response[0];
        return {
            vk_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            photo_url: user.photo_200,
            email: user.email,
            access_token
        };
    } catch (error) {
        console.error('VK API Error:', error);
        throw error;
    }
}

// Routes
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Error loading page');
    }
});

app.post('/auth/vk/login', async (req, res) => {
    try {
        const { access_token, user_id } = req.body;
        
        if (!access_token || !user_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing access_token or user_id'
            });
        }

        // Получаем данные пользователя через VK API
        const userData = await fetchVKUserData(access_token, user_id);
        
        console.log('Processed VK user data:', userData);
        
        res.json({
            success: true,
            message: 'Authentication successful',
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to authenticate'
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