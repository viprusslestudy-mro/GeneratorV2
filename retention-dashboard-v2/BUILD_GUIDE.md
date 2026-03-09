# 🚀 Шпаргалка по сборке и развертыванию (React + Google Apps Script)

Отличный вопрос! Это основа работы с архитектурой React + Google Apps Script. Давай разберём, чтобы больше не было путаницы.

В твоём проекте есть две отдельные части:

- **Фронтенд (React)** — папка `client-react/`
- **Бэкенд (Google Apps Script / GAS)** — папка `apps-script/`

## Когда нужен ТОЛЬКО clasp push?

Если ты менял файлы **ТОЛЬКО** в папке `apps-script/`.  
Это файлы, которые работают внутри серверов Google:

- `apps-script/src/Main.js` (генерация HTML)
- `apps-script/src/Menu.js` (меню в таблице)
- `apps-script/src/api/RetentionAPI.js` (сбор данных из таблиц, отдача JSON)
- `apps-script/src/TranslationsManager.js` (скрипты форматирования)
- `apps-script/src/modelstore/...` (чтение листов)

**Почему?**  
Потому что эти файлы не нужно "собирать" (компилировать). `clasp push` просто берет текстовые .js файлы из папки `apps-script/src/` и заливает их в твой проект Google Apps Script.

## Когда нужен npm run build А ЗАТЕМ clasp push?

Если ты поменял **ХОТЯ БЫ ОДИН ФАЙЛ** в папке `client-react/`.  
Это файлы интерфейса:

- `client-react/src/App.jsx` (любые компоненты React)
- `client-react/src/**/*.module.css` (любые стили)
- `client-react/src/store/retentionStore.js` (состояние)
- `client-react/src/api/retentionApi.js` (запросы к GAS)

**Почему?**  
Браузер не понимает файлы `.jsx` и современные импорты из `node_modules` (например, Zustand, Recharts).  
Команда `npm run build`:

- Берёт весь твой React-код.
- Сжимает его, переводит в понятный браузеру JavaScript.
- Запаковывает всё это (вместе с CSS) в один единственный файл `index.html` и кладет его в папку `apps-script/src/dist/index.html`.

А уже затем команда `clasp push` берет этот новый `index.html` (вместе с остальными серверными файлами) и заливает в Google.

## Шпаргалка-запоминалка:

| Что менял? | Где находится файл? | Что делать в терминале? |
|------------|----------------------|-------------------------|
| Логику сбора данных, меню, скрипты таблиц | `apps-script/` | `clasp push` |
| Кнопки, цвета, графики, UI, Zustand | `client-react/` | `npm run build` ➡️ `clasp push` |

## Совет:
Если сомневаешься, где именно были изменения — делай `npm run build && clasp push` (в одной строке). Это займет на 5 секунд дольше, но гарантирует, что обновится абсолютно всё.
