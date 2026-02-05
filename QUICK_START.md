# Quick Start Guide

Get the Human-Like Messaging Platform running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js v14 or higher: `node --version`
- ✅ npm v6 or higher: `npm --version`
- ✅ MongoDB v4 or higher: `mongod --version`
- ✅ Git: `git --version`

## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/mainakgarai007/Message-.git
cd Message-
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Setup Environment Variables
```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` file with your settings:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/message-platform
JWT_SECRET=your_random_secret_key_minimum_32_characters_long
JWT_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=noreply@messageplatform.com
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Important**: For Gmail, you need an "App Password":
1. Go to Google Account settings
2. Security → 2-Step Verification (enable if not enabled)
3. Security → App passwords
4. Generate password for "Mail"
5. Use this 16-character password in EMAIL_PASS

### 4. Start MongoDB
```bash
# Option 1: If MongoDB is installed locally
mongod

# Option 2: Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Run the Application
```bash
# Start both backend and frontend (recommended)
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend (in another terminal)
cd frontend
npm start
```

### 6. Access the Application
Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/health

## First Steps

### Create Your First Account

1. **Register**
   - Go to http://localhost:3000/register
   - Enter your name, email, and password
   - Click "Register"

2. **Verify Email**
   - Check your email inbox
   - Click the verification link
   - You'll be automatically logged in

3. **Start Messaging**
   - Click on "DM" tab
   - Click the "+" button
   - Enter a friend's email
   - Start chatting!

### Create Your First Group

1. Click on "Groups" tab
2. Click the "+" button
3. Enter group name
4. Add member emails (comma-separated)
5. Click "Create"

### Explore Features

Try these features:
- ✨ Send a message with emoji picker
- 🎯 Reply to a message
- 👍 Add reactions (limited to 👍 ❤️ 😂 😮 😢)
- ✏️ Edit a message within 3 minutes
- 🗑️ Delete a message
- ⭐ Favorite a conversation
- 🔍 Search messages
- 📌 Pin important messages

### Test Message Commands

In any chat, try these commands:
- Type a message and click `@fix` to fix grammar
- Type a message and click `@emoji` to add emoji
- Type a long message and click `@short` to shorten
- Type a message and click `@polite` to make it polite

## Create an Admin Account

To access admin features (Bot Modes, About Me, Ghost Mode):

1. Register a regular account first
2. Open MongoDB shell:
```bash
mongo message-platform
```

3. Make your account admin:
```javascript
db.users.updateOne(
  { email: "your_email@example.com" },
  { $set: { isAdmin: true } }
)
```

4. Logout and login again
5. Go to Settings to see admin features

## Admin Features

As an admin, you can:

### 1. Manage "About Me" Knowledge
- Go to Settings
- Click "Manage About Me"
- Add facts about yourself
- Automation will use ONLY this data (never guesses)

Example entries:
- Key: "brother name" → Value: "Bittu"
- Key: "favorite fruit" → Value: "mango"
- Key: "profession" → Value: "software developer"

### 2. Toggle Ghost Mode
- In Settings, click "Enable Ghost Mode"
- Your online status becomes invisible
- Users won't see your green dot

### 3. Set Bot Modes (Per Chat)
Currently, bot mode is set via API. Future UI enhancement planned.

Change bot mode via MongoDB:
```javascript
// For a DM
db.directmessages.updateOne(
  { _id: ObjectId("dm_id_here") },
  { $set: { botMode: "AUTO" } }  // or "ON" or "MANUAL"
)

