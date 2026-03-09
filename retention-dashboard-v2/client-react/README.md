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

## 🎨 Styling
 
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