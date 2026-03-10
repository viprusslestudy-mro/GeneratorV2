# Retention Dashboard v2
 
A modern React-based analytics dashboard for monitoring retention metrics, support KPIs, and tag analytics across multiple business domains.
 
## 🚀 Features
 
### 📊 Dashboard Sections
- **Finance Dashboard**: Revenue analytics, growth analysis, and financial metrics
- **Channels Dashboard**: Channel performance analysis with line/bar charts and doughnut charts
- **Support Dashboard**: LiveChat KPI monitoring and tag analytics
 
### 🎯 Key Components
- **Period Selection**: Smart period switching with automatic fallback to valid periods
- **Locale Filtering**: Multi-locale support with intelligent filtering based on available data
- **Interactive Charts**: Recharts-based visualizations (Line, Bar, Pie charts)
- **Data Export**: CSV export functionality for analytics data
- **Responsive Design**: Mobile-friendly layout with modern CSS Grid
 
### 🛠️ Technical Stack
- **React 18** with Hooks
- **Vite** for fast development and building
- **Zustand** for state management with persistence
- **Recharts** for data visualization
- **CSS Modules** for scoped styling
- **i18n Support** with custom translation hooks
 
## 🏗️ Project Structure
 
```
client-react/
├── src/
│   ├── components/
│   │   ├── finance/          # Finance dashboard components
│   │   ├── channels/         # Channel analytics components
│   │   ├── support/          # Support dashboard & tags analytics
│   │   └── shared/           # Reusable UI components
│   ├── store/                # Zustand state management
│   ├── hooks/                # Custom React hooks
│   └── utils/                # Utility functions
├── public/                   # Static assets
└── README.md
```
 
## 🏃‍♂️ Getting Started
 
1. **Install dependencies:**
   ```bash
   npm install
   ```
 
2. **Start development server:**
   ```bash
   npm run dev
   ```
 
3. **Build for production:**
   ```bash
   npm run build
   ```
 
4. **Preview production build:**
   ```bash
   npm run preview
   ```
 
## 🚀 Пошаговый запуск (Без лазания в код)

Теперь всё автоматизировано!

Сделай clasp push, чтобы функции меню и отправки появились в Google Таблице.
Открой Google Таблицу -> Меню 📊 Dashboard v2.0 -> ☁️ Отправить данные в БД -> 📤 Отправить Переводы. (Появится алерт "Успех").
В терминале client-react напиши: npm run build.
В папке client-react появится папка dist.
Как загрузить на Vercel (инструкция для новичка):
Зайди на сайт vercel.com (ты уже зарегистрирован).
На главной странице (Dashboard) нажми большую черную кнопку "Add New..." и выбери "Project".
У тебя откроется страница "Import Git Repository". Прокрути её в самый низ.
Там будет серый пунктирный прямоугольник с текстом:
"Want to deploy an existing project without a Git repository? Upload a folder"
https://vercel.com/new/upload

ВНИМАНИЕ: Открой проводник (папку) на компьютере, найди папку client-react. Внутри неё есть папка dist.
Схвати именно папку dist мышкой и перетащи её прямо в этот прямоугольник на сайте Vercel!
Появится окно "Deploying". Нажми кнопку "Deploy" (если спросит имя проекта — напиши retention-dashboard).
Жди 10-20 секунд... 🎉 ПОБЕДА! Экран засыплет конфетти и тебе дадут готовую ссылку.
Всё! Теперь твой дашборд живет в интернете. Он загружает актуальные графики и идеальные русские переводы прямо из базы данных. Если ты изменишь переводы в гугл таблице, тебе нужно будет только нажать "Отправить Переводы" в таблице, и сайт на Vercel обновится сам!

## Способ 2: Через терминал (Путь Pro-разработчика 💻)

Этот способ даже лучше, потому что в будущем тебе не придется ничего таскать мышкой.

Открой терминал прямо в папке client-react.
Убедись, что ты уже сделал сборку: npm run build.
Теперь перейди внутрь папки dist командой:
```bash
cd dist
```
Напиши магическую команду:
```bash
npx vercel
```
Терминал задаст тебе пару простых вопросов:
- Vercel CLI wants to log in... -> Нажми Enter, откроется браузер, нажми там "Log in".
- Set up and deploy "~/ТвойПуть/dist"? -> Напиши Y (Да) и нажми Enter.
- Which scope do you want to deploy to? -> Просто нажми Enter.
- Link to existing project? -> Напиши N (Нет) и нажми Enter.
- What's your project's name? -> Напиши, например, superspin-dashboard и нажми Enter.
- In which directory is your code located? -> Просто нажми Enter (там по умолчанию стоит ./).

## 📝 Что нужно сделать дальше

После развертывания сайта на Vercel:

### 🚀 Загрузка переводов в базу данных

1. **Скопируй код в GAS** - Убедись, что все файлы из `apps-script/src/` загружены в твой проект Google Apps Script.

