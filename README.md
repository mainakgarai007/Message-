# Human-Like Private Messaging Platform

A clean, privacy-focused messaging platform with automation that feels completely human. No bot-like behavior, no social media noise.

## 🎯 Core Features

### Navigation (STRICT)
- **DM** - Direct Messages
- **Groups** - Group conversations
- **Requests** - Friend/invite requests
- **Settings** - User preferences

**Note:** NO Chat tab, Home feed, or Explore pages

### Key Capabilities
- ✉️ Email-based authentication with verification
- 💬 Direct messaging with privacy notice
- 👥 Group messaging with @mentions
- 🤖 Per-chat bot modes (ON/MANUAL/AUTO)
- 🌍 Auto language detection (English, Hindi, Bengali, Hinglish, Benglish)
- 😊 Emoji support with picker
- ⭐ Favorite conversations
- 🔕 Mute/Block features
- 📌 Pin messages
- ⏰ Expiring messages
- 🔍 Message search
- ✏️ Edit messages (2-3 min window)
- 🗑️ Delete for me/everyone
- 👍 Limited reactions (👍 ❤️ 😂 😮 😢)
- 🟢 Active-now indicator
- 👻 Ghost mode (admin only)

### Message Commands
- `@fix` - Fix grammar
- `@emoji` - Add emoji
- `@short` - Shorten message
- `@polite` - Make polite

### Automation Features
- **Bot Modes** (per DM/Group):
  - **ON** - Always automated
  - **MANUAL** - Never automated
  - **AUTO** - Smart decision (admin inactive = auto reply)
- **Language Mirroring** - Replies match user's language
- **Relationship-Based Behavior**:
  - close_friend → friendly, light humor
  - brother → same as close_friend + advice
  - sister → respectful, caring
  - crush → clean, calm, very safe
  - friend → neutral
  - unknown → guarded
  - customer → professional support
- **Emotional Awareness** - Detects sad/tired/stressed/angry and adjusts
- **Human-like Delays** - Random 1-3 second typing delays
- **Admin Knowledge Store** - "About Me" system for factual responses

### Safety & Privacy
- Email = unique User ID
- Email verification mandatory
- Login required for all interactions
- Privacy notice on first DM open
- No public profiles
- No last seen tracking
- Admin can read DMs (transparent)

### Explicitly Excluded
- ❌ Stories
- ❌ Reels
- ❌ Feeds
- ❌ Voice/video calls
- ❌ Public profiles
- ❌ Words "bot", "AI", or "assistant" in UI

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.io (real-time)
- JWT authentication
- Nodemailer (email verification)
- Bcrypt (password hashing)

### Frontend
- React 18
- React Router v6
- Socket.io-client
- Axios
- Emoji Picker React

## 📦 Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (v4+)
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/mainakgarai007/Message-.git
cd Message-
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/message-platform
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_FROM=noreply@messageplatform.com
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

5. **Start MongoDB**
```bash
mongod
```

6. **Run the application**

In development mode:
```bash
npm run dev
```

Or run separately:
```bash
# Backend
npm run server

# Frontend (in another terminal)
npm run client
```

7. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📱 Usage

### First Time Setup
1. Register with email
2. Verify email via link sent
3. Login with credentials

### Creating Conversations
- **DM**: Click + in DM tab, enter friend's email
- **Group**: Click + in Groups tab, enter name and member emails

### Admin Features
- Set user as admin in database: `db.users.updateOne({email: "admin@example.com"}, {$set: {isAdmin: true}})`
- Access "About Me" knowledge store in Settings
- Toggle Ghost Mode in Settings
- Change bot modes per DM/Group

### Bot Modes
Each DM and Group has independent bot mode:
- **ON** - Automation always replies
- **MANUAL** - Only manual replies (no automation)
- **AUTO** - Smart mode (automation silent when admin active)

Admin can change bot mode in DM/Group settings (UI to be enhanced).

## 🏗️ Project Structure

