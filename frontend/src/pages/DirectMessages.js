import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import ChatWindow from '../components/ChatWindow';
import '../styles/DirectMessages.css';

const DirectMessages = () => {
  const { dmId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinDM, onlineUsers } = useSocket();

  const [dms, setDms] = useState([]);
  const [selectedDM, setSelectedDM] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDM, setShowNewDM] = useState(false);
  const [newDMEmail, setNewDMEmail] = useState('');
  const [privacyNoticeSeen, setPrivacyNoticeSeen] = useState(false);

  useEffect(() => {
    loadDMs();
  }, []);

  useEffect(() => {
    if (dmId) {
      loadDM(dmId);
    }
  }, [dmId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new-message', (message) => {
      if (message.chatType === 'dm' && message.chatId === dmId) {
        setMessages(prev => [...prev, message]);
        // Update DM list
        loadDMs();
      }
    });

    socket.on('message-edited', (message) => {
      if (message.chatType === 'dm' && message.chatId === dmId) {
        setMessages(prev => prev.map(m => m._id === message._id ? message : m));
      }
    });

    socket.on('message-deleted', ({ messageId, forEveryone }) => {
      if (forEveryone) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      }
    });

    socket.on('reaction-added', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, reactions } : m
      ));
    });

    return () => {
      socket.off('new-message');
      socket.off('message-edited');
      socket.off('message-deleted');
      socket.off('reaction-added');
    };
  }, [socket, dmId]);

  const loadDMs = async () => {
    try {
      const response = await api.get('/dm');
      setDms(response.data.dms);
      setLoading(false);
    } catch (error) {
      console.error('Error loading DMs:', error);
      setLoading(false);
    }
  };

  const loadDM = async (id) => {
    try {
      const dmData = dms.find(d => d._id === id);
      setSelectedDM(dmData);
      setPrivacyNoticeSeen(dmData?.privacyNoticeSeen || false);

      if (socket) {
        joinDM(id);
      }

      const response = await api.get(`/dm/${id}/messages`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading DM:', error);
    }
  };

  const handleCreateDM = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/dm', { participantEmail: newDMEmail });
      const dm = response.data.dm;
      setShowNewDM(false);
      setNewDMEmail('');
      navigate(`/dashboard/dm/${dm._id}`);
      loadDMs();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create DM');
    }
  };

  const handlePrivacyNoticeAck = async () => {
    try {
      await api.put(`/dm/${dmId}/settings`, { privacyNoticeSeen: true });
      setPrivacyNoticeSeen(true);
    } catch (error) {
      console.error('Error acknowledging privacy notice:', error);
    }
  };

  const toggleFavorite = async (id, isFavorite) => {
    try {
      await api.put(`/dm/${id}/settings`, { isFavorite: !isFavorite });
      loadDMs();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="direct-messages">
      <div className="dm-sidebar">
        <div className="dm-sidebar-header">
          <h3>Direct Messages</h3>
          <button className="btn-icon" onClick={() => setShowNewDM(true)}>+</button>
        </div>

        {showNewDM && (
          <div className="new-dm-form">
            <form onSubmit={handleCreateDM}>
              <input
                type="email"
                placeholder="Enter email..."
                value={newDMEmail}
                onChange={(e) => setNewDMEmail(e.target.value)}
                required
              />
              <div className="form-actions">
                <button type="submit" className="btn-sm">Start</button>
                <button type="button" className="btn-sm btn-secondary" onClick={() => setShowNewDM(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="dm-list">
          {dms.map(dm => {
            const otherUser = dm.participants.find(p => p._id !== user.id);
            const isOnline = onlineUsers.has(otherUser?._id);
            
            return (
              <div
                key={dm._id}
                className={`dm-item ${dmId === dm._id ? 'active' : ''}`}
                onClick={() => navigate(`/dashboard/dm/${dm._id}`)}
              >
                <div className="dm-item-avatar">
                  {otherUser?.name?.charAt(0).toUpperCase()}
                  {isOnline && !otherUser.isGhostMode && <span className="status-dot online"></span>}
                </div>
                <div className="dm-item-info">
                  <div className="dm-item-header">
                    <span className="dm-item-name">{otherUser?.name}</span>
                    {dm.isFavorite && <span className="favorite-icon">⭐</span>}
                  </div>
                  <span className="dm-item-email">{otherUser?.email}</span>
                </div>
                <button
                  className="btn-icon-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(dm._id, dm.isFavorite);
                  }}
                >
                  {dm.isFavorite ? '★' : '☆'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dm-main">
        {!dmId ? (
          <div className="empty-state">
            <p>Select a conversation or start a new one</p>
          </div>
        ) : (
          <>
            {!privacyNoticeSeen && (
              <div className="privacy-notice">
                <p>Your DM may be read by the admin, but not always.</p>
                <button onClick={handlePrivacyNoticeAck} className="btn-sm">
                  Got it
                </button>
              </div>
            )}
            <ChatWindow
              chatId={dmId}
              chatType="dm"
              messages={messages}
              chat={selectedDM}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;
