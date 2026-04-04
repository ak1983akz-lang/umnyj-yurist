// static/script.js
let jurAnalyze = null, jurQuestion = null, file = null;

window.addEventListener('load', () => {
    if (window.vkBridge) vkBridge.send('VKWebAppInit').catch(() => {});
});

function switchMode(mode) {
    document.getElementById('modeAnalyze').classList.toggle('active', mode === 'analyze');
    document.getElementById('modeQuestion').classList.toggle('active', mode === 'question');
    document.getElementById('analyzeMode').style.display = mode === 'analyze' ? 'block' : 'none';
    document.getElementById('questionMode').style.display = mode === 'question' ? 'block' : 'none';
    hideResults();
}

function selectJurisdiction(j) {
    jurAnalyze = j;
    document.querySelectorAll('#analyzeMode .flag-card-small').forEach(el => el.classList.remove('active'));
    document.getElementById(`flag-${j}`).classList.add('active');
    checkAnalyze();
}

document.getElementById('fileInput').addEventListener('change', e => {
    if (e.target.files[0]) {
        file = e.target.files[0];
        document.getElementById('fileInfo').textContent = `📎 ${file.name} (${(file.size/1024).toFixed(0)} KB)`;
        checkAnalyze();
    }
});

// ✅ ИСПРАВЛЕНО: кнопка активна если есть файл
function checkAnalyze() {
    document.getElementById('analyzeBtn').disabled = !file;
}

document.getElementById('analyzeBtn').addEventListener('click', async () => {
    // 🔔 ПРОВЕРКА ЮРИСДИКЦИИ ПЕРЕД АНАЛИЗОМ
    if (!jurAnalyze) {
        alert('⚠️ Внимание!\n\nПрежде чем анализировать документ, выберите юрисдикцию (флаг страны):\n\n• Беларусь — для документов по законодательству РБ\n• Россия — для документов по законодательству РФ\n\nЭто нужно для правильного применения законов.');
        return;
    }
    
    if (!file) {
        alert('⚠️ Сначала загрузите документ');
        return;
    }
    
    showLoader('Загрузка файла и анализ...');
    hideResults();

    const fd = new FormData();
    fd.append('file', file);
    fd.append('jurisdiction', jurAnalyze);

    try {
        console.log('📤 Отправка файла на сервер...');
        
        const res = await fetch('/api/analyze', { 
            method: 'POST', 
            body: fd 
        });
        
        console.log('📥 Ответ сервера:', res.status);

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Ошибка сервера ${res.status}: ${errorText}`);
        }
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            throw new Error(`Сервер вернул не JSON: ${text.substring(0, 200)}`);
        }

        const data = await res.json();
        
        if (data.recognized_text) {
            document.getElementById('extractedText').textContent = data.recognized_text;
            document.getElementById('textBlock').style.display = 'block';
        }
        document.getElementById('aiResult').innerHTML = data.ai_analysis;
        document.getElementById('resultBox').style.display = 'block';
        
        // ✅ ДОБАВЛЯЕМ КНОПКУ СКАЧАТЬ
        addDownloadButton(data.ai_analysis, jurAnalyze);
        
    } catch (e) {
        console.error('❌ Ошибка:', e);
        let errorMsg = e.message;
        
        if (e.message.includes('Failed to fetch')) {
            errorMsg = '❌ Не удалось соединиться с сервером!\n\nПроверьте:\n1. Запущен ли python app.py?\n2. Открыт ли http://127.0.0.1:5000?\n3. Нет ли ошибок в терминале?';
        }
        
        showError(errorMsg);
    } finally { 
        hideLoader(); 
    }
});

// ✅ ФУНКЦИЯ ДОБАВЛЕНИЯ КНОПКИ СКАЧИВАНИЯ
function addDownloadButton(content, jurisdiction) {
    const resultBox = document.getElementById('resultBox');
    
    // Проверяем, есть ли уже кнопка
    if (document.getElementById('downloadBtn')) return;
    
    const downloadBtn = document.createElement('button');
    downloadBtn.id = 'downloadBtn';
    downloadBtn.className = 'btn-download';
    downloadBtn.innerHTML = '💾 Скачать заключение';
    downloadBtn.onclick = () => downloadConclusion(content, jurisdiction);
    
    resultBox.appendChild(downloadBtn);
}

// ✅ ФУНКЦИЯ СКАЧИВАНИЯ
function downloadConclusion(content, jurisdiction) {
    const jurName = jurisdiction === 'RU' ? 'Россия' : 'Беларусь';
    const date = new Date().toISOString().slice(0,10);
    const filename = `Заключение_ИИ-юрист_${jurName}_${date}.txt`;
    
    // Убираем HTML теги для текстового файла
    const textContent = content
        .replace(/<br>/g, '\n')
        .replace(/<b>/g, '')
        .replace(/<\/b>/g, '')
        .replace(/<[^>]*>/g, '');
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function selectJurisdictionQ(j) {
    jurQuestion = j;
    document.querySelectorAll('#questionMode .flag-card-small').forEach(el => el.classList.remove('active'));
    document.getElementById(`qflag-${j}`).classList.add('active');
    checkAsk();
}

document.getElementById('questionInput').addEventListener('input', checkAsk);

function checkAsk() {
    const q = document.getElementById('questionInput').value.trim();
    document.getElementById('askBtn').disabled = !q;
}

document.getElementById('askBtn').addEventListener('click', async () => {
    const q = document.getElementById('questionInput').value.trim();
    
    if (!jurQuestion) {
        alert('⚠️ Внимание!\n\nПрежде чем задать вопрос, выберите юрисдикцию (флаг страны):\n• Беларусь — для вопросов по законодательству РБ\n• Россия — для вопросов по законодательству РФ\n\nЭто нужно для правильного применения законов.');
        return;
    }
    
    if (!q) {
        alert('⚠️ Введите вопрос');
        return;
    }
    
    showLoader('Генерация ответа...');
    hideResults();

    try {
        const res = await fetch('/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q, jurisdiction: jurQuestion })
        });

        if (!res.ok) {
            throw new Error(`Ошибка ${res.status}`);
        }

        const data = await res.json();
        document.getElementById('questionResult').innerHTML = data.answer;
        document.getElementById('questionResultBox').style.display = 'block';
        
        // ✅ ДОБАВЛЯЕМ КНОПКУ СКАЧАТЬ ДЛЯ ВОПРОСА
        addDownloadButton(data.answer, jurQuestion);
        
    } catch (e) {
        showError(e.message);
    } finally { 
        hideLoader(); 
    }
});

function clearAll() {
    jurAnalyze = null; file = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').textContent = '';
    document.querySelectorAll('.flag-card-small').forEach(el => el.classList.remove('active'));
    hideResults();
    checkAnalyze();
}

function clearQuestion() {
    jurQuestion = null;
    document.getElementById('questionInput').value = '';
    document.querySelectorAll('#questionMode .flag-card-small').forEach(el => el.classList.remove('active'));
    document.getElementById('questionResultBox').style.display = 'none';
    checkAsk();
}

function showLoader(txt) {
    document.getElementById('loaderText').textContent = txt;
    document.getElementById('loader').style.display = 'block';
    document.getElementById('analyzeBtn').disabled = true;
    document.getElementById('askBtn').disabled = true;
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
    checkAnalyze();
    checkAsk();
}

function hideResults() {
    ['textBlock', 'resultBox', 'questionResultBox', 'errorBox'].forEach(id => 
        document.getElementById(id).style.display = 'none'
    );
}

function showError(msg) {
    document.getElementById('errorText').textContent = msg;
    document.getElementById('errorBox').style.display = 'block';
}