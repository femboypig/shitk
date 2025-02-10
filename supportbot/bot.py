import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes, ConversationHandler
import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime

# Initialize Firebase Admin
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# States for conversation
AWAITING_NAME, AWAITING_EMAIL = range(2)

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send welcome message and request user data if not registered."""
    user_id = str(update.effective_user.id)
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        await update.message.reply_text(
            "👋 Добро пожаловать в службу поддержки IDENTIFY!\n\n"
            "Для начала работы, пожалуйста, представьтесь.\n"
            "Как вас зовут?"
        )
        return AWAITING_NAME
    
    return await show_main_menu(update, context)

async def handle_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle user's name input."""
    context.user_data['name'] = update.message.text
    await update.message.reply_text(
        "Спасибо! Теперь, пожалуйста, укажите ваш email для связи:"
    )
    return AWAITING_EMAIL

async def handle_email(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle user's email input and complete registration."""
    email = update.message.text
    if not '@' in email or not '.' in email:
        await update.message.reply_text(
            "❌ Пожалуйста, введите корректный email адрес."
        )
        return AWAITING_EMAIL

    user_id = str(update.effective_user.id)
    user_ref = db.collection('users').document(user_id)
    user_ref.set({
        'name': context.user_data['name'],
        'email': email,
        'telegram_id': user_id,
        'registered_at': datetime.now(),
        'last_active': datetime.now()
    })

    await update.message.reply_text(
        f"✅ Спасибо за регистрацию, {context.user_data['name']}!"
    )
    return await show_main_menu(update, context)

async def show_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show main menu."""
    keyboard = [
        [InlineKeyboardButton("❓ Часто задаваемые вопросы", callback_data='faq')],
        [InlineKeyboardButton("🗑 Удалить данные", callback_data='delete_data')],
        [InlineKeyboardButton("📝 Техническая поддержка", callback_data='support')],
        [InlineKeyboardButton("📋 Политика конфиденциальности", callback_data='privacy')],
        [InlineKeyboardButton("📜 Условия использования", callback_data='terms')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.callback_query:
        await update.callback_query.edit_message_text(
            "Выберите нужный раздел:",
            reply_markup=reply_markup
        )
    else:
        await update.message.reply_text(
            "Выберите нужный раздел:",
            reply_markup=reply_markup
        )
    return ConversationHandler.END

async def handle_faq(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle FAQ section."""
    keyboard = [
        [InlineKeyboardButton("Как начать использовать IDENTIFY?", callback_data='faq_start')],
        [InlineKeyboardButton("Как удалить аккаунт?", callback_data='faq_delete')],
        [InlineKeyboardButton("Проблемы с входом", callback_data='faq_login')],
        [InlineKeyboardButton("« Назад", callback_data='back_to_main')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.callback_query.edit_message_text(
        "Выберите интересующий вас вопрос:",
        reply_markup=reply_markup
    )

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks with error handling."""
    query = update.callback_query
    await query.answer()
    
    try:
        if query.data == 'faq':
            await handle_faq(update, context)
        elif query.data == 'faq_start':
            await query.edit_message_text(
                "🚀 Как начать использовать IDENTIFY:\n\n"
                "1. Зарегистрируйтесь на сайте\n"
                "2. Подтвердите свой email\n"
                "3. Настройте свой профиль\n\n"
                "Готово! Теперь вы можете использовать все функции IDENTIFY.",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("« Назад", callback_data='faq')]])
            )
        elif query.data == 'faq_delete':
            await query.edit_message_text(
                "🗑 Как удалить аккаунт:\n\n"
                "1. Перейдите в настройки профиля\n"
                "2. Выберите 'Удалить аккаунт'\n"
                "3. Подтвердите действие\n\n"
                "⚠️ Это действие необратимо!",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("« Назад", callback_data='faq')]])
            )
        elif query.data == 'faq_login':
            await query.edit_message_text(
                "🔑 Проблемы со входом:\n\n"
                "1. Проверьте правильность email\n"
                "2. Убедитесь, что пароль верный\n"
                "3. Попробуйте сбросить пароль\n\n"
                "Если проблема остается, обратитесь в поддержку.",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("« Назад", callback_data='faq')]])
            )
        elif query.data == 'delete_data':
            await delete_data(update, context)
        elif query.data == 'support':
            await handle_support(update, context)
        elif query.data == 'confirm_delete':
            user_id = str(update.effective_user.id)
            db.collection('deletion_requests').document(user_id).set({
                'user_id': user_id,
                'requested_at': datetime.now(),
                'status': 'pending'
            })
            await query.edit_message_text(
                "✅ Запрос на удаление данных принят.\n"
                "Все ваши данные будут удалены в течение 24 часов."
            )
        elif query.data == 'back_to_main':
            await show_main_menu(update, context)
        elif query.data in ['privacy', 'terms']:
            urls = {
                'privacy': 'https://shitk-p.vercel.app/privacy',
                'terms': 'https://shitk-p.vercel.app/terms'
            }

            await query.edit_message_text(
                f"Вы можете ознакомиться с документом по ссылке:\n"
                f"🔗 <a href='{urls[query.data]}'>{urls[query.data]}</a>",
                parse_mode='HTML'
            )
    except Exception as e:
        logger.error(f"Error in callback handler: {e}")
        await query.edit_message_text(
            "❌ Произошла ошибка. Пожалуйста, попробуйте позже или обратитесь в поддержку."
        )

async def delete_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle data deletion request."""
    user_id = str(update.effective_user.id)
    
    # Генерируем уникальный токен для верификации
    verification_token = os.urandom(16).hex()
    
    # Сохраняем токен в Firebase
    db.collection('verification_tokens').document(user_id).set({
        'token': verification_token,
        'created_at': datetime.now(),
        'status': 'pending'
    })
    
    verification_url = f"https://shitk-p.vercel.app/verify?token={verification_token}&uid={user_id}"
    
    keyboard = [
        [InlineKeyboardButton("Подтвердить на сайте", url=verification_url)],
        [InlineKeyboardButton("Отмена", callback_data='back_to_main')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.callback_query.edit_message_text(
        "🔐 Для удаления данных требуется подтверждение через сайт:\n\n"
        "1. Нажмите кнопку «Подтвердить на сайте»\n"
        "2. Войдите в свой аккаунт IDENTIFY\n"
        "3. Подтвердите удаление данных\n\n"
        "⚠️ Ссылка действительна в течение 30 минут.",
        reply_markup=reply_markup
    )

async def handle_support(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle support request."""
    await update.callback_query.edit_message_text(
        "📝 Опишите вашу проблему или вопрос в следующем сообщении.\n\n"
        "Мы постараемся ответить как можно скорее!"
    )
    context.user_data['awaiting_support_message'] = True

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle user messages."""
    if context.user_data.get('awaiting_support_message'):
        user_id = str(update.effective_user.id)
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()

        if not user_doc.exists:
            await update.message.reply_text(
                "❌ Ошибка: Пожалуйста, сначала зарегистрируйтесь через команду /start"
            )
            return

        user_data = user_doc.to_dict()
        
        # Create support ticket without await
        ticket_ref = db.collection('support_tickets').document()
        ticket_ref.set({
            'user_id': user_id,
            'user_name': user_data.get('name'),
            'email': user_data.get('email'),
            'message': update.message.text,
            'created_at': datetime.now(),
            'status': 'open'
        })
        
        await update.message.reply_text(
            "✅ Ваше обращение принято!\n"
            "Мы рассмотрим его и ответим в ближайшее время на указанный email."
        )
        context.user_data['awaiting_support_message'] = False
    else:
        await start(update, context)

def main():
    """Start the bot."""
    application = Application.builder().token('7623000540:AAHNX-KCHWXq6XIV54ruYlDAWKydvtsUc3g').build()


    # Add conversation handler for registration
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            AWAITING_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_name)],
            AWAITING_EMAIL: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_email)],
        },
        fallbacks=[CommandHandler('cancel', start)]
    )

    application.add_handler(conv_handler)
    application.add_handler(CallbackQueryHandler(handle_callback))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    application.run_polling()

if __name__ == '__main__':
    main()
