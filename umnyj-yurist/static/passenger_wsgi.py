# passenger_wsgi.py
import sys
import os

# Добавляем путь к папке с проектом
INTERP = os.path.expanduser("~/virtualenv/umnyj-yurist/3.10/bin/python")
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

sys.path.insert(0, os.path.dirname(__file__))

# Импортируем приложение из app.py
from app import app as application

# Если нужно использовать virtualenv (Hoster.by часто его создает автоматически)
# Если возникают ошибки, строки ниже можно убрать, обычно хостер сам рулит
try:
    import imp
    imp.reload(sys.modules['app'])
except Exception:
    pass