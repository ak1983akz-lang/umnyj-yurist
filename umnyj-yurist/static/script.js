/* ============================================
   УМНЫЙ ЮРИСТ AI — JavaScript функционал
   Версия: 2.0
   Полная совместимость с мобильными устройствами
   ============================================ */

// Глобальные переменные
let lastAnswer = '';
let rulesAccepted = false;

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Показываем модальное окно с предупреждением
    showWarningModal();
    
    // Инициализируем меню категорий
    initCategoryMenus();
    
    // Восстанавливаем состояние принятия правил из localStorage
    checkRulesAccepted();
    
    console.log('УМНЫЙ ЮРИСТ AI — готов к работе');
});

// ============================================
// МОДАЛЬНОЕ ОКНО С ПРЕДУПРЕЖДЕНИЕМ
// ============================================

// Показываем модальное окно
function showWarningModal() {
    const modal = document.getElementById('warningModal');
    if (modal && !rulesAccepted) {
        modal.style.display = 'flex';
        // Блокируем прокрутку фона
        document.body.style.overflow = 'hidden';
    }
}

// Пользователь принял правила
function acceptRules() {
    rulesAccepted = true;
    
    // Сохраняем в localStorage чтобы не показывать повторно
    try {
        localStorage.setItem('umnyjJurist_rulesAccepted', 'true');
    } catch (e) {
        console.log('LocalStorage недоступен');
    }
    
    // Скрываем модальное окно
    const modal = document.getElementById('warningModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // Разблокируем интерфейс
    enableInterface();
}

// Проверяем приняты ли правила ранее
function checkRulesAccepted() {
    try {
        const accepted = localStorage.getItem('umnyjJurist_rulesAccepted');
        if (accepted === 'true') {
            rulesAccepted = true;
            // Скрываем модальное окно если есть
            const modal = document.getElementById('warningModal');
            if (modal) {
                modal.style.display = 'none';
            }
            enableInterface();
        }
    } catch (e) {
        console.log('LocalStorage недоступен');
    }
}

// Разблокируем интерфейс после принятия правил
function enableInterface() {
    // Можно добавить дополнительную логику если нужно
    console.log('Интерфейс разблокирован');
}

// ============================================
// СКРЫВАЕМЫЙ БЛОК С ПРАВИЛАМИ
// ============================================

// Переключение видимости блока с правилами
function toggleRules() {
    const content = document.getElementById('rulesContent');
    const icon = document.getElementById('rulesToggleIcon');
    
    if (!content) return;
    
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        icon.textContent = '−';
    } else {
        content.style.display = 'none';
        icon.textContent = '+';
    }
}

// ============================================
// МЕНЮ КАТЕГОРИЙ И ВОПРОСОВ
// ============================================

// База вопросов: 15 вопросов на категорию, по алфавиту
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

// Инициализация меню категорий
function initCategoryMenus() {
    const toggles = document.querySelectorAll('.category-toggle');
    
    toggles.forEach(function(toggle) {
        toggle.addEventListener('click', function() {
            const categoryItem = this.closest('.category-item');
            const category = categoryItem.dataset.category;
            const questionsList = document.getElementById(category + '-list');
            const arrow = this.querySelector('.arrow');
            
            if (!questionsList) return;
            
            // Проверяем текущее состояние
            const isVisible = questionsList.style.display === 'block';
            
            // Закрываем все остальные списки
            document.querySelectorAll('.questions-list').forEach(function(list) {
                list.style.display = 'none';
            });
            document.querySelectorAll('.arrow').forEach(function(a) {
                a.textContent = '▼';
            });
            
            // Открываем/закрываем текущий
            if (!isVisible) {
                questionsList.style.display = 'block';
                if (arrow) arrow.textContent = '▲';
                
                // Загружаем вопросы если ещё не загружены
                if (questionsList.children.length === 0) {
                    loadQuestions(category, questionsList);
                }
            }
        });
    });
}