// For a Group
db.groups.updateOne(
  { _id: ObjectId("group_id_here") },
  { $set: { botMode: "MANUAL" } }
)
```

Bot Mode explanations:
- **ON**: Automation always replies
- **MANUAL**: Automation never replies (admin only)
- **AUTO**: Smart mode - automation silent when admin is active

### 4. Set Relationship Types (For DMs)
```javascript
db.directmessages.updateOne(
  { _id: ObjectId("dm_id_here") },
  { $set: { relationshipType: "brother" } }
)
```

Types:
- `close_friend` - Friendly, light humor
- `brother` - Same as close_friend + advice
- `sister` - Respectful, caring
- `crush` - Clean, calm, very safe
- `friend` - Neutral
- `unknown` - Guarded
- `customer` - Professional support

## Testing Language Detection

The platform automatically detects these languages:

1. **English**: "Hello, how are you?"
2. **Hindi**: "नमस्ते, कैसे हो?"
3. **Bengali**: "হ্যালো, কেমন আছো?"
4. **Hinglish**: "Hey yaar, kya chal raha hai?"
5. **Benglish**: "Hello, kemon acho?"

Automation replies will mirror your language style!

## Testing Emotional Detection

Try sending messages with emotional keywords:

- **Sad**: "I'm feeling sad today"
- **Tired**: "I'm so exhausted"
- **Stressed**: "I'm really stressed out"
- **Angry**: "I'm so angry right now"

Automation will respond appropriately without jokes/roasts.

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Or check process
ps aux | grep mongod

# Start MongoDB
sudo systemctl start mongod
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
kill -9 $(lsof -ti:5000)

# Or change PORT in .env file
```

### Email Not Sending
1. Verify EMAIL_USER and EMAIL_PASS in .env
2. Ensure 2FA is enabled on Gmail
3. Use App Password (not regular password)
4. Check spam folder

### Frontend Not Loading
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Can't Login After Registration
- Check if verification email arrived
- Click the verification link
- If link expired, register again

### Socket.io Not Connecting
- Check if backend is running on port 5000
- Verify CLIENT_URL in .env matches frontend URL
- Check browser console for errors

## Next Steps

Now that you're up and running:

1. **Explore the UI**
   - Navigate through DM, Groups, Requests, Settings tabs
   - Notice the clean, simple interface
   - No "bot" or "AI" mentioned anywhere!

2. **Test Automation**
   - Create a DM with yourself
   - Send a message
   - See how automation responds based on bot mode

3. **Customize**
   - Add your personal facts in "About Me"
   - Set relationship types for contacts
   - Configure bot modes per conversation

4. **Read Full Documentation**
   - Check README.md for complete feature list
   - See DEPLOYMENT.md for production setup
   - Read CONTRIBUTING.md to contribute

5. **Join the Community**
   - Report issues on GitHub
   - Suggest features
   - Share your experience

## Common Use Cases

### Personal Use
- Chat with friends and family
- Create private groups
- Keep conversations organized

### Small Team
- Internal team communication
- Project-specific groups
- Quick decision making

### Customer Support
- Set bot mode to AUTO
- Add business info in "About Me"
- Set relationship type to "customer"
- Get automated responses when offline

### Testing/Development
- Test chat applications
- Learn React/Node.js
- Study real-time communication
- Understand automation patterns

## Performance Tips

For better performance:

1. **Use in Production Mode**
   ```bash
   NODE_ENV=production npm start
   ```

2. **Enable Database Indexes**
   MongoDB indexes are created automatically

3. **Optimize Images**
   Currently no image support, but plan accordingly

4. **Use PM2 for Production**
   See DEPLOYMENT.md for details

## Security Checklist

- [ ] Changed default JWT_SECRET
- [ ] Using app-specific email password
- [ ] MongoDB has authentication enabled
- [ ] Firewall configured (production)
- [ ] HTTPS enabled (production)
- [ ] Regular backups configured
- [ ] Dependencies up to date: `npm audit`

## Getting Help

If you're stuck:

1. **Check Logs**
   - Backend: Terminal running `npm run server`
   - Frontend: Browser console (F12)
   - MongoDB: `/var/log/mongodb/mongod.log`

2. **Search Issues**
   - GitHub Issues: Existing solutions
   - Stack Overflow: Common problems

3. **Ask Questions**
   - Open a GitHub Issue
   - Tag with "question" label
   - Provide error details

4. **Read Documentation**
   - README.md - Full features
   - DEPLOYMENT.md - Production setup
   - CONTRIBUTING.md - Development guide

## Success!

You're now running a human-like messaging platform! 🎉

Remember:
- Automation should feel human
- No bot-like behavior
- Privacy is paramount
- Each chat has independent settings

Enjoy chatting! 💬
