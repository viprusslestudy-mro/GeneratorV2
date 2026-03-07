# Retention Dashboard v2.0 - Complete Project Structure

## 📁 Project Root Structure

```
GeneratorV2/
├── retention-dashboard-v2/
│   ├── apps-script/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   └── RetentionAPI.js
│   │   │   ├── modelstore/
│   │   │   │   ├── retention/
│   │   │   │   │   ├── DataModel_Channels.js
│   │   │   │   │   ├── DataModel_Finance.js
│   │   │   │   │   ├── DataModel.js
│   │   │   │   │   ├── DataReader_Channels.js
│   │   │   │   │   ├── DataReader_Finance.js
│   │   │   │   │   └── DataReader.js
│   │   │   │   ├── shared/
│   │   │   │   │   └── SourceUtils.js
│   │   │   │   └── support/
│   │   │   │       ├── DataModelSupport.js
│   │   │   │       ├── DataReader_Support_Config.js
│   │   │   │       ├── DataReader_Support_HelpDesk.js
│   │   │   │       ├── DataReader_Support_KPI.js
│   │   │   │       ├── DataReader_Support_Tags.js
│   │   │   │       ├── DataReader_Support_Utils.js
│   │   │   │       └── DataReaderSupport.js
│   │   │   ├── appsscript.json
│   │   │   ├── Config.js
│   │   │   ├── Main.js
│   │   │   ├── Menu.js
│   │   │   ├── MetricsConfigManager_Channels.js
│   │   │   ├── MetricsConfigManager_Finance.js
│   │   │   ├── MetricsConfigManager.js
│   │   │   ├── SettingsManager.js
│   │   │   ├── test.js
│   │   │   └── Utils.js
│   │   └── .clasp.json
│   ├── client-react/
│   │   ├── public/
│   │   │   ├── mocks/
│   │   │   │   ├── api_getRetentionReport.json
│   │   │   │   ├── api_getSources.json
│   │   │   │   └── api_getUISettings.json
│   │   │   └── vite.svg
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── gasApi.js
│   │   │   │   └── retentionApi.js
│   │   │   ├── assets/
│   │   │   │   └── react.svg
│   │   │   ├── components/
│   │   │   │   ├── finance/
│   │   │   │   │   ├── FinanceDashboard.jsx
│   │   │   │   │   ├── FinanceDashboard.module.css
│   │   │   │   │   ├── FinanceTable.jsx
│   │   │   │   │   └── FinanceTable.module.css
│   │   │   │   └── shared/
│   │   │   │       ├── Card/
│   │   │   │       │   ├── Card.jsx
│   │   │   │       │   └── Card.module.css
│   │   │   │       ├── Loader/
│   │   │   │       │   ├── Loader.jsx
│   │   │   │       │   └── Loader.module.css
│   │   │   │       ├── MetricCard/
│   │   │   │       │   ├── MetricCard.jsx
│   │   │   │       │   └── MetricCard.module.css
│   │   │   │       └── Sidebar/
│   │   │   │           ├── Sidebar.jsx
│   │   │   │           └── Sidebar.module.css
│   │   │   ├── hooks/
│   │   │   │   ├── usePeriodFilter.js
│   │   │   │   └── useRetentionData.js
│   │   │   ├── store/
│   │   │   │   └── retentionStore.js
│   │   │   ├── styles/
│   │   │   │   └── variables.css
│   │   │   ├── utils/
│   │   │   │   └── formatters.js
│   │   │   ├── App.css
│   │   │   ├── App.jsx
│   │   │   ├── index.css
│   │   │   └── main.jsx
│   │   ├── .gitignore
│   │   ├── eslint.config.js
│   │   ├── index.html
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── README.md
│   │   └── vite.config.js
│   ├── .gitignore
│   └── STRUCTURE.md
├── .gitignore
└── taskmanager.md
```

## 📋 Detailed File Descriptions

### Root Level Files
- **`README.md`** - Complete project documentation and guides
- **`STRUCTURE.md`** - This file - detailed file structure
- **`.gitignore`** - Git ignore rules for both environments
- **`taskmanager.md`** - Task management and project planning

### Frontend (client-react/)

#### Configuration
- **`package.json`** - NPM dependencies (React, Vite, Zustand, etc.), build scripts
- **`package-lock.json`** - Exact dependency versions lockfile
- **`vite.config.js`** - Vite bundler configuration with React plugin and GAS deployment settings
- **`eslint.config.js`** - ESLint configuration for code quality
- **`index.html`** - HTML template for Vite development server
- **`.gitignore`** - Frontend-specific ignore rules

#### Public Assets
- **`public/mocks/*.json`** - JSON mock data files for development without backend
- **`public/vite.svg`** - Vite logo asset

#### Source Code (src/)

##### Entry Points
- **`main.jsx`** - React application bootstrap and root rendering
- **`App.jsx`** - Main application component with layout and data loading
- **`App.css`** - Application-level styles (layout, error states)
- **`index.css`** - Global CSS reset, utilities, and custom scrollbars

##### Assets
- **`assets/react.svg`** - React logo asset

##### API Layer (api/)
- **`gasApi.js`** - Core Google Apps Script API wrapper with Promise support
- **`retentionApi.js`** - Business logic API methods (getReport, getUISettings, etc.)

##### Components (components/)

