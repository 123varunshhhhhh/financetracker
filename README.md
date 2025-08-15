# FinTracker

A modern, comprehensive personal finance tracker built with React, Vite, TypeScript, shadcn-ui, and Tailwind CSS. Track expenses, manage budgets, set financial goals, and gain insights into your financial health with beautiful analytics.

---

## Project Author

**Created and maintained by:** Varun Shahi ([123varunshhhhhh](https://github.com/123varunshhhhhh))

---

## ✨ Features

### 📊 **Dashboard & Analytics**
- Real-time financial overview with interactive charts
- Income vs expenses tracking with trend analysis
- Expense categorization with pie charts
- Financial health scoring system
- Net worth growth visualization
- Monthly savings rate calculations

### 💳 **Transaction Management**
- Add, edit, and delete transactions with validation
- Advanced filtering by date, category, and type
- Real-time search functionality
- Bulk operations and data export
- Transaction categorization with smart suggestions

### 🏦 **Budget Management**
- Create and manage budgets by category
- Budget vs actual spending comparisons
- Alert notifications when approaching limits
- Visual progress indicators
- Monthly, weekly, and yearly budget periods

### 🎯 **Goal Setting**
- Set and track financial goals
- Progress visualization with milestones
- Goal categories (Emergency Fund, Vacation, etc.)
- Target date tracking with reminders
- Achievement celebrations

### ⚙️ **Advanced Settings**
- Multi-currency support (USD, EUR, GBP, CAD, INR, AUD, BTC, ETH, SOL)
- Theme customization (Light, Dark, System)
- Notification preferences
- Data export/import functionality
- Privacy and security controls

### 🔒 **Security & Privacy**
- Firebase Authentication integration
- Secure password management
- Data encryption and privacy controls
- Account deletion with data cleanup
- GDPR compliance features

### 📱 **User Experience**
- Fully responsive design for all devices
- Smooth animations with GSAP
- Loading skeletons for better perceived performance
- Error boundaries for graceful error handling
- Toast notifications for user feedback
- Accessibility-first design

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & npm (recommended: use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Firebase project with Firestore and Authentication enabled

### Setup
```sh
# 1. Clone the repository
git clone https://github.com/123varunshhhhhh/financetracker.git
cd financetracker

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create .env file with your Firebase configuration
cp .env.example .env

# Add your Firebase config to .env:
# VITE_FIREBASE_API_KEY=your_api_key
# VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
# VITE_FIREBASE_PROJECT_ID=your_project_id
# VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
# VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# VITE_FIREBASE_APP_ID=your_app_id
# VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# 4. Start the development server
npm run dev
```

### Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Create a Firestore database in production mode
4. Add your domain to authorized domains in Authentication settings
5. Copy your Firebase config to the `.env` file

---

## 🏗️ Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn-ui components
│   ├── Dashboard.tsx   # Main dashboard component
│   ├── TransactionManager.tsx
│   ├── BudgetManager.tsx
│   ├── Analytics.tsx
│   ├── Goals.tsx
│   ├── Settings.tsx
│   ├── ErrorBoundary.tsx
│   ├── LoadingSkeleton.tsx
│   └── NotificationSystem.tsx
├── hooks/              # Custom React hooks
│   └── usePerformance.ts
├── lib/                # Utility functions and API
│   ├── firebaseApi.ts  # Firebase operations
│   ├── utils.ts        # Helper functions
│   └── validation.ts   # Zod validation schemas
├── pages/              # Page components
└── styles/             # Global styles
```

### Key Technologies
- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn-ui, Tailwind CSS, Radix UI
- **Backend**: Firebase (Auth + Firestore)
- **Charts**: Recharts
- **Animations**: GSAP, Lenis
- **Validation**: Zod
- **State Management**: React Context + Hooks
- **Build Tool**: Vite with SWC

---

## 🎨 Design System

### Color Palette
- **Primary**: Modern gradient blues and purples
- **Success**: Green tones for income and positive metrics
- **Destructive**: Red tones for expenses and warnings
- **Warning**: Yellow/orange for alerts and goals
- **Muted**: Subtle grays for secondary content

### Typography
- **Headings**: Bold, modern sans-serif
- **Body**: Clean, readable font stack
- **Monospace**: For financial figures and codes

### Components
- Consistent spacing using Tailwind's scale
- Rounded corners and subtle shadows
- Hover states and smooth transitions
- Accessible color contrasts
- Mobile-first responsive design

---

## 📊 Data Models

### Transaction
```typescript
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  createdAt: string;
}
```

### Budget
```typescript
interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  alertThreshold?: number;
}
```

### Goal
```typescript
interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}
```

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com/)
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables in Vercel dashboard
6. Deploy!

### Deploy to Firebase Hosting
```sh
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

### Deploy to Netlify
1. Connect your GitHub repo to [Netlify](https://netlify.com/)
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy!

---

## 🔧 Development

### Available Scripts
```sh
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Code Quality
- **ESLint**: Configured with React and TypeScript rules
- **TypeScript**: Strict mode enabled for better type safety
- **Prettier**: Code formatting (configure in your editor)
- **Husky**: Git hooks for pre-commit checks (optional)

### Performance Optimizations
- **Code Splitting**: Lazy loading for better initial load times
- **Image Optimization**: Responsive images with proper formats
- **Bundle Analysis**: Use `npm run build` to analyze bundle size
- **Caching**: Proper HTTP caching headers for static assets
- **Error Boundaries**: Graceful error handling
- **Loading States**: Skeleton screens for better UX

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design
- Test across different browsers

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [shadcn-ui](https://ui.shadcn.com/) for the beautiful component library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Firebase](https://firebase.google.com/) for the backend infrastructure
- [Recharts](https://recharts.org/) for the charting library
- [Lucide](https://lucide.dev/) for the icon set

---

## 📞 Support

If you have any questions or need help, please:
1. Check the [Issues](https://github.com/123varunshhhhhh/financetracker/issues) page
2. Create a new issue with detailed information
3. Contact the maintainer: [123varunshhhhhh](https://github.com/123varunshhhhhh)

---

**Happy tracking! 💰📈**
