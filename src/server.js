const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');

// Firebase Admin SDK configuration
const serviceAccount = {
    type: "service_account",
    project_id: "shitk-p",
    private_key_id: "aa7456f7c9871057118a0ddf060f74bcab433452",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDFWKYtm08Yxwbc\nk3YQv9EgXWCvKx0vlAwHjh2nvJj+1bCyCd51jeWXam/P3KY1e7VTgKfrEGG7WS4g\nCU8BExoEVaQMMekumJd/1EJQCB6mlALk+aSXU5agugcCxfyxFORXPh0kwcjfMh+E\nHyfM61a4k2G8Qd/vDnUPsL7wr+jaVgJZCU0IWhuI+0cfJBVC6zktSWT7pRqd9e6X\nWpxYhU/uEFkYGYEM+fK+lU3YO1OkukW3d7K/eLuvQKIw1ABSB7WPCbgasMj4qru8\n8SRW/Kev744HPftqdmwEV/Iw4VB0lrxiMzmZd+buQCkAwETWItyp4QTqS+RUtpAk\nkJYN9W/JAgMBAAECggEAIKCHRPCxqJE14gpNPE1XqBKtdU3a/ZlBTeR3TwVK2Y2p\n23LvQR83JLatCsAvs0BN2ng3CubX9E9furM0nnhdK6H0b9cL9toKk3tGhWXPmiR2\nwArtZTQlf1LnmClJ8wWsZNIjo7FC4nKD1xEG6wXDqNt7uVITfGS3AjjrW0QHau//\n1ATSLwTZSojA+Te8ys7Z0kKtqsMvfgTBEd7HzZBHPCISWPBkaz27d4TrqzXIn/wD\ng77OrgCuTZCPQbDYlRquOjYveIqohXbfP46R/zz0uXNUNvOhfV2RI4USKFhAweIo\ncWbxuDyh2ATZTRTE+9iwcxrUkdKE5XuWAdIM2d1lqwKBgQDzhdSaVoQ6oBUowy9L\nJt7p8ppqbveTn2SiumEuIAoiw5q3yIideboRK0H+POHee1YavxiozT+hYPEd80AT\nHfkzvS4fx/BMrE9lW2oqnbBTcK012Z3vNO/Rrq6Pt88CX3kuVaFxKkEc7DzLplLU\ntbYWZupCGPkQFmOy3HRwkNJiJwKBgQDPdSTnFj2Xvo4Cnz6EP4EqGN2gpqu3wVdB\nTZI9j6BnuRRFxMTO5w3Ws4QAVP1zd04ewsczAZFokVXLL5GUwPbmas7I9SC1QGt/\nPsHB8xEU+Az9xYmDWN/BI7i11oqHBRAkle0mEynnGMLcJeA+LUsgezhzfLfJ+kJi\ni/f3QtgEjwKBgQDUYW9dev6vMlXByxg/7pKSbeaF1GlO8cAOu4VteLvePcF9bwLW\ndAb2WkeftvE121Lo2Khk7zwDPkyK1k6XXZisqtzDEthbxhsoRmV87TGOU8J8KGI4\n8G4G7NWIucFsTF+fLUczLqrC0rTi1xd+M0uulerP4n+0rBIfN2zFj0gsGQKBgQDL\ntAvzOJxsBrjsjC7Xrn+GtXnRSDburNKflaqV9hScJFhqlWZmfuvQuN5RcSKZITm8\n7KaqR8zer25dn6zEMqF86L15B3EBaGrlO9sHNUO9oj8nY7K+HSNAQ3IYYrwNDgSm\n1+xPaZvIhkC36B0DEHhnQXbRt1HD6o8KssNdr+3qswKBgDm+VdEsNRVNEUmFgTfB\nIw1tUVPzbeghLuk0Ou6/wInQE5rLQPwqx9IR37o/KJlwYPLtii2AyvVReX7znx6e\n40ODTsDxCZX4q1kzOfeO3lL0hcwz2jlknS70Ocvechg2lg9hRnD1VFW5WAqK1rT5\ns66twzOXlrR3W4PF3eRpC2hC\n-----END PRIVATE KEY-----\n",
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

            if (!tokenData) {
                return res.status(400).json({
                    success: false,
                    error: 'Недействительный токен верификации'
                });
            }

            if (tokenData.token !== token) {
                return res.status(400).json({
                    success: false,
                    error: 'Неверный токен верификации'
                });
            }

            // Получаем данные пользователя
            const userSnapshot = await db.ref(`users/${uid}`).once('value');
            const userData = userSnapshot.val();

            res.json({
                success: true,
                message: 'Токен верифицирован успешно',
                userData: userData
            });

        } catch (dbError) {
            console.error('Database operation error:', dbError);
            res.status(500).json({
                success: false,
                error: 'Ошибка при проверке токена'
            });
        }

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
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

