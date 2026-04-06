# -*- coding: utf-8 -*-
"""
УМНЫЙ ЮРИСТ AI — Профессиональное юридическое приложение
Версия: 2.4 (полностью исправлено)
"""

from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os
import re
from openai import OpenAI

# Загружаем переменные окружения
load_dotenv()

# Инициализация Flask
app = Flask(__name__, static_folder='static', template_folder='templates')

# Инициализация OpenAI клиента
client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY'),
    base_url=os.getenv('OPENAI_BASE_URL', 'https://openrouter.ai/api/v1')
)

# Системный промпт
LEGAL_SYSTEM_PROMPT = """
ТЫ — ПРОФЕССИОНАЛЬНЫЙ ИИ-ЮРИСТ.

ПРАВИЛА:
1. НИКОГДА не используй символы: ### ## # ** * __ _ ~ ``` >
2. Пиши обычным текстом, выделяй ЗАГЛАВНЫМИ буквами
3. Ответ должен быть ПОЛНЫМ и ЗАВЕРШЕННЫМ

СТРУКТУРА ОТВЕТА:

НОРМАТИВНАЯ БАЗА:
- Указать статьи законов с расшифровкой
- Название закона, номер, дата

ПРАКТИЧЕСКОЕ ПРИМЕНЕНИЕ:
- Как норма применяется в ситуации
- Условия и исключения

ПОШАГОВЫЙ АЛГОРИТМ:
- Последовательность шагов
- Сроки для каждого этапа

НЕОБХОДИМЫЕ ДОКУМЕНТЫ:
- Список документов
- Куда и как подавать

РИСКИ И ПРЕДУПРЕЖДЕНИЯ:
- На что обратить внимание
- Типичные ошибки

ДОПОЛНИТЕЛЬНЫЕ РЕКОМЕНДАЦИИ:
- Альтернативные пути
- Когда обратиться к юристу

В КОНЦЕ ДОБАВИТЬ:
"Данная консультация носит информационный характер. Для представления интересов в суде рекомендуется обратиться к квалифицированному юристу."
"""


def format_legal_response(text):
    """Форматирует ответ для HTML."""
    if not text:
        return "<p class='error'>Пустой ответ</p>"
    
    # Очистка markdown
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\*\*', '', text)
    text = re.sub(r'__', '', text)
    text = re.sub(r'~~', '', text)
    text = re.sub(r'^>\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Выделение заголовков
    text = re.sub(
        r'^([А-ЯЁ][А-ЯЁ\s\-]{5,}):',
        r'<h4 class="section-title">\1:</h4>',
        text,
        flags=re.MULTILINE
    )
    
    # Выделение статей
    text = re.sub(
        r'(Статья\s+\d+[^.\n]{0,50})',
        r'<span class="legal-ref">\1</span>',
        text
    )
    
    # Выделение заглавных слов
    text = re.sub(r'\b([А-ЯЁ]{4,})\b', r'<strong>\1</strong>', text)
    
    # Форматирование строк
    lines = text.split('\n')
    formatted_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith('-'):
            formatted_lines.append('<div class="list-item">' + line + '</div>')
        elif line.startswith('<h4') or line.startswith('<span'):
            formatted_lines.append(line)
        elif len(line) > 0:
            formatted_lines.append('<p>' + line + '</p>')
    
    return '\n'.join(formatted_lines).strip()


def ask_legal_ai(question, jurisdiction, category=None):
    """Отправляет запрос к ИИ."""
    try:
        model = os.getenv('AI_MODEL', 'qwen/qwen-2.5-72b-instruct')
        max_tokens = int(os.getenv('TOKEN_LIMIT', 1500))
        
        prompt = "ЮРИСДИКЦИЯ: " + jurisdiction + "\nКАТЕГОРИЯ: " + (category or 'Вопрос') + "\nВОПРОС: " + question
        
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": LEGAL_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.2,
            extra_headers={
                "HTTP-Referer": "https://localhost",
                "X-Title": "umnyj-yurist"
            }
        )
        
        raw_text = response.choices[0].message.content
        
        if not raw_text or len(raw_text.strip()) == 0:
            return "<p class='error'>Пустой ответ от ИИ</p>"
        
        return format_legal_response(raw_text)
        
    except Exception as e:
        return "<p class='error'>Ошибка: " + str(e) + "</p>"


@app.route('/')
def index():
    """Главная страница."""
    return render_template('index.html')


@app.route('/api/ask', methods=['POST'])
def ask_question():
    """API для вопросов."""
    try:
        data = request.get_json(silent=True)
        
        # ИСПРАВЛЕНО: проверка data
        if not data:
            return jsonify({'error': 'Неверный формат данных'}), 400
        
        question = data.get('question', '').strip()
        jurisdiction = data.get('jurisdiction', 'RU')
        category = data.get('category', 'Вопрос')
        
        if not question:
            return jsonify({'error': 'Вопрос пуст'}), 400
        
        if len(question) < 5:
            return jsonify({'error': 'Вопрос слишком короткий'}), 400
        
        if len(question) > 2000:
            return jsonify({'error': 'Вопрос слишком длинный'}), 400
        
        ai_answer = ask_legal_ai(question, jurisdiction, category)
        
        return jsonify({'success': True, 'answer': ai_answer})
        
    except Exception as e:
        print("SERVER ERROR: " + str(e))
        return jsonify({'error': 'Ошибка сервера: ' + str(e)}), 500


@app.route('/health')
def health():
    """Проверка сервера."""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    debug_mode = os.getenv('DEBUG', 'True').lower() == 'true'
    port = int(os.getenv('PORT', 5000))
    
    print("Запуск сервера на порту " + str(port))
    print("Debug: " + str(debug_mode))
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)