2. **Сделай clasp push** - Загрузи изменения в Google Apps Script.

3. **Обнови Google Таблицу** - Перезагрузи таблицу, чтобы появились новые пункты меню.

4. **Проверь настройки Supabase**:
   - Открой лист `⚙️ APP_SETTINGS`
   - Убедись, что прописаны `supabase_url` и `supabase_key` (или `supabase_anon_key`)
   - Если их нет — добавь в две колонки!

5. **Отправь переводы**:
   - В меню Google Таблицы: `☁️ Отправить данные в БД` -> `📤 Отправить Переводы`
   - Должен появиться алерт "✅ Успех"

6. **Обнови сайт**:
   - Используй кнопку в меню: `🌍 Открыть готовый сайт (Vercel)`
   - Переводы автоматически загрузятся с базы данных!

## 🔧 Настройка ссылки на сайт (одноразовая)

Что тебе нужно сделать в твоей текущей Google Таблице (руками, один раз):
Открой лист `⚙️ APP_SETTINGS`.
В самый низ (или в любой блок настроек) добавь новую строку:
В колонку А (левую) напиши: `site_url`
В колонку B (правую) вставь ссылку: `https://superspin-dashboard.vercel.app`
Готово! Сделай `clasp push` и можешь нажимать "Открыть сайт" в меню! 🚀

## � Environment Variables в Vercel

Понял! Давай проясню момент с Environment Variables (переменными окружения).

Когда ты запускаешь проект локально (у себя на компьютере), фронтенд берёт пароли к базе данных из файла .env (он лежит в папке client-react/.env). Но когда проект загружается в Vercel (в интернет), он этот файл не видит из соображений безопасности. В Vercel пароли нужно вбивать прямо на сайте.

### Инструкция: Как добавить переменные в Vercel

Зайди на vercel.com и открой свой проект (superspin-dashboard).

Сверху нажми на вкладку **Settings** (Настройки).

В левом меню выбери **Environment Variables** (Переменные окружения).

У тебя появятся два поля: Key и Value.  
Тебе нужно добавить туда три строчки (нажимаешь "Add" после каждой):

#### Первая переменная:
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://твой-адрес.supabase.co` (возьми из своего .env файла или Google Таблицы)
- Жми **Save**.

#### Вторая переменная:
- **Key**: `VITE_SUPABASE_KEY`
- **Value**: `твой-длинный-анон-ключ`
- Жми **Save**.

#### Третья переменная (наша новая):
- **Key**: `VITE_SUPABASE_TABLE`
- **Value**: `reports`
- Жми **Save**.

Всё! Теперь Vercel знает, куда стучаться за данными и переводами.

### Почему это безопасно?

Да, это абсолютно безопасно и именно так и нужно делать!

То, что ты показываешь на скриншоте — это стандартный механизм Vercel для хранения секретов (Environment Variables).

#### Почему это безопасно:

Ключ, который ты используешь (`VITE_SUPABASE_KEY`) — это публичный anon ключ Supabase.  
Он предназначен для того, чтобы быть публичным и использоваться во фронтенде (в браузере). С помощью этого ключа можно делать только то, что разрешено правилами безопасности базы данных (RLS — Row Level Security).

#### Как это работает при сборке:
Когда ты нажимаешь "Redeploy" в Vercel (или делаешь пуш), Vercel берет эти переменные и "вшивает" их в финальный скомпилированный код твоего сайта. В итоге браузер знает, куда идти за данными, но сами ключи надежно спрятаны в настройках твоего аккаунта Vercel (никто, кроме тебя, не может зайти в этот интерфейс и посмотреть их).

#### Скрытые символы (замочек):
Обрати внимание, что у `VITE_SUPABASE_KEY` горит значок замка. Это значит, что Vercel зашифровал эту переменную, и даже ты после сохранения не сможешь подсмотреть её полное значение в этом интерфейсе (только удалить и перезаписать).

Так что жми "Save" с чистой совестью!

#### После сохранения не забудь:

Перейти во вкладку **Deployments** (сверху).  
Нажать на три точки `...` справа от твоего деплоя.  
Выбрать **Redeploy**.  
*(Это нужно, чтобы Vercel заново собрал сайт, но уже с учетом этих новых переменных).*

## 🚀 Финальный Деплой (Запуск в космос 🚀)

Сохрани эту инструкцию себе. Она понадобится, когда ты скажешь: "Всё идеально, хочу дать ссылку боссу".

У нас современная архитектура, поэтому деплой делится на две независимые части: **Бэкенд** (Сборщик в Google) и **Фронтенд** (Сам красивый сайт).

### Этап 1: Обновление Бэкенда (Google Apps Script)

Это нужно сделать 1 раз для обновления скриптов.

