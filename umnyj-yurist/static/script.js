/* ============================================
   УМНЫЙ ЮРИСТ AI — JavaScript функционал
   Версия: 2.1 (с интеграцией ВК и улучшенной логикой)
   ============================================ */

// Глобальные переменные
let lastAnswer = '';
let rulesAccepted = false;
const CURRENT_DATE = new Date().toLocaleDateString('ru-RU'); // Текущая дата для бейджа

// Официальные источники права по юрисдикциям
const LEGAL_SOURCES = {
    'RU': { name: 'КонсультантПлюс', url: 'https://www.consultant.ru' },
    'BY': { name: 'Pravo.by', url: 'https://pravo.by' },
    'KZ': { name: 'Adilet', url: 'https://adilet.zan.kz' }
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // 1. Показываем модальное окно с предупреждением
    showWarningModal();
    
    // 2. Инициализируем меню категорий
    initCategoryMenus();
    
    // 3. Восстанавливаем состояние принятия правил
    checkRulesAccepted();
    
    // 4. Обновляем дату в бейдже актуальности
    updateDateBadge();
    
    // 5. Настраиваем аналитику для кнопки ВК
    initVKAnalytics();
    
    console.log('УМНЫЙ ЮРИСТ AI v2.1 — готов к работе');
});

// ============================================
// МОДАЛЬНОЕ ОКНО С ПРЕДУПРЕЖДЕНИЕМ
// ============================================

