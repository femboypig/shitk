const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Инициализация Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://shitk-p-default-rtdb.firebaseio.com/"
});

const db = admin.firestore();

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

// Конфигурация приложения VK
const VK_SERVICE_TOKEN = '2323667e2323667e2323667e05200a7e80223232323667e44869a1dfe5d269c4c270c9e'; // Замените на ваш сервисный ключ

async function getVKUserInfo(user_id) {
    try {
        const response = await axios.get('https://api.vk.com/method/users.get', {
            params: {
                user_ids: user_id,
                fields: 'photo_200',
                access_token: VK_SERVICE_TOKEN, // Используем сервисный токен
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
            photo_url: user.photo_200 || `https://vk.com/id${user_id}`
        };
    } catch (error) {
        console.error('VK API Error:', error);
        throw error;
    }
}

app.post('/auth/vk/login', async (req, res) => {
    try {
        const { user_id } = req.body;
        
        if (!user_id) {
            throw new Error('Missing user_id');
        }

        const userData = await getVKUserInfo(user_id);
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
            message: error.message
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


app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'support.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});
app.get('/verify', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify.html'));
});


// Эндпоинт для верификации токена удаления
app.post('/api/verify-deletion', async (req, res) => {
    try {
        const { token, uid, userData } = req.body;

        if (!token || !uid || !userData) {
            return res.status(400).json({
                success: false,
                error: 'Отсутствуют необходимые данные'
            });
        }

        // Initialize Firestore
        const db = admin.firestore();
        
        // Проверяем существование токена в Firebase
        const tokenDoc = await db.collection('verification_tokens')
            .doc(uid)
            .get();

        if (!tokenDoc.exists) {
            return res.status(400).json({
                success: false,
                error: 'Недействительный токен верификации'
            });
        }

        const tokenData = tokenDoc.data();

        // Проверяем соответствие токена
        if (tokenData.token !== token) {
            return res.status(400).json({
                success: false,
                error: 'Неверный токен верификации'
            });
        }

        // Проверяем срок действия токена (30 минут)
        const tokenTimestamp = tokenData.created_at;
        const tokenAge = Date.now() - (tokenTimestamp._seconds * 1000);
        
        if (tokenAge > 30 * 60 * 1000) {
            await tokenDoc.ref.delete();
            return res.status(400).json({
                success: false,
                error: 'Срок действия токена истек'
            });
        }

        // Return success response with user data
        res.json({ 
            success: true,
            userData: {
                first_name: userData.first_name,
                last_name: userData.last_name,
                uid: uid
            }
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при проверке токена'
        });
    }
});

// Эндпоинт для подтверждения удаления
app.post('/api/confirm-deletion', async (req, res) => {
    try {
        const { token, uid } = req.body;

        // Проверяем токен еще раз
        const tokenDoc = await db.collection('verification_tokens')
            .doc(uid)
            .get();

        if (!tokenDoc.exists || tokenDoc.data().status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Недействительный токен'
            });
        }

        // Начинаем транзакцию для атомарного обновления
        await db.runTransaction(async (transaction) => {
            // Обновляем статус токена
            transaction.update(tokenDoc.ref, { status: 'completed' });

            // Создаем запись о запросе на удаление
            const deletionRef = db.collection('deletion_requests').doc(uid);
            transaction.set(deletionRef, {
                user_id: uid,
                requested_at: admin.firestore.FieldValue.serverTimestamp(),
                status: 'pending',
                token: token
            });
        });

        // Отправляем уведомление в Telegram через бота
        const bot_token = '7623000540:AAHNX-KCHWXq6XIV54ruYlDAWKydvtsUc3g';
        await axios.post(`https://api.telegram.org/bot${bot_token}/sendMessage`, {
            chat_id: uid,
            text: "✅ Удаление данных подтверждено.\nВаши данные будут удалены в течение 24 часов."
        });


        res.json({ success: true });

    } catch (error) {
        console.error('Confirmation error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка подтверждения'
        });
    }
});
// Support endpoint
app.post('/api/support', async (req, res) => {
    try {
        const { subject, message } = req.body;
        
        // Here you would typically:
        // 1. Validate the input
        if (!subject || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Subject and message are required' 
            });
        }

        // 2. Store in database or send to support system
        // For now, we'll just log it
        console.log('Support request received:', {
            subject,
            message,
            timestamp: new Date().toISOString()
        });

        // 3. Send success response
        res.json({ 
            success: true, 
            message: 'Support request received' 
        });
    } catch (error) {
        console.error('Support error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
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

