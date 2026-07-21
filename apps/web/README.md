# GENESIS ID Web - Frontend Application

A modern Next.js + TypeScript web application for identity verification and KYC (Know Your Customer) with Veriff integration. This is the complete Veriff Station-like interface for the Orden Global ecosystem.

## 🚀 Features

- **User Registration & Authentication** - Secure email/password registration with JWT tokens
- **Facial Verification** - Veriff SDK integration for liveness detection and facial recognition
- **Document Scanning** - ID, passport, and driver's license verification
- **KYC Flow** - Step-by-step guided verification process with progress tracking
- **Admin Dashboard** - Complete verification management for admins
- **Manual Review Panel** - Review and approve/reject pending verifications with notes
- **Real-time Status** - Live status updates for verification cases
- **Responsive Design** - Mobile-friendly UI with Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, React Icons
- **State Management**: Zustand (for future)
- **HTTP Client**: Axios with token refresh
- **Notifications**: React Hot Toast
- **Verification**: Veriff SDK

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# Navigate to web app directory
cd apps/web

# Install dependencies
npm install

# Create .env.local from template
cp .env.example .env.local

# Configure environment variables
# Edit .env.local with your backend API URL and Veriff settings

# Start development server
npm run dev
```

Server runs on `http://localhost:3001`

## 📁 Project Structure

```
apps/web/
├── components/           # Reusable React components
│   ├── Layout.tsx       # Main layout wrapper
│   ├── Header.tsx       # Navigation header
│   ├── Sidebar.tsx      # Admin sidebar
│   ├── KYCFlow.tsx      # KYC verification flow
│   └── VeriffSDK.tsx    # Veriff SDK integration
├── pages/               # Next.js pages and routes
│   ├── index.tsx        # Home page
│   ├── auth/
│   │   ├── login.tsx    # Login page
│   │   └── register.tsx # Registration page
│   ├── verify.tsx       # Verification page
│   ├── dashboard/       # User dashboard
│   └── admin/           # Admin pages
│       ├── index.tsx    # Admin dashboard
│       ├── users.tsx    # User management
│       ├── verifications.tsx
│       └── reviews.tsx  # Manual review queue
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication logic
│   └── useVerification.ts # Verification flow
├── lib/                 # Utilities and libraries
│   └── apiClient.ts     # Axios API client with interceptors
├── types/               # TypeScript definitions
│   └── index.ts         # All types
├── styles/              # Global styles
└── public/              # Static assets
```

## 🔐 Key Components

### 1. **KYCFlow** (`components/KYCFlow.tsx`)
Main verification flow component with:
- Step-by-step progress tracking
- Veriff SDK integration
- Status checking
- Retry handling
- Error management

### 2. **useAuth Hook** (`hooks/useAuth.ts`)
Handles:
- User registration
- Login/logout
- Token management
- JWT refresh
- Session persistence

### 3. **useVerification Hook** (`hooks/useVerification.ts`)
Manages:
- Verification initialization
- Status checking
- KYC data submission
- Retry logic
- Error handling

### 4. **API Client** (`lib/apiClient.ts`)
- Automatic JWT token injection
- Token refresh on 401
- Error handling
- Request/response interceptors

## 📄 Main Pages

### Public Pages
- **/** - Home page with features and CTA
- **/auth/register** - User registration
- **/auth/login** - User login
- **/verify** - KYC verification flow

### Protected Pages
- **/dashboard** - User dashboard (requires auth)

### Admin Pages (requires admin role)
- **/admin** - Admin dashboard
- **/admin/users** - User management
- **/admin/verifications** - Verification history
- **/admin/reviews** - Manual review queue
- **/admin/reports** - Analytics and reports

## 🔌 API Integration

The frontend communicates with the backend API at:
```
http://localhost:3000/api
```

Key endpoints used:
```
POST /auth/register           - Register new user
POST /auth/login              - Login user
POST /auth/verify-init        - Start verification
POST /auth/verify-callback    - Receive Veriff callback
GET  /auth/verify-status/:id  - Check status
POST /auth/logout             - Logout
POST /auth/refresh            - Refresh JWT token

POST /apps/user-status        - Check if user verified
POST /apps/register-app       - Register app
POST /apps/token-validate     - Validate token

GET  /admin/users             - List users (admin)
GET  /admin/verifications     - List verifications
POST /admin/reviews/:id/approve  - Approve verification
POST /admin/reviews/:id/reject   - Reject verification
```

## ✅ Environment Variables

See `.env.example` for all available options:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_VERIFF_URL=https://station.veriff.com
NEXT_PUBLIC_VERIFF_SDK_URL=https://cdn.veriff.com/js/sdk/latest
NODE_ENV=development
```

## 🎨 UI/UX Features

- **Responsive Design** - Works on all screen sizes
- **Dark/Light Mode Ready** - Base for theme support
- **Loading States** - Spinner and skeleton loaders
- **Error Handling** - User-friendly error messages
- **Toast Notifications** - Real-time feedback
- **Accessibility** - WCAG compliant components
- **Animations** - Smooth transitions and spinners

## 🧪 Testing

```bash
# Run tests
npm run test

# Run with coverage
npm run test -- --coverage

# Type checking
npm run type-check
```

## 📝 Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## 🚀 Building for Production

```bash
# Build
npm run build

# Start production server
npm run start
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Automatic Token Refresh** - Refreshes before expiry
- **HTTPS Only** - All API calls over HTTPS in production
- **Input Validation** - Form validation on frontend
- **XSS Protection** - React's built-in XSS protection
- **CORS** - Configured on backend
- **HttpOnly Cookies** - Refresh tokens in cookies (can be configured)

## 🎯 User Flow

```
1. User lands on home page
   ↓
2. Clicks "Get Started" → Redirected to /auth/register
   ↓
3. Fills registration form → Creates account
   ↓
4. Redirected to /verify with userId
   ↓
5. Starts KYC flow with Veriff SDK
   ↓
6. Captures facial recognition + document
   ↓
7. Veriff processes and sends webhook
   ↓
8. If approved → Get JWT tokens → Redirected to /dashboard
   ↓
9. If pending → Shows "Under Review" message
   ↓
10. If rejected → Shows error, can retry
```

## 📊 Admin Flow

```
Admin Dashboard (/admin)
   ↓
Navigate to "Manual Reviews" (/admin/reviews)
   ↓
See pending verification cases
   ↓
Select case → View user and verification details
   ↓
Add review notes (optional)
   ↓
Click "Approve" or "Reject"
   ↓
Status updates instantly
   ↓
User notified via email
```

## 🐛 Troubleshooting

### Issue: "API connection refused"
- Check backend is running on `http://localhost:3000`
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Issue: "Veriff SDK not loading"
- Check internet connection
- Verify Veriff SDK URL in environment
- Check browser console for CORS errors

### Issue: "Token expired"
- Automatic refresh should handle this
- If still failing, login again
- Check localStorage for tokens

## 📚 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Veriff Documentation](https://developers.veriff.com)

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Submit a pull request

## 📄 License

MIT

## 🆘 Support

For issues or questions:
- GitHub Issues
- Email: dev@orden-global.com
- Slack: #genesis-id
