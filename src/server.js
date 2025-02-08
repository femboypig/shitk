const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

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

// Добавляем обработку ошибок для promises
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// Функция для получения данных пользователя из VK API
async function getVKUserData(access_token) {
    try {
        const response = await axios.get('https://api.vk.com/method/users.get', {
            params: {
                access_token: access_token,
                fields: 'photo_200',
                v: '5.131'
            }
        });

        if (response.data.error) {
            throw new Error(response.data.error.error_msg);
        }

        const user = response.data.response[0];
        return {
            vk_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            photo_url: user.photo_200 || `https://vk.com/images/camera_200.png`,
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
        const { access_token } = req.body;
        console.log('Received access token:', access_token);

        // Получаем реальные данные из VK API
        const userData = await getVKUserData(access_token);
        
        // Добавляем токен к данным пользователя
        userData.access_token = access_token;

        console.log('User data from VK:', userData);

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