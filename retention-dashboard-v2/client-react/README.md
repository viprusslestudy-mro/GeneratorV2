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