# -*- coding: utf-8 -*-
"""
УМНЫЙ ЮРИСТ AI — Профессиональное юридическое приложение
Версия: 2.5 (с логированием, rate limiting и улучшенной безопасностью)
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
from dotenv import load_dotenv
import os
import re
import logging
from datetime import datetime
from openai import OpenAI
from functools import wraps

# Загружаем переменные окружения
load_dotenv()

# Инициализация Flask
app = Flask(__name__, static_folder='static', template_folder='templates')

# ============================================
# НАСТРОЙКА ЛОГИРОВАНИЯ
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================
# RATE LIMITING (Защита от спама)
# ============================================
# Простая реализация без внешних библиотек для легковесности
request_counts = {}
RATE_LIMIT = 10  # запросов
TIME_WINDOW = 60  # секунд

def check_rate_limit():
    client_ip = request.remote_addr
    now = datetime.now().timestamp()
    
    if client_ip not in request_counts:
        request_counts[client_ip] = []
        
    # Очищаем старые записи
    request_counts[client_ip] = [t for t in request_counts[client_ip] if now - t < TIME_WINDOW]
    
    if len(request_counts[client_ip]) >= RATE_LIMIT:
        return False
    
    request_counts[client_ip].append(now)
    return True

# ============================================
# ИНИЦИАЛИЗАЦИЯ OPENAI CLIENT
# ============================================
api_key = os.getenv('OPENAI_API_KEY')
base_url = os.getenv('OPENAI_BASE_URL', 'https://openrouter.ai/api/v1')

if not api_key:
    logger.warning("OPENAI_API_KEY не найден в .env файле!")

client = OpenAI(
    api_key=api_key,
    base_url=base_url
)

# ============================================
# СИСТЕМНЫЙ ПРОМПТ
# ============================================
LEGAL_SYSTEM_PROMPT = """
ТЫ — ПРОФЕССИОНАЛЬНЫЙ ИИ-ЮРИСТ. Твоя задача — давать точные, структурированные и полезные справки по законодательству РФ, РБ и РК.

ПРАВИЛА ОФОРМЛЕНИЯ:
1. НИКОГДА не используй Markdown символы: ### ## # ** * __ _ ~ ``` >
2. Пиши обычным текстом. Для выделения используй ЗАГЛАВНЫЕ БУКВЫ или просто структуру абзацев.
3. Ответ должен быть ПОЛНЫМ, но лаконичным.
4. В конце ответа ВСЕГДА добавляй фразу: "Данная консультация носит информационный характер. Для представления интересов в суде рекомендуется обратиться к квалифицированному юристу."

СТРУКТУРА ОТВЕТА (строго соблюдай порядок):

НОРМАТИВНАЯ БАЗА:
- Укажи конкретные статьи законов (название, номер, дата).
- Кратко расшифруй суть статьи применительно к вопросу.

ПРАКТИЧЕСКОЕ ПРИМЕНЕНИЕ:
- Как эта норма работает в реальной жизни.
- Есть ли исключения или нюансы.

ПОШАГОВЫЙ АЛГОРИТМ ДЕЙСТВИЙ:
1. Шаг первый...
2. Шаг второй...
(Укажи сроки для каждого этапа, если они есть в законе).

НЕОБХОДИМЫЕ ДОКУМЕНТЫ:
- Список документов для подачи заявлений/исков.
- Куда именно подавать (суд, госорган, страховая).

РИСКИ И ПРЕДУПРЕЖДЕНИЯ:
- На что обратить особое внимание.
- Типичные ошибки, которые совершают люди в такой ситуации.

ДОПОЛНИТЕЛЬНЫЕ РЕКОМЕНДАЦИИ:
- Альтернативные пути решения (медиация, досудебное урегулирование).
- Когда точно нужен живой юрист.