###### Shared Components (shared/)
- **`Card/`** - Reusable container with glass-morphism effects and hover animations
- **`Loader/`** - Full-screen loading spinner with gradient background
- **`MetricCard/`** - KPI display with icons, values, and color-coded changes
- **`Sidebar/`** - Navigation panel with period selector and menu items

###### Domain Components (finance/)
- **`FinanceDashboard/`** - Main finance view combining KPI cards and tables
- **`FinanceTable/`** - Detailed metrics table with tabs and formatting

##### Business Logic (hooks/)
- **`useRetentionData.js`** - Automatic data fetching on component mount
- **`usePeriodFilter.js`** - Period selection state and data filtering

##### State Management (store/)
- **`retentionStore.js`** - Zustand store with actions, selectors, and persistence

##### Styling (styles/)
- **`variables.css`** - CSS custom properties for colors, spacing, typography

##### Utilities (utils/)
- **`formatters.js`** - Data formatting functions (currency, percent, etc.)

### Backend (apps-script/)

#### Configuration
- **`package.json`** - Dependencies for GAS development (clasp, etc.)
- **`.clasp.json`** - Clasp deployment configuration (script ID, root directory)

#### Source Code (src/)

##### API Layer (api/)
- **`RetentionAPI.js`** - JSON API endpoints for React frontend consumption

##### Data Models (modelstore/)

###### Retention Models (modelstore/retention/)
- **`DataModel.js`** - Base data model class for retention analytics
- **`DataModel_Finance.js`** - Finance-specific data model
- **`DataModel_Channels.js`** - Channels-specific data model
- **`DataReader.js`** - Base data reader class
- **`DataReader_Finance.js`** - Finance data reader implementation
- **`DataReader_Channels.js`** - Channels data reader implementation

###### Support Models (modelstore/support/)
- **`DataModelSupport.js`** - Support data model base class
- **`DataReaderSupport.js`** - Support data reader orchestrator
- **`DataReader_Support_Config.js`** - Support configuration and periods
- **`DataReader_Support_KPI.js`** - LiveChat KPI data reading
- **`DataReader_Support_Tags.js`** - Tags analytics data reading
- **`DataReader_Support_HelpDesk.js`** - HelpDesk data reading
- **`DataReader_Support_Utils.js`** - Support-specific utilities

###### Shared Utilities (modelstore/shared/)
- **`SourceUtils.js`** - Shared utility functions for data sources

##### Core Functions
- **`Main.js`** - Core GAS functions, HTML generation, React app hosting
- **`Menu.js`** - Google Sheets custom menu setup and function bindings
- **`appsscript.json`** - Google Apps Script project configuration

##### Configuration & Settings
- **`Config.js`** - Application configuration constants
- **`SettingsManager.js`** - Settings persistence and management
- **`MetricsConfigManager.js`** - Base metrics configuration manager
- **`MetricsConfigManager_Finance.js`** - Finance metrics configuration
- **`MetricsConfigManager_Channels.js`** - Channels metrics configuration

##### Utilities
- **`Utils.js`** - General utility functions
- **`test.js`** - Testing utilities and functions

## 🚀 Development Workflow

### Development Mode
```
client-react/
├── src/                    # Source files edited during development
├── public/mocks/           # Mock data loaded in dev mode
└── dist/                   # Empty during development
```

### Production Build
```
npm run build              # Creates optimized bundle in dist/
├── dist/
│   ├── index.html         # Single-page app entry
│   ├── assets/            # JS/CSS bundles and assets
│   └── vite.config.js     # GAS deployment config
```

### Google Apps Script Deployment
```
apps-script/
├── src/                   # Source files pushed to GAS
├── dist/                  # Compiled GAS files (auto-generated)
└── .clasp.json           # Deployment configuration
```

## 📊 File Dependencies

### React Components Dependency Tree
```
App.jsx
├── Sidebar.jsx (period selection)
├── FinanceDashboard.jsx
│   ├── MetricCard.jsx (KPI display)
│   └── FinanceTable.jsx (data table)
├── Loader.jsx (loading states)
└── Card.jsx (layout containers)
```

### State Flow
```
retentionStore.js (central state)
├── useRetentionData.js (data fetching)
├── usePeriodFilter.js (period logic)
├── retentionApi.js (API calls)
└── gasApi.js (GAS communication)
```

### Styling Cascade
```
variables.css (design tokens)
├── index.css (global styles)
├── App.css (app layout)
└── *.module.css (component styles)
```

### Backend Data Flow
```
RetentionAPI.js (API endpoints)
├── DataReader.js (base reader)
│   ├── DataReader_Finance.js (finance data)
│   └── DataReader_Channels.js (channels data)
├── DataReaderSupport.js (support reader)
│   ├── DataReader_Support_KPI.js (KPI data)
│   ├── DataReader_Support_Tags.js (tags data)
│   └── DataReader_Support_HelpDesk.js (helpdesk data)
└── MetricsConfigManager.js (configuration)
    ├── MetricsConfigManager_Finance.js
    └── MetricsConfigManager_Channels.js
```

## 🔧 Build and Deployment

### Development
- **Hot Reload**: Vite serves from `client-react/src/`
- **Mock Data**: JSON files in `client-react/public/mocks/`
- **Fast Iteration**: No build step required

### Production
- **Build**: `npm run build` creates optimized bundle in `client-react/dist/`
- **Deploy**: `clasp push` uploads GAS files from `apps-script/src/`
- **Serve**: GAS hosts the built React app in Google Sheets

---

**Complete Retention Dashboard v2.0 - React Migration Structure** 📁
