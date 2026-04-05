# app.py
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os
import re
import pytesseract
from PIL import Image
from openai import OpenAI
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')

client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY'),
    base_url=os.getenv('OPENAI_BASE_URL', 'https://openrouter.ai/api/v1')
)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

SYSTEM_PROMPT = """
Ты — ИИ-ЮРИСТ.
ПРАВИЛА ОТВЕТА:
1. НИКОГДА не используй символы разметки: **, #, -, |, ```, __, >, [].
2. Используй ТОЛЬКО обычные буквы, цифры и знаки препинания.
3. Для выделения важного используй ЗАГЛАВНЫЕ БУКВЫ.
4. Структурируй ответ отступами (пробелами), а не символами.
5. Если пользователь пишет "привет" — поздоровайся и спроси о проблеме.
6. В КОНЦЕ КАЖДОГО ответа добавь:
   "⚠️ Внимание: Данный сервис носит исключительно вспомогательный информационный характер. Для принятия юридических решений обращайтесь к квалифицированному юристу."
"""

def get_text_from_file(filepath, ext):
    """Извлекает текст из файла изображения или текстового файла"""
    if ext in ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff']:
        try:
            # Tesseract: быстро и мало памяти!
            # lang='rus+eng' — распознаёт русский и английский
            text = pytesseract.image_to_string(Image.open(filepath), lang='rus+eng')
            return text.strip() if text.strip() else "Текст не распознан."
        except Exception as e:
            return f"Ошибка OCR: {e}"
    elif ext == '.txt':
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            return f"Ошибка чтения: {e}"
    return "[Файл загружен, но текст не извлечен]"

def format_ai_response(text):
    """Превращает сырой текст ИИ в красивый HTML"""
    # 1. Убираем ВСЕ markdown символы полностью
    text = re.sub(r'[*#\-_`~>\[\]]', '', text)
    text = re.sub(r'\*\*', '', text)
    text = re.sub(r'###', '', text)
    text = re.sub(r'##', '', text)
    text = re.sub(r'```', '', text)

    # 2. Заменяем CAPS LOCK на жирный
    text = re.sub(r'\b([A-ZА-ЯЁ]{4,})\b', r'<b>\1</b>', text)

    # 3. Делаем абзацы красивыми
    text = text.replace('\n', '<br>')

    # 4. Убираем лишние пробелы
    text = re.sub(r' {2,}', ' ', text)

    return text.strip()

def ask_ai(text, jurisdiction, mode="analyze"):
    try:
        model = os.getenv('AI_MODEL', 'qwen/qwen3.6-plus:free')
        max_tokens = int(os.getenv('TOKEN_LIMIT', 1000))

        prompt = f"Юрисдикция: {jurisdiction}\nРежим: {mode}\nВвод: {text}"

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.1,
            extra_headers={"HTTP-Referer": "https://localhost", "X-Title": "umnyj-yurist"}
        )

        raw_text = response.choices[0].message.content
        return format_ai_response(raw_text)

    except Exception as e:
        return f"⚠️ Ошибка AI: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_doc():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Файл не выбран'}), 400
        file = request.files['file']
        jurisdiction = request.form.get('jurisdiction', 'RU')
        if file.filename == '':
            return jsonify({'error': 'Пустое имя файла'}), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        ext = os.path.splitext(filename)[1].lower()
        recognized_text = get_text_from_file(filepath, ext)
        ai_answer = ask_ai(recognized_text, jurisdiction, "analyze")

        return jsonify({'success': True, 'recognized_text': recognized_text, 'ai_analysis': ai_answer})
    except Exception as e:
        print(f"🔥 SERVER ERROR: {e}")
        return jsonify({'error': f'Ошибка сервера: {str(e)}'}), 500

@app.route('/api/ask', methods=['POST'])
def ask_question():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Неверный формат'}), 400

        question = data.get('question', '')
        jurisdiction = data.get('jurisdiction', 'RU')
        if not question:
            return jsonify({'error': 'Вопрос пуст'}), 400

        ai_answer = ask_ai(question, jurisdiction, "question")
        return jsonify({'success': True, 'answer': ai_answer})
    except Exception as e:
        print(f"🔥 SERVER ERROR: {e}")
        return jsonify({'error': f'Ошибка сервера: {str(e)}'}), 500

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    # debug=False для безопасности на хостинге
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=False)
