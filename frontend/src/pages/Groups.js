import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import ChatWindow from '../components/ChatWindow';
import '../styles/Groups.css';

const Groups = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinGroup } = useSocket();

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    memberEmails: ''
  });

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (groupId) {
      loadGroup(groupId);
    }
  }, [groupId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new-message', (message) => {
      if (message.chatType === 'group' && message.chatId === groupId) {
        setMessages(prev => [...prev, message]);
        loadGroups();
      }
    });

    socket.on('message-edited', (message) => {
      if (message.chatType === 'group' && message.chatId === groupId) {
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
  }, [socket, groupId]);

  const loadGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.groups);
      setLoading(false);
    } catch (error) {
      console.error('Error loading groups:', error);
      setLoading(false);
    }
  };

  const loadGroup = async (id) => {
    try {
      const groupData = groups.find(g => g._id === id);
      setSelectedGroup(groupData);

      if (socket) {
        joinGroup(id);
      }

      const response = await api.get(`/groups/${id}/messages`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading group:', error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const memberEmailsArray = newGroupData.memberEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      const response = await api.post('/groups', {
        name: newGroupData.name,
        memberEmails: memberEmailsArray
      });

      const group = response.data.group;
      setShowNewGroup(false);
      setNewGroupData({ name: '', memberEmails: '' });
      navigate(`/dashboard/groups/${group._id}`);
      loadGroups();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create group');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="groups">
      <div className="groups-sidebar">
        <div className="groups-sidebar-header">
          <h3>Groups</h3>
          <button className="btn-icon" onClick={() => setShowNewGroup(true)}>+</button>
        </div>

        {showNewGroup && (
          <div className="new-group-form">
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                placeholder="Group name..."
                value={newGroupData.name}
                onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                required
              />
              <textarea
                placeholder="Member emails (comma separated)..."
                value={newGroupData.memberEmails}
                onChange={(e) => setNewGroupData({ ...newGroupData, memberEmails: e.target.value })}
                rows="3"
              />
              <div className="form-actions">
                <button type="submit" className="btn-sm">Create</button>
                <button type="button" className="btn-sm btn-secondary" onClick={() => setShowNewGroup(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="groups-list">
          {groups.map(group => (
            <div
              key={group._id}
              className={`group-item ${groupId === group._id ? 'active' : ''}`}
              onClick={() => navigate(`/dashboard/groups/${group._id}`)}
            >
              <div className="group-item-avatar">
                {group.name?.charAt(0).toUpperCase()}
              </div>
              <div className="group-item-info">
                <span className="group-item-name">{group.name}</span>
                <span className="group-item-members">{group.members?.length} members</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="groups-main">
        {!groupId ? (
          <div className="empty-state">
            <p>Select a group or create a new one</p>
          </div>
        ) : (
          <ChatWindow
            chatId={groupId}
            chatType="group"
            messages={messages}
            chat={selectedGroup}
          />
        )}
      </div>
    </div>
  );
};

export default Groups;
