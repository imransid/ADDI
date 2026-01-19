# 💎 Dior Clone - Premium E-Commerce Platform

<div align="center">

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-4.4.9-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12.0.0-FFCA28?logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.5-38B2AC?logo=tailwind-css&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux-1.9.5-764ABC?logo=redux&logoColor=white)

A modern, feature-rich e-commerce platform inspired by luxury brand experiences. Built with React, Firebase, and Tailwind CSS.

[Features](#-features) • [Getting Started](#-getting-started) • [Tech Stack](#-tech-stack) • [Project Structure](#-project-structure) • [Contributing](#-contributing)

</div>

---

## 📖 About

Dior Clone is a sophisticated e-commerce web application that replicates the premium shopping experience of high-end fashion brands. The platform offers a comprehensive suite of features including product management, user authentication, rewards systems, team collaboration, and administrative controls.

### ✨ Key Highlights

- 🎨 **Modern UI/UX** - Beautiful, responsive design with Tailwind CSS
- 🔐 **Secure Authentication** - Role-based access control with Firebase
- 💰 **Rewards System** - Cashback, bonuses, and prize redemption
- 👥 **Team Management** - Multi-level team structures and invitations
- 📱 **Mobile-First** - Optimized for all device sizes
- ⚡ **Fast Performance** - Built with Vite for lightning-fast development and builds

---

## 🚀 Features

### 🔑 Authentication & User Management
- User registration and login
- Role-based access control (Admin/User)
- User profile management
- Account status monitoring

### 🛍️ Product Management
- Browse product catalog
- Product purchase system
- My Products dashboard
- Product expiration tracking
- QR code generation for products

### 💎 Rewards & Benefits
- **Cashback System** - Earn rewards on purchases
- **Bonus Redemption** - Convert points to bonuses
- **Prize System** - Redeem prizes and rewards
- **Currency Management** - Multi-currency support

### 👥 Social & Teams
- **Team Management** - Create and manage teams
- **Invitation System** - Invite users to join teams
- **Referral Tracking** - Track team performance
- **Hierarchical Structure** - Multi-level team organization

### 💳 Financial Operations
- **Recharge** - Add funds to account
- **Withdraw** - Withdraw earnings
- **Transaction History** - Track all financial activities

### 🛠️ Administrative Features
- **Admin Panel** - Comprehensive admin dashboard
- **User Management** - Control user access and status
- **Product Administration** - Manage product catalog
- **Settings Configuration** - Platform-wide settings

### 📱 Additional Features
- **Carousel Gallery** - Image carousel on homepage
- **Online Status** - Real-time user status tracking
- **App Download** - Mobile app promotion
- **Responsive Navigation** - Bottom navigation for mobile

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - UI library
- **Vite 4.4.9** - Build tool and dev server
- **React Router DOM 6.14.2** - Client-side routing
- **Redux Toolkit 1.9.5** - State management
- **Tailwind CSS 3.3.5** - Utility-first CSS framework

### Backend & Services
- **Firebase 12.0.0** - Backend-as-a-Service
  - Firestore - NoSQL database
  - Authentication - User management
- **QR Code React 4.2.0** - QR code generation

### Development Tools
- **PostCSS & Autoprefixer** - CSS processing
- **ESLint** - Code linting (if configured)

---

## 📁 Project Structure

```
dior_clone/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── BottomNav.jsx    # Bottom navigation bar
│   │   ├── Carousel.jsx     # Image carousel component
│   │   ├── Layout.jsx       # Main layout wrapper
│   │   ├── ProtectedRoute.jsx      # Auth-protected routes
│   │   └── AdminProtectedRoute.jsx # Admin-protected routes
│   ├── config/
│   │   └── firebase.js      # Firebase configuration
│   ├── contexts/
│   │   └── SettingsContext.jsx # Global settings context
│   ├── pages/               # Page components
│   │   ├── Home.jsx         # Landing page
│   │   ├── Product.jsx      # Product listing
│   │   ├── MyProduct.jsx    # User's products
│   │   ├── User.jsx         # User profile
│   │   ├── Login.jsx        # Login page
│   │   ├── Register.jsx     # Registration page
│   │   ├── Cashback.jsx     # Cashback page
│   │   ├── Prize.jsx        # Prizes page
│   │   ├── MyTeams.jsx      # Teams management
│   │   ├── Invitation.jsx   # Invitation system
│   │   ├── Recharge.jsx     # Recharge page
│   │   ├── Withdraw.jsx     # Withdraw page
│   │   ├── AdminPanel.jsx   # Admin dashboard
│   │   └── ...
│   ├── services/
│   │   └── api.js           # API service layer
│   ├── store/               # Redux store
│   │   └── authSlice.js     # Authentication state
│   ├── utils/               # Utility functions
│   │   ├── currency.js      # Currency formatting
│   │   └── seedAdmin.jsx    # Admin seeding utility
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles
├── firestore.rules          # Firestore security rules
├── index.html               # HTML template
├── package.json             # Dependencies
├── tailwind.config.js       # Tailwind configuration
├── vite.config.js           # Vite configuration
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher recommended)
- **npm** or **yarn** package manager
- **Firebase account** (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dior_clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your Firebase configuration

4. **Configure environment variables**
   - Create or update `.env` file with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Set up Firestore Security Rules**
   - Deploy the security rules from `firestore.rules` to your Firebase project
   - See `FIRESTORE_RULES_SETUP.md` for detailed instructions

6. **Seed Admin User (Optional)**
   - Run the admin seeding utility to create an initial admin account:
   ```bash
   # Follow instructions in src/utils/seedAdmin.jsx
   ```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

### Building for Production

```bash
npm run build
# or
yarn build
```

The production build will be generated in the `dist` directory.

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

---

## 🔐 Firebase Configuration

### Firestore Security Rules

The project includes Firestore security rules to protect your data. Make sure to:

1. Review `firestore.rules` before deploying
2. Test rules in the Firebase Console
3. Deploy rules using Firebase CLI:
   ```bash
   firebase deploy --only firestore:rules
   ```

For production, consider using `firestore.rules.production` with stricter rules.

### Database Structure

The application uses the following main Firestore collections:
- `users` - User profiles and authentication data
- `products` - Product catalog
- `userProducts` - User purchases and product ownership
- `transactions` - Financial transactions
- `teams` - Team structures and hierarchies
- `settings` - Application-wide settings

---

## 🎨 Customization

### Styling

The project uses Tailwind CSS for styling. Customize the theme in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Add your custom colors
      },
    },
  },
}
```

### Routing

Routes are configured in `src/App.jsx`. Add new routes in the `Routes` component.

### State Management

Redux slices are located in `src/store/`. Add new slices for additional state management needs.

---

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow React best practices
- Use functional components with hooks
- Maintain consistent naming conventions
- Add comments for complex logic

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 👨‍💻 Author

Developed with ❤️ for a premium e-commerce experience.

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI library
- [Firebase](https://firebase.google.com/) - Backend services
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Vite](https://vitejs.dev/) - Build tool

---

<div align="center">

**Made with 💎 for luxury shopping experiences**

⭐ Star this repo if you find it helpful!

</div>
