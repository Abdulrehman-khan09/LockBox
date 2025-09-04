# 🛡️ Report Portal

A secure, privacy-focused complaint management system built with the MERN stack. Enables anonymous users to submit encrypted complaints while allowing organizations to manage and respond to them securely.

## 🌟 Features

### For Anonymous Users
- 📝 **Submit Complaints Anonymously** - No registration required
- 🔐 **End-to-End Encryption** - Complaints encrypted before transmission using libsodium
- 🔍 **Track Complaints** - Receive tracking codes via email
- 📧 **Email Notifications** - Get updates on complaint status

### For Organizations/Admins
- 🏢 **Organization Registration** - Register your organization
- ✅ **Email Verification** - Secure email verification system
- 🔑 **Client-Side Key Generation** - Private keys never leave your browser
- 📊 **Admin Dashboard** - Manage and respond to complaints
- 🔓 **Decrypt Complaints** - Use your private key to decrypt sensitive reports
- 💬 **Response System** - Respond to complaints and update status

## 🏗️ Architecture

### Security-First Design
- **Zero-Knowledge Backend** - Private keys never stored on server
- **Client-Side Encryption** - Public/private key pairs generated in browser
- **JWT Authentication** - Secure admin authentication
- **Email Verification** - Prevents unauthorized access

### Tech Stack
- **Frontend**: React.js with React Router
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Encryption**: libsodium for public-key cryptography
- **Authentication**: JWT tokens with email verification
- **Email Service**: Nodemailer with Gmail SMTP

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Gmail account for SMTP

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd report-portal
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   ```

4. **Environment Variables**
   
   Create `server/.env` file:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # Gmail SMTP Configuration
   EMAIL_FROM="Report Portal <your-email@gmail.com>"
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   CLIENT_URL=http://localhost:3000
   ```

5. **Start the Application**
   
   Backend (Terminal 1):
   ```bash
   cd server
   npm run dev
   ```
   
   Frontend (Terminal 2):
   ```bash
   cd client
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📧 Gmail Setup

To enable email functionality:

1. Go to Google Account → Security → 2FA (enable if not already)
2. Generate App Password: Security → App Passwords
3. Use the generated 16-character password in `EMAIL_PASS`
4. Use your Gmail address in `EMAIL_USER`

## 🛠️ API Endpoints

### Admin Authentication
```
POST   /api/admin/register        - Register new organization
GET    /api/admin/verify-email/:token - Verify email address
POST   /api/admin/login           - Admin login
POST   /api/admin/logout          - Admin logout
```

### Complaints (Coming Soon)
```
POST   /api/complaints            - Submit new complaint
GET    /api/complaints/track/:code - Track complaint status
GET    /api/admin/complaints      - Get all complaints (admin)
PUT    /api/admin/complaints/:id  - Update complaint status
```

## 🔐 Security Features

### Encryption Workflow
1. **Admin Registration**: Public/private key pair generated in browser
2. **Key Storage**: Only public key sent to server
3. **Complaint Submission**: Complaint encrypted with organization's public key
4. **Decryption**: Admin uses private key (stored locally) to decrypt

### Authentication Flow
1. **Registration**: Admin registers → email verification required
2. **Login**: JWT token generated → stored in cookies + localStorage
3. **Protected Routes**: Middleware validates JWT on each request
4. **Logout**: Tokens cleared from all storage

## 🗂️ Project Structure

```
report-portal/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/         # Authentication components
│   │   │   └── lib/          # Utility components
│   │   ├── context/          # React Context (Auth)
│   │   ├── pages/
│   │   │   ├── admin/        # Admin pages
│   │   │   └── organization/ # Public pages
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/                    # Node.js Backend
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Custom middleware
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── server.js            # Main server file
│   └── package.json
│
└── README.md
```



### 📋 Planned
- [ ] Email notifications
- [ ] Complaint tracking system
- [ ] Response management
- [ ] Advanced security features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🔒 Privacy & Security

This application is designed with privacy as a core principle:
- No personal data is stored unnecessarily
- All sensitive data is encrypted
- Private keys never leave the client browser
- Zero-knowledge architecture protects user anonymity

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the documentation
- Review the environment setup

---

**Built with ❤️ for secure, anonymous reporting**