# FinTracker

A modern personal finance tracker built with React, Vite, TypeScript, shadcn-ui, and Tailwind CSS.

---

## Project Author

**Created and maintained by:** Varun Shahi ([123varunshhhhhh](https://github.com/123varunshhhhhh))

---

## Features
- Track your expenses and income
- Manage budgets and financial goals
- Analytics dashboard
- Firebase authentication and Firestore backend
- Responsive, vibrant UI

---

## Getting Started

### Prerequisites
- Node.js & npm (recommended: use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Setup
```sh
# 1. Clone the repository
 git clone https://github.com/123varunshhhhhh/financetracker.git
 cd financetracker

# 2. Install dependencies
 npm install

# 3. Set up environment variables
# Copy .env.example to .env and fill in your Firebase config
 cp .env.example .env
# (Or create .env manually if .env.example does not exist)

# 4. Start the development server
 npm run dev
```

---

## Deployment

### Deploy to Vercel
1. Push your code to GitHub.
2. Connect your repo to [Vercel](https://vercel.com/).
3. Set the build command to `npm run build` and the output directory to `dist`.
4. Set your environment variables in the Vercel dashboard.
5. Deploy!

### Deploy to Firebase Hosting (optional)
If you want to use Firebase Hosting:
```sh
npm run build
firebase deploy
```

---

## Technologies Used
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [shadcn-ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/)

---

## License
This project is open source and available under the [MIT License](LICENSE).