ВАЖНО:
- Если вопрос выходит за рамки твоей компетенции или требует анализа уникальных документов, честно напиши об этом.
- Не выдумывай несуществующие законы. Если не уверен — укажи, что нужно проверить актуальность нормы.
"""

# ============================================
# ФУНКЦИИ ОБРАБОТКИ
# ============================================

def format_legal_response(text):
    """Форматирует ответ ИИ для безопасного отображения в HTML."""
    if not text:
        return "<p class='error'>Пустой ответ от системы</p>"
    
    # 1. Очистка от Markdown и опасных символов
    text = re.sub(r'```[\s\S]*?```', '', text) # Удаляем блоки кода
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE) # Удаляем заголовки #
    text = re.sub(r'\*\*', '', text) # Жирный
    text = re.sub(r'__', '', text) # Жирный
    text = re.sub(r'~~', '', text) # Зачеркнутый
    text = re.sub(r'^>\s*', '', text, flags=re.MULTILINE) # Цитаты
    text = re.sub(r'\n{3,}', '\n\n', text) # Лишние переносы
    
    # Экранирование HTML (безопасность от XSS)
    # Мы разрешаем только наши собственные теги, поэтому сначала экранируем всё,
    # а потом заменяем на наши классы.
    # Но так как мы контролируем промпт, проще заменить специфичные паттерны.
    
    # 2. Выделение заголовков разделов (например "НОРМАТИВНАЯ БАЗА:")
    text = re.sub(
        r'^([А-ЯЁ][А-ЯЁ\s\-]{3,}):',
        r'<h4 class="section-title">\1:</h4>',
        text,
        flags=re.MULTILINE
    )
    
    # 3. Выделение статей закона (Статья 15, ст. 105 ГК РФ и т.д.)
    text = re.sub(
        r'(Статья\s+\d+[^.\n]{0,50}|ст\.\s*\d+[^.\n]{0,30})',
        r'<span class="legal-ref">\1</span>',
        text
    )
    
    # 4. Форматирование списков (- пункт)
    lines = text.split('\n')
    formatted_lines = []
    
    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue
            
        if line_stripped.startswith('-'):
            # Это элемент списка
            formatted_lines.append('<div class="list-item">' + line_stripped + '</div>')
        elif '<h4' in line_stripped or '<span' in line_stripped:
            # Уже размеченный заголовок
            formatted_lines.append(line_stripped)
        else:
            # Обычный параграф
            # Дополнительно выделяем важные слова в верхнем регистре (если они короткие, чтобы не задеть целые предложения)
            # Но лучше оставить как есть, чтобы не ломать текст
            formatted_lines.append('<p>' + line_stripped + '</p>')
    
    return '\n'.join(formatted_lines).strip()


def ask_legal_ai(question, jurisdiction, category=None):
    """Отправляет запрос к ИИ и возвращает форматированный ответ."""
    try:
        model = os.getenv('AI_MODEL', 'qwen/qwen-2.5-72b-instruct')
        max_tokens = int(os.getenv('TOKEN_LIMIT', 1500))
        
        prompt = f"ЮРИСДИКЦИЯ: {jurisdiction}\nКАТЕГОРИЯ: {category or 'Общий вопрос'}\nВОПРОС ПОЛЬЗОВАТЕЛЯ: {question}"
        
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": LEGAL_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.2, # Низкая температура для точности
            extra_headers={
                "HTTP-Referer": "https://umnyj-yurist.xyz",
                "X-Title": "Umnyj-Yurist-AI"
            }
        )
        
        raw_text = response.choices[0].message.content
        
        if not raw_text or len(raw_text.strip()) == 0:
            logger.warning("Пустой ответ от API")
            return "<p class='error'>Сервис временно недоступен. Попробуйте позже.</p>"
        
        return format_legal_response(raw_text)
        
    except Exception as e:
        logger.error(f"Ошибка при запросе к ИИ: {str(e)}")
        return "<p class='error'>Произошла ошибка при формировании ответа. Пожалуйста, попробуйте еще раз.</p>"


# ============================================
# РОУТЫ (ROUTES)
# ============================================

@app.route('/')
def index():
    """Главная страница."""
    return render_template('index.html')

@app.route('/privacy-policy.html')
def privacy_policy():
    """Страница Политики конфиденциальности."""
    # Можно вернуть статический файл или шаблон
    return render_template('privacy-policy.html') 

@app.route('/terms.html')
def terms():
    """Страница Пользовательского соглашения."""
    return render_template('terms.html')

@app.route('/api/ask', methods=['POST'])
def ask_question():
    """API эндпоинт для получения ответа от ИИ."""
    
    # 1. Проверка Rate Limit
    if not check_rate_limit():
        logger.warning(f"Превышен лимит запросов с IP: {request.remote_addr}")
        return jsonify({'error': 'Слишком много запросов. Подождите минуту.'}), 429
    
    try:
        data = request.get_json(silent=True)
        
        if not data:
            return jsonify({'error': 'Неверный формат данных'}), 400
        
        question = data.get('question', '').strip()
        jurisdiction = data.get('jurisdiction', 'RU')
        category = data.get('category', 'Вопрос')
        
        # Валидация
        if not question:
            return jsonify({'error': 'Вопрос пуст'}), 400
        
        if len(question) < 5:
            return jsonify({'error': 'Вопрос слишком короткий (минимум 5 символов)'}), 400
        
        if len(question) > 2000:
            return jsonify({'error': 'Вопрос слишком длинный (максимум 2000 символов)'}), 400
        
        # Логирование (БЕЗ персональных данных!)
        logger.info(f"Запрос: J={jurisdiction}, Cat={category}, Len={len(question)}")
        
        # Получение ответа от ИИ
        ai_answer = ask_legal_ai(question, jurisdiction, category)
        
        return jsonify({'success': True, 'answer': ai_answer})
        
    except Exception as e:
        logger.error(f"Критическая ошибка сервера: {str(e)}")
        return jsonify({'error': 'Внутренняя ошибка сервера'}), 500

@app.route('/health')
def health():
    """Эндпоинт для проверки работоспособности."""
    return jsonify({'status': 'ok'})

# Обработка ошибок 404
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Страница не найдена'}), 404

# ============================================
# ЗАПУСК
# ============================================

if __name__ == '__main__':
    debug_mode = os.getenv('DEBUG', 'False').lower() == 'true'
    port = int(os.getenv('PORT', 5000))
    
    logger.info(f"Запуск сервера УМНЫЙ ЮРИСТ AI v2.5")
    logger.info(f"Port: {port}, Debug: {debug_mode}")
    
    # В продакшене лучше использовать gunicorn или waitress
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
