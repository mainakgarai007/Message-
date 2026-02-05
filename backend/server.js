require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketio = require('socket.io');

// Firebase
const { auth } = require('./src/config/firebase');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const dmRoutes = require('./src/routes/dmRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const requestRoutes = require('./src/routes/requestRoutes');
const userRoutes = require('./src/routes/userRoutes');
const aboutMeRoutes = require('./src/routes/aboutMeRoutes');

// Services
const automationService = require('./src/services/automationService');

// Models
const Message = require('./src/models/Message');
const DirectMessage = require('./src/models/DirectMessage');
const Group = require('./src/models/Group');
const User = require('./src/models/User');
const { detectLanguage } = require('./src/utils/language');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Firebase is initialized in config/firebase.js
console.log('Firebase/Firestore connected');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/about-me', aboutMeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running with Firebase/Firestore' });
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    const user = await User.findById(decodedToken.uid);
    
    if (!user || !user.isVerified) {
      return next(new Error('Authentication error'));
    }

    socket.userId = decodedToken.uid;
    socket.userEmail = user.email;
    socket.isAdmin = user.role === 'admin';
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Store active users and their socket connections
const activeUsers = new Map();
const typingUsers = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Mark user as active
  activeUsers.set(socket.userId, socket.id);
  
  // Notify others that user is online
  socket.broadcast.emit('user-online', { userId: socket.userId });

  // Join user's personal room
  socket.join(`user:${socket.userId}`);

  // Join DM rooms
  socket.on('join-dm', async (dmId) => {
    socket.join(`dm:${dmId}`);
  });

  // Join Group rooms
  socket.on('join-group', async (groupId) => {
    socket.join(`group:${groupId}`);
  });

  // Handle typing indicator
  socket.on('typing-start', ({ chatType, chatId }) => {
    const key = `${chatType}:${chatId}`;
    if (!typingUsers.has(key)) {
      typingUsers.set(key, new Set());
    }
    typingUsers.get(key).add(socket.userId);
    
    socket.to(`${chatType}:${chatId}`).emit('user-typing', {
      userId: socket.userId,
      chatType,
      chatId,
      isTyping: true
    });
  });

  socket.on('typing-stop', ({ chatType, chatId }) => {
    const key = `${chatType}:${chatId}`;
    if (typingUsers.has(key)) {
      typingUsers.get(key).delete(socket.userId);
    }
    
    socket.to(`${chatType}:${chatId}`).emit('user-typing', {
      userId: socket.userId,
      chatType,
      chatId,
      isTyping: false
    });
  });

  // Handle new message
  socket.on('send-message', async (data) => {
    try {
      const { content, chatType, chatId, replyTo, mentionedUsers } = data;

      // Create message
      const message = await Message.create(chatType, chatId, {
        senderId: socket.userId,
        content,
        replyTo: replyTo || null,
        mentionedUsers: mentionedUsers || [],
        isAutomated: false
      });

      // Emit message to chat room
      io.to(`${chatType}:${chatId}`).emit('new-message', message);

      // Check if automation should reply
      let chat;
      let adminUid;
      if (chatType === 'dm') {
        chat = await DirectMessage.findById(chatId);
        // Get admin UID from participants
        const adminUser = await User.findByRole('admin');
        adminUid = adminUser ? adminUser.id : socket.userId;
      } else if (chatType === 'group') {
        chat = await Group.findById(chatId);
        // Get admin UID from members
        const adminUser = await User.findByRole('admin');
        adminUid = adminUser ? adminUser.id : socket.userId;
      }

      if (chat) {
        const isAdminActive = socket.isAdmin && activeUsers.has(socket.userId);
        const shouldReply = await automationService.shouldAutoReply(
          chatId,
          chatType,
          chat.botMode,
          isAdminActive
        );

        if (shouldReply) {
          // Detect language
          const language = detectLanguage(content);
          
          // Get relationship type (for DMs)
          const relationshipType = chatType === 'dm' ? chat.relationshipType : 'friend';

          // Generate reply
          const replyContent = await automationService.generateReply(
            content,
            relationshipType,
            language
          );

          // Add human-like delay
          const delay = automationService.addHumanDelay();

          // Show typing indicator
          setTimeout(() => {
            io.to(`${chatType}:${chatId}`).emit('user-typing', {
              userId: 'automation',
              chatType,
              chatId,
              isTyping: true
            });
          }, 500);

          // Send automated reply
          setTimeout(async () => {
            const autoMessage = await Message.create(chatType, chatId, {
              senderId: adminUid,
              content: replyContent,
              isAutomated: true,
              label: chatType === 'dm' && chat.type !== 'personal' 
                ? `Reply · ${chat.type.charAt(0).toUpperCase() + chat.type.slice(1)}`
                : null
            });

            // Stop typing
            io.to(`${chatType}:${chatId}`).emit('user-typing', {
              userId: 'automation',
              chatType,
              chatId,
              isTyping: false
            });

            // Emit automated message
            io.to(`${chatType}:${chatId}`).emit('new-message', autoMessage);
          }, delay + 1000);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message-error', { message: error.message });
    }
  });

  // Handle message edit
  socket.on('edit-message', async (data) => {
    try {
      const { messageId, content, chatType, chatId } = data;

      const message = await Message.findById(chatType, chatId, messageId);
      if (!message || message.senderId !== socket.userId) {
        return socket.emit('message-error', { message: 'Not authorized' });
      }

      // Check edit window
      const timeDiff = Date.now() - new Date(message.createdAt).getTime();
      const editWindow = 3 * 60 * 1000;
      
      if (timeDiff > editWindow) {
        return socket.emit('message-error', { message: 'Edit window expired' });
      }

      const updatedMessage = await Message.update(chatType, chatId, messageId, {
        content,
        isEdited: true,
        editedAt: Date.now()
      });

      io.to(`${chatType}:${chatId}`).emit('message-edited', updatedMessage);
    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('message-error', { message: error.message });
    }
  });

  // Handle message delete
  socket.on('delete-message', async (data) => {
    try {
      const { messageId, forEveryone, chatType, chatId } = data;

      const message = await Message.findById(chatType, chatId, messageId);
      if (!message || message.senderId !== socket.userId) {
        return socket.emit('message-error', { message: 'Not authorized' });
      }

      if (forEveryone) {
        await Message.deleteForEveryone(chatType, chatId, messageId);
        io.to(`${chatType}:${chatId}`).emit('message-deleted', {
          messageId,
          forEveryone: true
        });
      } else {
        await Message.deleteForUser(chatType, chatId, messageId, socket.userId);
        socket.emit('message-deleted', { messageId, forEveryone: false });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('message-error', { message: error.message });
    }
  });

  // Handle reaction
  socket.on('add-reaction', async (data) => {
    try {
      const { messageId, emoji, chatType, chatId } = data;

      const message = await Message.findById(chatType, chatId, messageId);
      if (!message) {
        return socket.emit('message-error', { message: 'Message not found' });
      }

      const updatedMessage = await Message.addReaction(chatType, chatId, messageId, socket.userId, emoji);

      io.to(`${chatType}:${chatId}`).emit('reaction-added', {
        messageId,
        reactions: updatedMessage.reactions
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit('message-error', { message: error.message });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    activeUsers.delete(socket.userId);
    
    // Clean up typing indicators
    typingUsers.forEach((users, key) => {
      users.delete(socket.userId);
    });

    // Notify others that user is offline
    socket.broadcast.emit('user-offline', { userId: socket.userId });
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
