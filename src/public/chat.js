// Проверяем авторизацию
const userData = JSON.parse(localStorage.getItem('vk_user') || '{}');
if (!userData.user_id) {
    window.location.href = '/?redirect=/chat';
}

if (userData.uid) {
    firebase.auth().signInWithCustomToken(userData.uid).catch(function(error) {
        console.error('Error signing in with custom token:', error);
    });
}

const database = firebase.database();
const messagesRef = database.ref('messages');
const chatsRef = database.ref('chats');
const usersRef = database.ref('users');

// Глобальная переменная для текущего чата
let currentChatId = null;
let searchTimeout;

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

// Функция открытия чата
function openChat(chatId) {
    currentChatId = chatId;
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = ''; // Очищаем контейнер сообщений
    
    // Обновляем заголовок чата
    const chatHeader = document.querySelector('.chat-header h1');
    const selectedChat = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
    chatHeader.textContent = selectedChat ? selectedChat.querySelector('.chat-name').textContent : 'Чат';

    // Загружаем сообщения для выбранного чата
    messagesRef.child(chatId)
        .limitToLast(50)
        .on('child_added', (snapshot) => {
            const message = snapshot.val();
            addMessage(message);
        });

    // Помечаем выбранный чат как активный
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    selectedChat?.classList.add('active');
}

// Обновляем функцию sendMessage
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (text && userData.user_id && currentChatId) {
        const message = {
            author: userData.first_name,
            avatar: userData.photo_url || 'https://vk.com/images/camera_50.png',
            text: text,
            timestamp: Date.now(),
            userId: userData.user_id,
            chatId: currentChatId
        };
        
        // Отправляем сообщение в конкретный чат
        messagesRef.child(currentChatId).push(message);
        
        // Обновляем последнее сообщение в чате
        chatsRef.child(currentChatId).update({
            lastMessage: text,
            lastMessageTime: Date.now()
        });

        input.value = '';
    }
}

// Загружаем последние 50 сообщений
messagesRef.limitToLast(50).once('value', (snapshot) => {
    const messages = snapshot.val();
    if (messages) {
        Object.values(messages).forEach(addMessage);
    }
});

// Загрузка чатов
function loadChats() {
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = ''; // Очищаем список

    chatsRef.orderByChild('participants/' + userData.user_id)
        .equalTo(true)
        .on('value', (snapshot) => {
            const chats = snapshot.val();
            if (chats) {
                Object.entries(chats).forEach(([chatId, chat]) => {
                    const chatElement = createChatElement(chatId, chat);
                    chatList.appendChild(chatElement);
                });
            }
        });
}

// Создание элемента чата
function createChatElement(chatId, chat) {
    const div = document.createElement('div');
    div.className = 'chat-item';
    div.dataset.chatId = chatId;
    
    const lastMessageTime = chat.lastMessageTime ? 
        new Date(chat.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
    
    div.innerHTML = `
        <img src="${chat.photo || 'https://vk.com/images/camera_50.png'}" class="chat-avatar">
        <div class="chat-info">
            <div class="chat-name">${chat.name}</div>
            <div class="chat-last-message">${chat.lastMessage || 'Нет сообщений'}</div>
        </div>
        <div class="chat-time">${lastMessageTime}</div>
    `;
    
    div.onclick = () => openChat(chatId);
    return div;
}

// Загрузка данных пользователя
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('vk_user') || '{}');
    if (user) {
        document.getElementById('sidebarAvatar').src = user.photo_url || 'https://vk.com/images/camera_50.png';
        document.getElementById('sidebarName').textContent = user.first_name + ' ' + user.last_name;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadChats();
});

// Функция поиска пользователей
function searchUsers(query) {
    if (!query || query.length < 2) {
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = '';
        return;
    }

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<div class="loading">Поиск...</div>';
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        // Получаем всех пользователей и фильтруем локально
        // Это временное решение, пока не настроим индексы в Firebase
        firebase.database().ref('users')
            .once('value')
            .then((snapshot) => {
                searchResults.innerHTML = '';
                const users = snapshot.val();
                
                if (!users) {
                    searchResults.innerHTML = '<div class="no-results">Пользователи не найдены</div>';
                    return;
                }

                const filteredUsers = Object.entries(users).filter(([userId, user]) => {
                    const searchStr = query.toLowerCase();
                    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
                    const email = (user.email || '').toLowerCase();
                    
                    return userId !== userData.user_id && ( // Исключаем текущего пользователя
                        fullName.includes(searchStr) ||
                        email.includes(searchStr)
                    );
                });

                if (filteredUsers.length === 0) {
                    searchResults.innerHTML = '<div class="no-results">Пользователи не найдены</div>';
                    return;
                }

                filteredUsers.forEach(([userId, user]) => {
                    const userElement = document.createElement('div');
                    userElement.className = 'search-result-item';
                    userElement.innerHTML = `
                        <img src="${user.photo_url || 'https://vk.com/images/camera_50.png'}" class="user-avatar">
                        <div class="user-info">
                            <div class="user-name">${user.first_name} ${user.last_name}</div>
                            <div class="user-email">${user.email || ''}</div>
                        </div>
                        <button class="start-chat-btn">Написать</button>
                    `;
                    
                    userElement.querySelector('.start-chat-btn').onclick = () => startNewChat(userId, user);
                    searchResults.appendChild(userElement);
                });
            })
            .catch(error => {
                console.error('Error searching users:', error);
                searchResults.innerHTML = '<div class="error">Ошибка при поиске пользователей</div>';
            });
    }, 300);
}

// Функция создания нового чата
async function startNewChat(userId, user) {
    // Проверяем, существует ли уже чат с этим пользователем
    const existingChat = await findExistingChat(userId);
    
    if (existingChat) {
        openChat(existingChat);
        return;
    }

    // Создаем новый чат
    const newChatRef = chatsRef.push();
    const chatId = newChatRef.key;
    
    const chatData = {
        name: `${user.name}`,
        participants: {
            [userData.user_id]: true,
            [userId]: true
        },
        created_at: Date.now(),
        last_message: null
    };

    await newChatRef.set(chatData);
    openChat(chatId);
}

// Функция поиска существующего чата
async function findExistingChat(userId) {
    const snapshot = await chatsRef
        .orderByChild(`participants/${userId}`)
        .equalTo(true)
        .once('value');
    
    const chats = snapshot.val();
    if (!chats) return null;

    // Находим чат, где есть оба пользователя
    const chatId = Object.entries(chats).find(([_, chat]) => 
        chat.participants[userData.user_id] && chat.participants[userId]
    )?.[0];

    return chatId;
} 