1. Открываешь терминал в папке `apps-script`.
2. Пишешь команду: `clasp push`.
3. Заходишь в свою Google Таблицу и обновляешь страницу (F5).
4. В листе `⚙️ APP_SETTINGS` проверяешь, что есть строки `supabase_url`, `supabase_key` и `supabase_table` (со значением `reports`).
5. В верхнем меню нажимаешь: `📊 Dashboard v2.0` -> `☁️ Отправить данные в БД` -> `🚀 Отправить ВСЁ`.
6. Появится алерт "Успех". Всё, база данных (Supabase) обновлена свежими цифрами и переводами!

### Этап 2: Сборка Фронтенда (React)

Это делается на твоем компьютере перед отправкой в Vercel.

1. Открываешь терминал в папке `client-react`.
2. Пишешь команду сборки: `npm run build`.
3. Vite сожмет весь твой красивый код и сложит всё это в папку `client-react/dist`.

### Этап 3: Публикация сайта в интернет (Vercel)

Это нужно делать **ТОЛЬКО** если ты менял дизайн, цвета, верстку или добавлял новые графики.

1. В том же терминале (`client-react`), перейди в папку `dist`:
   ```bash
   cd dist
   ```

2. Отправь проект в продакшен командой:
   ```bash
   npx vercel --prod
   ```
   *(Если попросит ответить на пару вопросов — везде жми Enter. Если спросит имя проекта — введи superspin-dashboard).*

3. Терминал выдаст зеленую строчку с готовой ссылкой (например: `https://superspin-dashboard.vercel.app`).

4. **Обязательно**: Выполни настройку переменных окружения в Vercel (инструкция выше), если ты еще этого не делал.

5. Так как ты добавил переменные окружения, нужно пересобрать проект в Vercel, чтобы он их подхватил. В интерфейсе Vercel перейди на вкладку **Deployments**, нажми три точки `...` возле последнего деплоя и выбери **Redeploy**.

Всё! Теперь Vercel знает, куда стучаться за данными и переводами.

## 🚀 Добавление нового проекта (новой таблицы)

Это самая крутая часть нашей архитектуры! Я спроектировал всё так, чтобы новый проект запускался за 5 минут без программирования.

Представь, что тебе поручили сделать такой же дашборд для нового бренда (назовем его MegaBet).

Вот твой пошаговый алгоритм:

### Шаг 1: Подготовка базы данных

Заходишь в Supabase, создаешь новый проект (или новую таблицу в старом).  
Копируешь новые URL и KEY.

### Шаг 2: Google Таблица (Бэкенд)

Копируешь свою текущую Google Таблицу (`Файл` -> `Создать копию`).  
В новой таблице заходишь в лист `⚙️ APP_SETTINGS` и меняешь:  
- **Название проекта** -> MegaBet  
- **supabase_url** -> новый URL  
- **supabase_key** -> новый ключ  

Нажимаешь `📊 Dashboard v2.0` -> `☁️ Отправить данные в БД` -> `🚀 Отправить ВСЁ`. Скрипт сам закинет данные MegaBet в новую базу.

### Шаг 3: Vercel (Фронтенд)

Заходишь в Vercel.  
Нажимаешь `Add New Project`.  
Снова перетаскиваешь папку `client-react/dist` с твоего компьютера (ту же самую папку, ничего собирать заново не надо!).  
Называешь проект `megabet-dashboard`.  

Заходишь в настройки этого нового проекта в Vercel (`Settings` -> `Environment Variables`) и вбиваешь туда URL и KEY от новой базы данных:  
- `VITE_SUPABASE_URL`  
- `VITE_SUPABASE_KEY`  
- `VITE_SUPABASE_TABLE`  

Жмешь `Redeploy`.  

Всё! У тебя два независимых дашборда на разных ссылках.  
Один фронтенд-код обслуживает любое количество проектов. Фронтенд просто смотрит в переменные окружения Vercel, идет в указанную базу, скачивает JSON и рисует название и графики. Магия! ✨

## � Styling
 
The project uses CSS Modules with a design system featuring:
- Custom CSS variables for colors and spacing
- Modern glassmorphism effects
- Smooth animations and transitions
- Responsive grid layouts
 
## 📈 Data Management
 
- **Zustand Store**: Centralized state with selectors for computed data
- **Period Caching**: Intelligent caching of period data to avoid unnecessary API calls
- **Data Validation**: Robust error handling and data validation
 
## 🌍 Internationalization
 
Built-in translation support with:
- Custom `useTranslation` hook
- Month translation for different locales
- Dynamic text rendering
 
## 🤝 Contributing
 
1. Follow the existing code style and structure
2. Use CSS Modules for component styling
3. Implement proper error handling
4. Add translations for new text content
5. Test responsiveness across devices

## 🎉 Готово!

Теперь вся архитектура 100% независима и гибка для будущих проектов! Сделай `clasp push` для бекенда и `npm run build && npx vercel --prod` для фронтенда! 🚀

## 🤝 Contributing