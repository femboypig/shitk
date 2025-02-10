const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');

// Firebase Admin SDK configuration
const serviceAccount = {
    type: "service_account",
    project_id: "shitk-p",
    private_key_id: "954bf81c8b55f8304700e983c01b57f0d1f1a7ea",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCcCliLxlZbUCPA\nk3/oCQFktqNIXlqrMLc0lgREEA3SvLJu1maWMBRfziwFPrYjR0y9uvaJnfAnfYTh\nd0BCJrBde+BBlVTnRsb5+1w4q0EEOHrMvMYaXMPVxibylNIc/QHWa8h2gggwNHpW\nIOfgwSQfvHw3IRL9g/8fdT4jYpiEjVSh8s4egSFZoQIXEEDOIyIiMMK0niQjB9Fm\nws0INolpiw+ujuYrERZFn6Avrv1dqwM7JO2GbfrS/dT4H/QU5rrJJV1pb6FER6SJ\n1pyG0J78GAe5BCTNZzHYxItdzSWgOU4/ZCiJXujudYcs7bDs1bUOq9gCmINkmv0m\n7YwtM5GBAgMBAAECggEAAZ//9RCvNIs8nBRNKDLzz0Mxpx7IbfD3b3ZCfBz4r+Gk\nMBBOiDDe/XJtte5Fwk9LRsyMJbm91wNxH1H5GtdBTe/s0XIHLNNpXhAWkUaDSlJ2\nQOyUWZDuvyqtnCgdmgyueLetokJPaIUbYws7rvUD9cqmNoLDKl22CfNUHtU3hmXY\nNXPsMBlDu/1fPD5X4mJWdVg+4KVtsYM6PBnoxb74+G2bgKY0L6ZdjKYxVzF596mJ\n+7ZAZ9NkCYewgctCVW8LpQ6Sf2OpvTiXeMxny8MwRoz/CH0B9aaTbmGTD5l/90tf\ncN5UXdIDsSG85YtvsEbO4YbWepWcG3xgELQ6P1BcswKBgQDcfbzU8x/w04YVmsk1\nR7L8XPi+WpS8W6+3tOaO6yGB3V5W+8AWyvX+/rIuv1IGXDEEIiXWnkIa9qG9MAR1\nbEraok8Yvypm7y2UeNgzDvCqx9TdoNv4uISv3OxhnsZ9anxGy1A1Z65F/kUyoHQV\nbFeFzSeU5D6mq6TxzBsxXne6cwKBgQC1K3nP5sF2khF2ScxXlVvDnZH0o3CdoF1C\nRNeZ8+rwJD7Aeqd8uPuyLzS236V8HHsRMgocURX7pbLpps/drAevWfShU8BlsvAq\n7Tf0AGn5LZinYXjWIE/Q9OcwPrjNC8nhqo1kKlycgcAqzr3JXuxnBNt4CSAGsmdN\nh1kH5ZLDOwKBgQCGC/9YK3L4s3AqBE9dD/j1ygQDnggct1UNx3H/410cmZt4IFd4\nw+1oGCn1l6Tjbvrxu1zrrI0d3WEZJm8fgDXF07VooxfBOpmoUQuHhwaznQeBsgDp\npiwsyo//DUs5BhsF4ychQKZHsT0aeUf5mkNfegkdUOHx7Bo8Uk0Z54e8lwKBgAOm\nJIXzd+ITfxaK1frNn1OJUO9Ee3gxSq+TA2SubQT5NepajhUNBMTJ/p3QU1z0leX6\nxAld+Ltg0wGxwm4MkPsPLMYzEaT6vaufq4jWmUvTh0eXxv9JF1J2HFH0cXRv0Fkj\nPkXONJ9SXbR/BYOQzeIlTuZUCLkZzsrY9woZraMRAoGAF6rbbrsRKnl5uzBft+r8\n7tH+CZY9lwJwWCvhv4bW+q0uPb2m8MZcyaslEDL+uFB8EzJA0XnVHAKOTJDV+BQn\ng9Z48bnrPREdD87a9OPYplM50JgkzI5MoqpHfeeWEpaRRVz9a9Zg7RtU+RZWAer/\nWoQTWPHuaTBEl/FKW2VWoCg=\n-----END PRIVATE KEY-----\n",
    client_email: "firebase-adminsdk-fbsvc@shitk-p.iam.gserviceaccount.com",
    client_id: "109874227719706049138",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40shitk-p.iam.gserviceaccount.com"
};

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://shitk-p-default-rtdb.firebaseio.com/"
    });
}

const db = admin.database();
const firestore = admin.firestore();

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
        const { token, uid } = req.body;

        if (!token || !uid) {
            return res.status(400).json({
                success: false,
                error: 'Отсутствуют необходимые данные'
            });
        }

        try {
            // Проверяем существование токена в Realtime Database
            const tokenSnapshot = await db.ref(`verification_tokens/${uid}`).once('value');
            const tokenData = tokenSnapshot.val();

            if (!tokenData || tokenData.token !== token) {
                return res.status(400).json({
                    success: false,
                    error: 'Недействительный токен верификации'
                });
            }

            // Токен валиден, возвращаем успех
            res.json({
                success: true,
                message: 'Токен верифицирован успешно'
            });

        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error verifying deletion token:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при проверке токена: ' + error.message
        });
    }
});

app.get('/deletionconfirmed', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'deletionconfirmed.html'));
});
// Эндпоинт для подтверждения удаления

app.post('/api/confirm-deletion', async (req, res) => {
    try {
        const { token, uid } = req.body;

        // Проверяем токен еще раз
        const tokenSnapshot = await db.ref(`verification_tokens/${uid}`).once('value');
        const tokenData = tokenSnapshot.val();

        if (!tokenData || tokenData.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Недействительный токен'
            });
        }

        // Обновляем статус токена и создаем запись об удалении
        const updates = {};
        updates[`verification_tokens/${uid}/status`] = 'completed';
        updates[`deletion_requests/${uid}`] = {
            user_id: uid,
            requested_at: new Date().toISOString(),
            status: 'pending',
            token: token
        };

        await db.ref().update(updates);

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

