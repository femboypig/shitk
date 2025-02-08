// Используем Firebase через глобальный объект firebase
const database = firebase.database();
const messagesRef = database.ref('messages');

// Слушаем новые сообщения
messagesRef.on('child_added', (snapshot) => {
    const message = snapshot.val();
    addMessage(message);
});

function addMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    messageElement.innerHTML = `
        <img src="${message.avatar}" alt="" class="message-avatar">
        <div class="message-content">
            <div class="message-author">${message.author}</div>
            <div class="message-text">${message.text}</div>
            <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (text) {
        const userData = JSON.parse(localStorage.getItem('vk_user') || '{}');
        const message = {
            author: userData.first_name || 'Гость',
            avatar: userData.photo_url || 'https://vk.com/images/camera_50.png',
            text: text,
            timestamp: Date.now(),
            userId: userData.user_id || 'anonymous'
        };
        
        // Отправляем сообщение в Firebase
        messagesRef.push(message);
        input.value = '';
    }
}

// Обработка Enter для отправки
document.getElementById('chatInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Загружаем последние 50 сообщений при входе
messagesRef.limitToLast(50).once('value', (snapshot) => {
    const messages = snapshot.val();
    if (messages) {
        Object.values(messages).forEach(addMessage);
    }
}); 