// Загрузка вопросов в список
function loadQuestions(category, container) {
    const questions = QUESTIONS_DB[category] || [];
    
    // Сортируем по алфавиту на всякий случай
    questions.sort();
    
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

// Выбор вопроса из списка
function selectQuestion(question, category) {
    const input = document.getElementById('questionInput');
    if (input) {
        input.value = question;
        input.focus();
    }
    
    // Отправляем вопрос
    askCustomQuestion(category);
    
    // Плавная прокрутка к ответу
    const responseSection = document.getElementById('responseSection');
    if (responseSection) {
        setTimeout(function() {
            responseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// ============================================
// ОТПРАВКА ВОПРОСА И ПОЛУЧЕНИЕ ОТВЕТА
// ============================================

// Отправка собственного вопроса
function askCustomQuestion(category) {
    const questionInput = document.getElementById('questionInput');
    const jurisdiction = document.getElementById('jurisdiction');
    const responseSection = document.getElementById('responseSection');
    const response = document.getElementById('response');
    const askBtn = document.getElementById('askBtn');
    
    if (!questionInput || !jurisdiction || !responseSection || !response) {
        alert('Ошибка: элементы интерфейса не найдены');
        return;
    }
    
    const question = questionInput.value.trim();
    const jurisdictionValue = jurisdiction.value;
    
    // Валидация
    if (!question || question.length < 5) {
        alert('Пожалуйста, изложите вопрос более подробно (минимум 5 символов)');
        questionInput.focus();
        return;
    }
    
    // Блокируем интерфейс
    if (askBtn) {
        askBtn.disabled = true;
        askBtn.textContent = 'ФОРМИРУЮ ОТВЕТ...';
    }
    
    responseSection.style.display = 'block';
    response.innerHTML = '<div class="loading">Анализ нормативной базы и формирование консультации...</div>';
    
    const feedbackSection = document.getElementById('feedbackSection');
    if (feedbackSection) {
        feedbackSection.style.display = 'none';
    }
    
    lastAnswer = '';
    
    // Отправка запроса на сервер
    fetch('/api/ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            question: question,
            jurisdiction: jurisdictionValue,
            category: category || 'Пользовательский вопрос'
        })
    })
    .then(function(res) {
        if (!res.ok) {
            throw new Error('Ошибка сервера: ' + res.status);
        }
        return res.json();
    })
    .then(function(data) {
        if (data && data.success) {
            lastAnswer = data.answer;
            response.innerHTML = '<div class="legal-answer">' + data.answer + '</div>';
            if (feedbackSection) {
                feedbackSection.style.display = 'flex';
            }
        } else {
            var errorMsg = data && data.error ? data.error : 'Неизвестная ошибка';
            response.innerHTML = '<p class="error">Ошибка: ' + errorMsg + '</p>';
        }
    })
    .catch(function(err) {
        console.error('Ошибка запроса:', err);
        response.innerHTML = '<p class="error">Не удалось получить ответ. Проверьте подключение к интернету и попробуйте снова.</p>';
    })
    .finally(function() {
        if (askBtn) {
            askBtn.disabled = false;
            askBtn.textContent = 'ПОЛУЧИТЬ КОНСУЛЬТАЦИЮ';
        }
    });
}

// Очистка поля и ответа
function clearCustom() {
    const input = document.getElementById('questionInput');
    const responseSection = document.getElementById('responseSection');
    const response = document.getElementById('response');
    const feedbackSection = document.getElementById('feedbackSection');
    
    if (input) {
        input.value = '';
        input.focus();
    }
    if (response) {
        response.innerHTML = '';
    }
    if (responseSection) {
        responseSection.style.display = 'none';
    }
    if (feedbackSection) {
        feedbackSection.style.display = 'none';
    }
    lastAnswer = '';
}

// ============================================
// КОПИРОВАНИЕ И ОЦЕНКА ОТВЕТА
// ============================================

// Копирование ответа в буфер обмена
function copyAnswer() {
    if (!lastAnswer) {
        alert('Нет ответа для копирования');
        return;
    }
    
    // Удаляем HTML теги для чистого текста
    var temp = document.createElement('div');
    temp.innerHTML = lastAnswer;
    var plainText = temp.innerText || temp.textContent;
    
    // Копируем
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(plainText).then(function() {
            showCopySuccess();
        }).catch(function() {
            fallbackCopy(plainText);
        });
    } else {
        fallbackCopy(plainText);
    }
}

// Резервный метод копирования для старых браузеров
function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
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

// Показываем успех копирования
function showCopySuccess() {
    var btn = document.querySelector('.copy-btn');
    if (btn) {
        var originalText = btn.textContent;
        btn.textContent = 'СКОПИРОВАНО';
        setTimeout(function() {
            btn.textContent = originalText;
        }, 2000);
    }
}

// Переключение секции оценки
function toggleFeedback() {
    var fb = document.getElementById('feedbackSection');
    if (fb) {
        fb.style.display = (fb.style.display === 'none' || !fb.style.display) ? 'flex' : 'none';
    }
}

// Отправка оценки
function sendFeedback(type) {
    // Здесь можно добавить отправку на сервер для аналитики
    console.log('Feedback:', type);
    
    var msg = type === 'good' ? 'Спасибо за положительную оценку!' : 'Спасибо, мы учтём ваши замечания';
    alert(msg);
    
    var fb = document.getElementById('feedbackSection');
    if (fb) {
        fb.style.display = 'none';
    }
}

// ============================================
// УТИЛИТЫ ДЛЯ МОБИЛЬНЫХ УСТРОЙСТВ
// ============================================

// Предотвращаем зум на двойном тапе (iOS)
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// Быстрый клик на мобильных
var lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    var now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Обработка клавиш: Ctrl+Enter отправляет вопрос
document.addEventListener('keydown', function(event) {
    var input = document.getElementById('questionInput');
    var askBtn = document.getElementById('askBtn');
    
    if (input && askBtn && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!askBtn.disabled) {
            askCustomQuestion();
        }
    }
});

// Авто-ресайз textarea
document.addEventListener('input', function(event) {
    if (event.target && event.target.tagName === 'TEXTAREA') {
        event.target.style.height = 'auto';
        event.target.style.height = event.target.scrollHeight + 'px';
    }
});

// Проверка здоровья сервера при загрузке
window.addEventListener('load', function() {
    fetch('/health')
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data && data.status === 'ok') {
                console.log('Сервер подключён');
            }
        })
        .catch(function() {
            console.warn('Сервер может быть недоступен');
        });
});