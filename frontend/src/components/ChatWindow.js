import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import '../styles/ChatWindow.css';

const ChatWindow = ({ chatId, chatType, messages, chat }) => {
  const { user } = useAuth();
  const { sendMessage, startTyping, stopTyping, editMessage, deleteMessage, addReaction, typingUsers } = useSocket();
  
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReactions, setShowReactions] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const reactions = ['👍', '❤️', '😂', '😮', '😢'];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessageChange = (e) => {
    setMessageText(e.target.value);
    
    // Typing indicator
    startTyping(chatType, chatId);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(chatType, chatId);
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;

    if (editingMessage) {
      editMessage(editingMessage._id, messageText);
      setEditingMessage(null);
    } else {
      const messageData = {
        content: messageText,
        chatType,
        chatId,
        replyTo: replyingTo?._id || null,
        mentionedUsers: extractMentions(messageText)
      };
      
      sendMessage(messageData);
      setReplyingTo(null);
    }

    setMessageText('');
    stopTyping(chatType, chatId);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const extractMentions = (text) => {
    if (chatType !== 'group') return [];
    
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const member = chat?.members?.find(m => 
        m.user.name.toLowerCase().includes(username.toLowerCase())
      );
      if (member) {
        mentions.push(member.user._id);
      }
    }
    
    return mentions;
  };

  const handleEmojiClick = (emojiData) => {
    setMessageText(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setMessageText(message.content);
  };

  const handleDeleteMessage = (messageId) => {
    const forEveryone = window.confirm('Delete for everyone? (Cancel for delete for me only)');
    deleteMessage(messageId, forEveryone);
  };

  const handleReaction = (messageId, emoji) => {
    addReaction(messageId, emoji);
    setShowReactions(null);
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const applyCommand = (command) => {
    switch (command) {
      case '@fix':
        let fixed = messageText.trim();
        fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1);
        if (!/[.!?]$/.test(fixed)) {
          fixed += '.';
        }
        setMessageText(fixed);
        break;
      case '@emoji':
        setShowEmojiPicker(true);
        break;
      case '@short':
        const words = messageText.split(' ');
        if (words.length > 10) {
          setMessageText(words.slice(0, 10).join(' ') + '...');
        }
        break;
      case '@polite':
        let polite = messageText;
        if (!polite.toLowerCase().includes('please')) {
          polite = 'Please ' + polite.toLowerCase();
        }
        if (!polite.includes('thank')) {
          polite += '. Thank you.';
        }
        setMessageText(polite.charAt(0).toUpperCase() + polite.slice(1));
        break;
      default:
        break;
    }
  };

  const isTyping = typingUsers[`${chatType}:${chatId}`]?.length > 0;

  const getOtherUser = () => {
    if (chatType === 'dm' && chat) {
      return chat.participants?.find(p => p._id !== user.id);
    }
    return null;
  };

  const otherUser = getOtherUser();

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          {chatType === 'dm' && otherUser && (
            <>
              <h3>{otherUser.name}</h3>
              <span className="chat-header-email">{otherUser.email}</span>
            </>
          )}
          {chatType === 'group' && chat && (
            <>
              <h3>{chat.name}</h3>
              <span className="chat-header-members">{chat.members?.length} members</span>
            </>
          )}
        </div>
        <div className="chat-header-actions">
          <button className="btn-icon" onClick={() => setShowSearch(!showSearch)}>🔍</button>
        </div>
      </div>

      {showSearch && (
        <div className="chat-search">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      <div className="chat-messages">
        {messages
          .filter(msg => !searchQuery || msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((message, index) => {
            const isOwn = message.sender._id === user.id;
            const showSender = chatType === 'group' && !isOwn;

            return (
              <div
                key={message._id}
                className={`message ${isOwn ? 'message-own' : 'message-other'}`}
              >
                {showSender && (
                  <div className="message-sender">{message.sender.replyName || message.sender.name}</div>
                )}
                
                {message.replyTo && (
                  <div className="message-reply-indicator">
                    Replying to: {message.replyTo.content?.substring(0, 50)}...
                  </div>
                )}

                <div className="message-bubble">
                  {message.label && (
                    <div className="message-label">{message.label}</div>
                  )}
                  
                  <div className="message-content">{message.content}</div>
                  
                  {message.isEdited && (
                    <span className="message-edited">(edited)</span>
                  )}

                  {message.reactions && message.reactions.length > 0 && (
                    <div className="message-reactions">
                      {message.reactions.map((reaction, idx) => (
                        <span key={idx} className="reaction">{reaction.emoji}</span>
                      ))}
                    </div>
                  )}

                  <div className="message-time">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="message-actions">
                  <button className="btn-icon-sm" onClick={() => handleReply(message)}>↩️</button>
                  <button className="btn-icon-sm" onClick={() => setShowReactions(message._id)}>😊</button>
                  {isOwn && (
                    <>
                      <button className="btn-icon-sm" onClick={() => handleEditMessage(message)}>✏️</button>
                      <button className="btn-icon-sm" onClick={() => handleDeleteMessage(message._id)}>🗑️</button>
                    </>
                  )}
                </div>

                {showReactions === message._id && (
                  <div className="reaction-picker">
                    {reactions.map(emoji => (
                      <button
                        key={emoji}
                        className="reaction-btn"
                        onClick={() => handleReaction(message._id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {isTyping && (
          <div className="typing-indicator">
            <span>typing…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {replyingTo && (
        <div className="reply-preview">
          <span>Replying to: {replyingTo.content.substring(0, 50)}...</span>
          <button onClick={() => setReplyingTo(null)}>✕</button>
        </div>
      )}

      <div className="chat-input-container">
        <div className="chat-commands">
          <button className="cmd-btn" onClick={() => applyCommand('@fix')} title="Fix grammar">@fix</button>
          <button className="cmd-btn" onClick={() => applyCommand('@emoji')} title="Add emoji">@emoji</button>
          <button className="cmd-btn" onClick={() => applyCommand('@short')} title="Shorten">@short</button>
          <button className="cmd-btn" onClick={() => applyCommand('@polite')} title="Make polite">@polite</button>
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-form">
          <button
            type="button"
            className="btn-icon"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😊
          </button>

          <input
            type="text"
            value={messageText}
            onChange={handleMessageChange}
            placeholder="Type a message..."
            className="chat-input"
          />

          <button type="submit" className="btn-send" disabled={!messageText.trim()}>
            Send
          </button>
        </form>

        {showEmojiPicker && (
          <div className="emoji-picker-container">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
