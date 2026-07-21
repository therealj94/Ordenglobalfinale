# GENESIS ID - Centralized Verification Engine

Orden Global's unified identity verification platform. One registration, access to the entire ecosystem.

## 🎯 Overview

GENESIS ID is the central verification hub for the Orden Global ecosystem (Veta Wallet, My Token Pay, and more). Users register once with facial verification through Veriff, then automatically access all connected applications via JWT-based SSO.

## ✨ Key Features

- **Facial Verification**: Integration with Veriff.com Premium for identity verification
- **Central SSO**: Single Sign-On across all Orden Global applications
- **JWT Authentication**: Secure, stateless token-based authentication
- **Admin Dashboard**: Complete user and verification management
- **Audit Logs**: Full compliance and audit trail
- **CORS & Security**: Built with Helmet, CORS, and security best practices

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   GENESIS ID Core                       │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐   │
│  │  Auth API    │  │  App API     │  │  Admin API  │   │
│  │              │  │              │  │             │   │
│  │ • Register   │  │ • User Check │  │ • Users     │   │
│  │ • Login      │  │ • Register   │  │ • Reports   │   │
│  │ • Verify     │  │ • Validate   │  │ • Logs      │   │
│  └──────────────┘  └──────────────┘  └─────────────┘   │
│         ↓                  ↓                ↓            │
│  ┌─────────────────────────────────────────────────────┐│
│  │        JWT Service / Veriff Service                 ││
│  └─────────────────────────────────────────────────────┘│
│         ↓                                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │   AWS RDS PostgreSQL Database                       ││
│  │   • Users • Verifications • Sessions • Tokens       ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
         ↓
    ┌────────────────┐
    │  Veriff.com    │ (Facial Verification)
    └────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# 1. Clone repository
git clone https://github.com/therealj94/ordenglobalfinale.git
cd ordenglobalfinale

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 4. Setup database
npm run migrate

# 5. Start development server
npm run dev
```

Server runs on `http://localhost:3000`

## 📚 Documentation

- **[API Documentation](./API.md)** - Complete API endpoint reference
- **[Veriff Integration](./VERIFF_INTEGRATION.md)** - Facial verification setup and webhooks
- **[Deployment Guide](./DEPLOYMENT.md)** - AWS RDS, ECS, ALB, and Route 53 setup

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-init` - Start facial verification
- `POST /api/auth/verify-callback` - Veriff webhook callback
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### App Integration
- `POST /api/apps/user-status` - Check if user exists and is verified
- `POST /api/apps/register-app` - Link app to user account
- `POST /api/apps/token-validate` - Validate JWT token

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - User details
- `GET /api/admin/verifications` - Verification history
- `GET /api/admin/reports` - Analytics and reports
- `DELETE /api/admin/users/:id` - Soft delete user

## 🗄️ Database Models

- **User** - User accounts and profiles
- **Verification** - Facial verification records
- **VerificationSession** - Active verification sessions
- **LoginToken** - JWT tokens and refresh tokens
- **AppRegistration** - App-user associations
- **AdminLog** - Audit trail

## 🔐 Security Features

- **Password Hashing**: bcryptjs with salt rounds 10
- **JWT Tokens**: Signed with HS256 algorithm
- **Webhook Validation**: HMAC-SHA256 signature verification
- **CORS**: Configured for specific origins only
- **Helmet**: Security headers enforcement
- **Rate Limiting**: Ready for implementation
- **Input Validation**: express-validator for all inputs

## 🔄 User Flow

```
1. User visits app (Veta Wallet, etc.)
   ↓
2. App redirects to GENESIS ID if not verified
   ↓
3. User registers (email + password)
   ↓
4. User initiates facial verification
   ↓
5. Redirected to Veriff for biometric capture
   ↓
6. Veriff processes verification
   ↓
7. Webhook notifies GENESIS ID of decision
   ↓
8. If approved: User receives JWT token
   ↓
9. Token sent to original app
   ↓
10. User now has access to all apps in ecosystem
```

## 📊 Admin Panel Features

- User management (list, search, details, soft delete)
- Verification tracking and status
- Real-time analytics and reports
- Admin action audit logs
- Verification trend analysis

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | PostgreSQL 14+ (AWS RDS) |
| ORM | Sequelize |
| Authentication | JWT (jsonwebtoken) |
| Password Hash | bcryptjs |
| Validation | express-validator |
| HTTP Client | Axios |
| Security | Helmet, CORS |
| Logging | Morgan |

## 📦 Project Structure

```
genesis-id/
├── src/
│   ├── app.js                 # Express app entry
│   ├── config/                # Configuration files
│   │   ├── database.js       # Sequelize config
│   │   └── veriff.js         # Veriff API config
│   ├── controllers/           # Route controllers
│   │   ├── AuthController.js
│   │   ├── AppController.js
│   │   └── AdminController.js
│   ├── models/                # Sequelize models
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   │   ├── JWTService.js
│   │   ├── VeriffService.js
│   │   └── PasswordService.js
│   └── middleware/            # Express middleware
├── database/
│   ├── migrations/            # Sequelize migrations
│   └── seeders/               # Database seeders
├── package.json
├── .env.example
└── README.md
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete AWS deployment instructions.

Quick summary:
1. RDS PostgreSQL setup
2. ECR Docker image build and push
3. ECS Fargate service creation
4. Application Load Balancer configuration
5. Route 53 DNS setup
6. SSL/TLS certificate (AWS Certificate Manager)

## 🧪 Testing

```bash
# Run test suite
npm test

# Test with coverage
npm test -- --coverage

# Health check
curl http://localhost:3000/health
```

## 🔄 Connect to Apps

To connect a new app to GENESIS ID:

1. App calls `POST /api/apps/user-status` with userId + appName
2. If user exists and is verified, app receives confirmation
3. App calls `POST /api/apps/register-app` to link user account
4. App validates tokens with `POST /api/apps/token-validate`
5. User can now use the app with their GENESIS ID account

Example app integration flow in `INTEGRATION.md` (coming soon)

## 📝 Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` - Database connection
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - Token signing keys
- `VERIFF_API_KEY`, `VERIFF_SECRET` - Veriff API credentials
- `CORS_ORIGIN` - Allowed origin domains
- `NODE_ENV` - Environment (development/production)

## 🤝 Contributing

GENESIS ID is currently under active development. Contributions welcome!

1. Create a feature branch
2. Make changes and commit with clear messages
3. Push to origin
4. Create a Pull Request

## 📄 License

MIT

## 🆘 Support

For issues, questions, or support:
- GitHub Issues: [Link to issues]
- Email: dev@orden-global.com
- Slack: #genesis-id channel in Orden Global workspace

## 🎯 Roadmap

- [ ] Admin dashboard (React/Next.js)
- [ ] Rate limiting and DDoS protection
- [ ] Email notifications
- [ ] Two-factor authentication (2FA)
- [ ] Biometric login (fingerprint/face)
- [ ] Mobile SDK for app integration
- [ ] Advanced analytics and reporting
- [ ] Compliance certifications (ISO 27001, SOC 2)

---

**GENESIS ID** - The unified identity engine for Orden Global Ecosystem 🚀