```
Message-/
├── backend/
│   ├── server.js                 # Main server with Socket.io
│   └── src/
│       ├── controllers/          # Route controllers
│       ├── models/              # Mongoose models
│       ├── routes/              # Express routes
│       ├── middleware/          # Auth & other middleware
│       ├── services/            # Automation service
│       └── utils/               # Utilities (email, JWT, language)
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/          # React components
│       ├── pages/               # Page components
│       ├── contexts/            # React contexts (Auth, Socket)
│       ├── services/            # API service
│       ├── styles/              # CSS files
│       ├── App.js
│       └── index.js
├── package.json
└── README.md
```

## 🔧 Configuration

### Email Setup (Gmail)
1. Enable 2-factor authentication
2. Generate app-specific password
3. Use in EMAIL_PASS environment variable

### MongoDB Setup
- Local: `mongodb://localhost:27017/message-platform`
- Cloud (MongoDB Atlas): Get connection string and update MONGODB_URI

### Production Deployment
1. Set NODE_ENV=production
2. Update CLIENT_URL to production domain
3. Use secure JWT_SECRET (32+ characters)
4. Enable HTTPS
5. Configure production MongoDB
6. Build frontend: `cd frontend && npm run build`

## 🎨 Customization

### Adding Languages
Edit `/backend/src/utils/language.js`:
- Add language patterns
- Update `detectLanguage()` function
- Add language-specific responses in automation service

### Adding Relationship Types
Edit `/backend/src/models/DirectMessage.js`:
- Add to enum array
- Update automation service with behavior logic

### Modifying Bot Behavior
Edit `/backend/src/services/automationService.js`:
- Adjust response generation
- Modify emotional keyword detection
- Change language mirroring logic

## 🔐 Security

### Recent Security Updates
- **2024-02**: Updated nodemailer to v7.0.7 to patch email domain vulnerability (CVE)

### Security Features
- Password hashing with bcrypt (10 salt rounds)
- JWT token authentication
- Email verification required
- Rate limiting (can be added)
- Helmet.js security headers
- Input validation
- XSS protection
- MongoDB injection prevention

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env

### Email Not Sending
- Verify EMAIL_USER and EMAIL_PASS
- Check email provider settings
- Enable "Less secure apps" or use app password

### Socket.io Not Connecting
- Check CORS settings in server.js
- Verify CLIENT_URL matches frontend URL
- Check firewall/network settings

### Port Already in Use
- Change PORT in .env
- Kill process using port: `lsof -ti:5000 | xargs kill`

## 📝 API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/verify-email` - Verify email with token
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/profile` - Update profile
- POST `/api/auth/ghost-mode` - Toggle ghost mode

### Direct Messages
- GET `/api/dm` - Get all DMs
- POST `/api/dm` - Create/get DM
- PUT `/api/dm/:dmId/settings` - Update DM settings
- GET `/api/dm/:dmId/messages` - Get messages
- GET `/api/dm/:dmId/search` - Search messages

### Groups
- GET `/api/groups` - Get all groups
- POST `/api/groups` - Create group
- PUT `/api/groups/:groupId/settings` - Update settings
- POST `/api/groups/:groupId/members` - Add members
- GET `/api/groups/:groupId/messages` - Get messages

### Messages
- POST `/api/messages` - Send message
- PUT `/api/messages/:messageId/edit` - Edit message
- DELETE `/api/messages/:messageId` - Delete message
- POST `/api/messages/:messageId/reaction` - Add reaction
- POST `/api/messages/:messageId/pin` - Pin message

### Requests
- GET `/api/requests` - Get requests
- POST `/api/requests/friend` - Send friend request
- PUT `/api/requests/:requestId` - Accept/ignore request

### About Me (Admin Only)
- GET `/api/about-me` - Get all entries
- POST `/api/about-me` - Add entry
- PUT `/api/about-me/:id` - Update entry
- DELETE `/api/about-me/:id` - Delete entry

## 🤝 Contributing

This is a specific implementation project. For modifications:
1. Follow existing code structure
2. Maintain human-like behavior principles
3. Never expose automation in UI
4. Test all bot modes independently
5. Ensure language detection works correctly

## 📄 License

ISC

## 👥 Support

For issues or questions, please open an issue on GitHub.

---

**Remember:** The platform should NEVER feel like a bot. Automation must be invisible and human-like at all times.