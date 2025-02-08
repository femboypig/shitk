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

// Функция для получения данных пользователя через VK API
async function fetchVKUserData(access_token) {
    try {
        console.log('Fetching VK user data with token:', access_token.substring(0, 20) + '...');
        
        const response = await axios({
            method: 'get',
            url: 'https://api.vk.com/method/users.get',
            params: {
                access_token: access_token,
                fields: 'photo_200',
                v: '5.131'
            },
            validateStatus: false // Чтобы axios не выбрасывал ошибку для не-200 статусов
        });

        console.log('VK API Raw Response:', JSON.stringify(response.data, null, 2));

        if (response.data.error) {
            console.error('VK API Error:', response.data.error);
            throw new Error(response.data.error.error_msg || 'VK API Error');
        }

        if (!response.data.response || !response.data.response[0]) {
            console.error('Invalid VK API Response:', response.data);
            throw new Error('Invalid response from VK API');
        }

        const user = response.data.response[0];
        const userData = {
            vk_id: user.id,
            first_name: user.first_name || 'Пользователь',
            last_name: user.last_name || 'VK',
            photo_url: user.photo_200 || `https://vk.com/images/camera_200.png`,
            access_token: access_token
        };

        console.log('Processed user data:', JSON.stringify(userData, null, 2));
        return userData;

    } catch (error) {
        console.error('Error in fetchVKUserData:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error(`Failed to fetch user data: ${error.message}`);
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

app.post('/auth/vk/login', (req, res) => {
    try {
        const { access_token, user_id } = req.body;
        
        // Просто возвращаем базовые данные пользователя
        const userData = {
            vk_id: user_id,
            first_name: "User",
            last_name: "VK",
            photo_url: `https://vk.com/images/camera_200.png`,
            access_token: access_token
        };

        res.json({
            success: true,
            message: 'Authentication successful',
            user: userData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
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