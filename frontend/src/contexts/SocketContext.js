import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      
      const newSocket = io(SOCKET_URL, {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('user-online', ({ userId }) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      newSocket.on('user-offline', ({ userId }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      newSocket.on('user-typing', ({ userId, chatType, chatId, isTyping }) => {
        const key = `${chatType}:${chatId}`;
        setTypingUsers(prev => ({
          ...prev,
          [key]: isTyping ? [...(prev[key] || []), userId] : (prev[key] || []).filter(id => id !== userId)
        }));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  const joinDM = (dmId) => {
    if (socket) {
      socket.emit('join-dm', dmId);
    }
  };

  const joinGroup = (groupId) => {
    if (socket) {
      socket.emit('join-group', groupId);
    }
  };

  const sendMessage = (data) => {
    if (socket) {
      socket.emit('send-message', data);
    }
  };

  const startTyping = (chatType, chatId) => {
    if (socket) {
      socket.emit('typing-start', { chatType, chatId });
    }
  };

  const stopTyping = (chatType, chatId) => {
    if (socket) {
      socket.emit('typing-stop', { chatType, chatId });
    }
  };

  const editMessage = (messageId, content) => {
    if (socket) {
      socket.emit('edit-message', { messageId, content });
    }
  };

  const deleteMessage = (messageId, forEveryone) => {
    if (socket) {
      socket.emit('delete-message', { messageId, forEveryone });
    }
  };

  const addReaction = (messageId, emoji) => {
    if (socket) {
      socket.emit('add-reaction', { messageId, emoji });
    }
  };

  const value = {
    socket,
    connected,
    onlineUsers,
    typingUsers,
    joinDM,
    joinGroup,
    sendMessage,
    startTyping,
    stopTyping,
    editMessage,
    deleteMessage,
    addReaction
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