function showWarningModal() {
    const modal = document.getElementById('warningModal');
    if (modal && !rulesAccepted) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function acceptRules() {
    rulesAccepted = true;
    try {
        localStorage.setItem('umnyjJurist_rulesAccepted', 'true');
    } catch (e) {
        console.warn('LocalStorage недоступен');
    }
    
    const modal = document.getElementById('warningModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    enableInterface();
}

function checkRulesAccepted() {
    try {
        const accepted = localStorage.getItem('umnyjJurist_rulesAccepted');
        if (accepted === 'true') {
            rulesAccepted = true;
            const modal = document.getElementById('warningModal');
            if (modal) modal.style.display = 'none';
            enableInterface();
        }
    } catch (e) {
        console.warn('LocalStorage недоступен');
    }
}

function enableInterface() {
    console.log('Интерфейс разблокирован');
}

// ============================================
// СКРЫВАЕМЫЙ БЛОК С ПРАВИЛАМИ
// ============================================

function toggleRules() {
    const content = document.getElementById('rulesContent');
    const icon = document.getElementById('rulesToggleIcon');
    const header = document.querySelector('.collapsible-header');
    
    if (!content) return;
    
    const isVisible = content.style.display === 'block';
    
    if (!isVisible) {
        content.style.display = 'block';
        if (icon) icon.textContent = '−';
        if (header) header.setAttribute('aria-expanded', 'true');
    } else {
        content.style.display = 'none';
        if (icon) icon.textContent = '+';
        if (header) header.setAttribute('aria-expanded', 'false');
    }
}

// ============================================
// МЕНЮ КАТЕГОРИЙ И ВОПРОСОВ
// ============================================

const QUESTIONS_DB = {
    "vozvrat": [
        "Возврат денежных средств за товар ненадлежащего качества порядок",
        "Возврат товара если продавец отказывается принимать обратно",
        "Возврат товара если он был в употреблении",
        "Возврат товара если он не подошел по размеру или цвету",
        "Возврат товара если он не соответствует описанию на сайте",
        "Возврат товара если истек срок возврата",
        "Возврат товара если продавец ликвидирован",
        "Возврат товара если продавец требует оплату за доставку",
        "Возврат товара купленного в интернет-магазине сроки и условия",
        "Возврат товара надлежащего качества в течение 14 дней процедура",
        "Возврат технически сложного товара основания и ограничения",
        "Документы необходимые для оформления возврата товара",
        "Как вернуть товар если он был доставлен с повреждениями",
        "Как вернуть товар если утерян кассовый чек",
        "Как вернуть товар купленный по акции или со скидкой"
    ],
    "dtp": [
        "Взыскание морального вреда с виновника ДТП процедура",
        "Взыскание ущерба с виновника ДТП если у него нет страховки",
        "Виновник ДТП скрылся с места происшествия действия потерпевшего",
        "Действия при ДТП если вы не виновны оформление документов",
        "Действия при ДТП если есть пострадавшие пошаговый алгоритм",
        "Европротокол при ДТП условия применения и ограничения",
        "Как получить выплату по КАСКО при тотальной гибели автомобиля",
        "Как получить выплату по ОСАГО если страховая затягивает сроки",
        "Как оспорить постановление ГИБДД о нарушении ПДД",
        "Какие документы нужны для обращения в страховую после ДТП",
        "Какие сроки обращения за страховой выплатой по ОСАГО",
        "Можно ли взыскать упущенную выгоду при ДТП с коммерческим транспортом",
        "Можно ли отказаться от независимой экспертизы страховой компании",
        "Страховая занижает сумму выплаты по ОСАГО порядок оспаривания",
        "Что делать если виновник ДТП не вписан в полис ОСАГО"
    ],
    "pretenziya": [
        "Вручение претензии лично под роспись порядок оформления",
        "Документы которые необходимо приложить к досудебной претензии",
        "Как направить претензию если продавец игнорирует почтовые отправления",
        "Как правильно составить досудебную претензию структура и содержание",
        "Как подтвердить факт направления претензии в суде",
        "Какие реквизиты обязательно указывать в претензии",
        "Какие сроки установлены для рассмотрения претензии по закону",
        "Можно ли направить претензию по электронной почте юридическая сила",
        "Можно ли отозвать претензию после её направления",
        "Нужно ли нотариально заверять копию претензии",
        "Обязательно ли направлять претензию перед обращением в суд",
        "Претензия к государственному органу особенности составления",
        "Претензия при оказании услуг отличия от претензии к продавцу товара",
        "Способы направления претензии которые имеют юридическую силу",
        "Что делать если претензия возвращена с пометкой адресат выбыл"
    ],
    "uslugi": [
        "Взыскание неустойки за просрочку оказания услуги расчет и порядок",
        "Возврат аванса за неоказанную услугу основания и процедура",
        "Как доказать ненадлежащее качество оказанной услуги",
        "Как расторгнуть договор на оказание услуг в одностороннем порядке",
        "Как составить претензию к исполнителю услуги образец",
        "Какие сроки устранения недостатков оказанной услуги установлены законом",
        "Можно ли требовать безвозмездного устранения недостатков услуги",
        "Можно ли требовать снижения цены за некачественную услугу",
        "Можно ли отказаться от услуги после начала её оказания",
        "Ответственность исполнителя за нарушение сроков оказания услуги",
        "Права заказчика если исполнитель привлек субподрядчика без согласия",
        "Права заказчика при изменении исполнителем условий договора",
        "Что делать если исполнитель требует доплату не предусмотренную договором",
        "Что делать если услуга оказана частично а оплачена полностью",
        "Что делать если исполнитель отказывается выдавать документы об оказании услуги"
    ],
    "arenda": [
        "Возврат обеспечительного платежа при выезде из арендованного помещения",
        "Досрочное расторжение договора аренды по инициативе арендатора условия",
        "Досрочное расторжение договора аренды по инициативе арендодателя основания",
        "Как зафиксировать состояние помещения при передаче в аренду",
        "Как оспорить одностороннее повышение арендной платы",
        "Какие расходы по содержанию помещения несет арендатор",
        "Какие расходы по содержанию помещения несет арендодатель",
        "Можно ли сдать арендованное помещение в субаренду без согласия собственника",
        "Можно ли требовать снижения арендной платы при ухудшении состояния помещения",
        "Обязанности арендатора по текущему ремонту помещения",
        "Обязанности арендодателя по капитальному ремонту помещения",
        "Права арендатора при продаже арендованного помещения новым собственником",
        "Продление договора аренды преимущественное право арендатора",
        "Что делать если арендодатель не возвращает помещение после окончания договора",
        "Что делать если арендодатель препятствует доступу в арендованное помещение"
    ],
    "trud": [
        "Взыскание компенсации за задержку заработной платы порядок расчета",
        "Восстановление на работе после незаконного увольнения процедура",
        "Как правильно написать заявление на увольнение по собственному желанию",
        "Как оформить увольнение в связи с сокращением штата",
        "Как получить трудовую книжку при увольнении если работодатель уклоняется",
        "Как рассчитать компенсацию за неиспользованный отпуск при увольнении",
        "Можно ли уволиться без отработки двух недель основания",
        "Можно ли требовать оплаты сверхурочной работы если она не оформлена",
        "Можно ли требовать перевода на другую должность по состоянию здоровья",
        "Обжалование дисциплинарного взыскания порядок и сроки",
        "Ответственность работодателя за задержку выплаты заработной платы",
        "Права работника при изменении условий трудового договора",
        "Права работника при ликвидации организации",
        "Что делать если работодатель не выплачивает расчет при увольнении",
        "Что делать если работодатель принуждает к увольнению по собственному желанию"
    ]
};

function initCategoryMenus() {
    const toggles = document.querySelectorAll('.category-toggle');
    toggles.forEach(function(toggle) {
        toggle.addEventListener('click', function() {
            const categoryItem = this.closest('.category-item');
            const category = categoryItem.dataset.category;
            const questionsList = document.getElementById(category + '-list');
            const arrow = this.querySelector('.arrow');
            
            if (!questionsList) return;
            
            const isVisible = questionsList.style.display === 'block';
            
            // Закрываем все остальные
            document.querySelectorAll('.questions-list').forEach(list => list.style.display = 'none');
            document.querySelectorAll('.arrow').forEach(a => a.textContent = '▼');
            
            if (!isVisible) {
                questionsList.style.display = 'block';
                if (arrow) arrow.textContent = '▲';
                
                if (questionsList.children.length === 0) {
                    loadQuestions(category, questionsList);
                }
            }
        });
    });
}

function loadQuestions(category, container) {
    const questions = QUESTIONS_DB[category] || [];
    questions.sort(); // Сортировка по алфавиту
    
    questions.forEach(function(question, index) {
        const btn = document.createElement('button');
        btn.className = 'question-item';
        btn.textContent = (index + 1) + '. ' + question;
        btn.onclick = function() {
            selectQuestion(question, category);
        };
        container.appendChild(btn);
    });
}

function selectQuestion(question, category) {
    const input = document.getElementById('questionInput');
    if (input) {
        input.value = question;
        input.focus();
    }
    askCustomQuestion(category);
    
    const responseSection = document.getElementById('responseSection');
    if (responseSection) {
        setTimeout(() => {
            responseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// ============================================
// ОТПРАВКА ВОПРОСА И ПОЛУЧЕНИЕ ОТВЕТА
// ============================================

function askCustomQuestion(category) {
    const questionInput = document.getElementById('questionInput');
    const jurisdictionSelect = document.getElementById('jurisdiction');
    const responseSection = document.getElementById('responseSection');
    const responseDiv = document.getElementById('response');
    const askBtn = document.getElementById('askBtn');
    
    if (!questionInput || !jurisdictionSelect || !responseSection || !responseDiv) {
        alert('Ошибка интерфейса. Перезагрузите страницу.');
        return;
    }
    
    const question = questionInput.value.trim();
    const jurisdiction = jurisdictionSelect.value;
    
    if (!question || question.length < 5) {
        alert('Пожалуйста, опишите вопрос подробнее (минимум 5 символов).');
        questionInput.focus();
        return;
    }
    
    // Блокировка кнопки
    if (askBtn) {
        askBtn.disabled = true;
        askBtn.textContent = 'АНАЛИЗИРУЮ ЗАКОНЫ...';
    }
    
    responseSection.style.display = 'block';
    responseDiv.innerHTML = '<div class="loading">⏳ Анализ нормативной базы и формирование консультации...</div>';
    
    const feedbackSection = document.getElementById('feedbackSection');
    if (feedbackSection) feedbackSection.style.display = 'none';
    
    lastAnswer = '';
    
    // Отправка запроса
    fetch('/api/ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            question: question,
            jurisdiction: jurisdiction,
            category: category || 'Пользовательский вопрос'
        })
    })
    .then(res => {
        if (!res.ok) throw new Error('Ошибка сервера: ' + res.status);
        return res.json();
    })
    .then(data => {
        if (data && data.success) {
            lastAnswer = data.answer;
            // Добавляем ссылку на официальный источник
            const sourceLink = getSourceLinkHTML(jurisdiction);
            responseDiv.innerHTML = '<div class="legal-answer">' + data.answer + '</div>' + sourceLink;
            
            if (feedbackSection) feedbackSection.style.display = 'flex';
            
            // Аналитика успешного ответа
            if (typeof ym === 'function') {
                ym(108448723, 'reachGoal', 'answer_received');
            }
        } else {
            const errorMsg = data && data.error ? data.error : 'Неизвестная ошибка';
            responseDiv.innerHTML = '<p class="error">❌ Ошибка: ' + errorMsg + '</p>';
        }
    })
    .catch(err => {
        console.error('Ошибка запроса:', err);
        responseDiv.innerHTML = '<p class="error">⚠️ Не удалось получить ответ. Проверьте интернет и попробуйте снова.</p>';
    })
    .finally(() => {
        if (askBtn) {
            askBtn.disabled = false;
            askBtn.textContent = 'ПОЛУЧИТЬ КОНСУЛЬТАЦИЮ';
        }
    });
}

// Генерация HTML ссылки на источник
function getSourceLinkHTML(jurisdiction) {
    const source = LEGAL_SOURCES[jurisdiction] || LEGAL_SOURCES['RU'];
    return `<p class="source-note">🔗 Проверьте актуальность нормы в официальном источнике: <a href="${source.url}" target="_blank" class="legal-source-link" rel="noopener">${source.name}</a></p>`;
}

function clearCustom() {
    const input = document.getElementById('questionInput');
    const responseSection = document.getElementById('responseSection');
    const responseDiv = document.getElementById('response');
    const feedbackSection = document.getElementById('feedbackSection');
    
    if (input) {
        input.value = '';
        input.focus();
    }
    if (responseDiv) responseDiv.innerHTML = '';
    if (responseSection) responseSection.style.display = 'none';
    if (feedbackSection) feedbackSection.style.display = 'none';
    lastAnswer = '';
}

// ============================================
// КОПИРОВАНИЕ И ОЦЕНКА ОТВЕТА
// ============================================

function copyAnswer() {
    if (!lastAnswer) {
        alert('Нет ответа для копирования');
        return;
    }
    
    // Очищаем от HTML тегов для буфера обмена
    const temp = document.createElement('div');
    temp.innerHTML = lastAnswer;
    const plainText = temp.innerText || temp.textContent;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(plainText).then(showCopySuccess).catch(() => fallbackCopy(plainText));
    } else {
        fallbackCopy(plainText);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (err) {
        alert('Не удалось скопировать. Выделите текст вручную.');
    }
    document.body.removeChild(textarea);
}

function showCopySuccess() {
    const btn = document.querySelector('.copy-btn');
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✅ СКОПИРОВАНО';
        setTimeout(() => { btn.textContent = originalText; }, 2000);
    }
}

function toggleFeedback() {
    const fb = document.getElementById('feedbackSection');
    if (fb) {
        fb.style.display = (fb.style.display === 'none' || !fb.style.display) ? 'flex' : 'none';
    }
}

function sendFeedback(type) {
    // Здесь можно добавить отправку на сервер
    console.log('Feedback:', type);
    
    const msg = type === 'good' ? 'Спасибо! Рады, что помогли.' : 'Спасибо за отзыв. Мы становимся лучше.';
    alert(msg);
    
    // Аналитика фидбека
    if (typeof ym === 'function') {
        ym(108448723, 'reachGoal', type === 'good' ? 'feedback_good' : 'feedback_bad');
    }
    
    const fb = document.getElementById('feedbackSection');
    if (fb) fb.style.display = 'none';
}

// ============================================
// УТИЛИТЫ И ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

// Обновление даты в бейдже
function updateDateBadge() {
    const badge = document.getElementById('lastUpdate');
    if (badge) {
        badge.textContent = CURRENT_DATE;
    }
}

// Аналитика клика по ВК
function initVKAnalytics() {
    const vkLink = document.querySelector('.vk-link');
    if (vkLink) {
        vkLink.addEventListener('click', function() {
            if (typeof ym === 'function') {
                ym(108448723, 'reachGoal', 'vk_click');
            }
            console.log('Переход в группу ВКонтакте');
        });
    }
}

// Предотвращение зума на iOS
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) event.preventDefault();
}, { passive: false });

// Быстрый клик на мобильных
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) event.preventDefault();
    lastTouchEnd = now;
}, false);

// Горячая клавиша Ctrl+Enter
document.addEventListener('keydown', function(event) {
    const input = document.getElementById('questionInput');
    const askBtn = document.getElementById('askBtn');
    
    if (input && askBtn && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!askBtn.disabled) askCustomQuestion();
    }
});

// Авто-ресайз textarea
document.addEventListener('input', function(event) {
    if (event.target && event.target.tagName === 'TEXTAREA') {
        event.target.style.height = 'auto';
        event.target.style.height = event.target.scrollHeight + 'px';
    }
});

// Health-check при загрузке
window.addEventListener('load', function() {
    fetch('/health')
        .then(res => res.json())
        .then(data => {
            if (data && data.status === 'ok') console.log('Сервер подключён');
        })
        .catch(() => console.warn('Сервер может быть недоступен'));
});
