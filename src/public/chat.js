// Firebase конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyD0ksObwMb6BBZN3WQBYDTLEKNHdG3fr3U",
    authDomain: "shitk-p.firebaseapp.com",
    databaseURL: "https://shitk-p-default-rtdb.firebaseio.com",
    projectId: "shitk-p",
    storageBucket: "shitk-p.firebasestorage.app",
    messagingSenderId: "860946224153",
    appId: "1:860946224153:web:cc1d2b7df27e434f9e0688"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const messagesRef = database.ref('messages');

// Проверяем авторизацию
const userData = JSON.parse(localStorage.getItem('vk_user') || '{}');
if (!userData.user_id) {
    window.location.href = '/?redirect=/chat';
}

function addMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    const isOwnMessage = message.userId === userData.user_id;
    
    messageElement.className = `message ${isOwnMessage ? 'own-message' : ''}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString();
    
    messageElement.innerHTML = `
        <img src="${message.avatar}" alt="" class="message-avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${message.author}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${message.text}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (text && userData.user_id) {
        const message = {
            author: userData.first_name,
            avatar: userData.photo_url || 'https://vk.com/images/camera_50.png',
            text: text,
            timestamp: Date.now(),
            userId: userData.user_id,
            messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        messagesRef.push(message);
        input.value = '';
    }
}

// Слушаем новые сообщения
messagesRef.on('child_added', (snapshot) => {
    const message = snapshot.val();
    addMessage(message);
});

// Обработка Enter для отправки
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Загружаем последние 50 сообщений
messagesRef.limitToLast(50).once('value', (snapshot) => {
    const messages = snapshot.val();
    if (messages) {
        Object.values(messages).forEach(addMessage);
    }
}); 