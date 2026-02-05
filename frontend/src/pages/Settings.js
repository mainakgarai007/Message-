import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Settings.css';

const Settings = () => {
  const { user, logout, updateProfile, toggleGhostMode } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    replyName: user?.replyName || ''
  });
  const [showAboutMe, setShowAboutMe] = useState(false);
  const [aboutMeData, setAboutMeData] = useState([]);
  const [newAboutMe, setNewAboutMe] = useState({ key: '', value: '', category: 'other' });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileData);
      setEditMode(false);
      alert('Profile updated successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleToggleGhostMode = async () => {
    try {
      await toggleGhostMode();
      alert('Ghost mode toggled');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to toggle ghost mode');
    }
  };

  const loadAboutMe = async () => {
    try {
      const response = await api.get('/about-me');
      setAboutMeData(response.data.data);
      setShowAboutMe(true);
    } catch (error) {
      console.error('Error loading about me:', error);
    }
  };

  const handleAddAboutMe = async (e) => {
    e.preventDefault();
    try {
      await api.post('/about-me', newAboutMe);
      setNewAboutMe({ key: '', value: '', category: 'other' });
      loadAboutMe();
      alert('Added successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add');
    }
  };

  const handleDeleteAboutMe = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await api.delete(`/about-me/${id}`);
      loadAboutMe();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="settings">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>Profile</h3>
        <div className="settings-item">
          <strong>Email:</strong> {user?.email}
        </div>
        
        {!editMode ? (
          <>
            <div className="settings-item">
              <strong>Name:</strong> {user?.name}
            </div>
            <div className="settings-item">
              <strong>Reply Name:</strong> {user?.replyName}
            </div>
            <button className="btn-secondary" onClick={() => setEditMode(true)}>
              Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleUpdateProfile} className="edit-profile-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Reply Name</label>
              <input
                type="text"
                value={profileData.replyName}
                onChange={(e) => setProfileData({ ...profileData, replyName: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" className="btn-secondary" onClick={() => setEditMode(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="settings-section">
        <h3>Language</h3>
        <div className="settings-item">
          <strong>Detection:</strong> Auto (read-only)
        </div>
        <p className="settings-note">
          Language is automatically detected based on your messages.
          Supported: English, Hindi, Bengali, Hinglish, Benglish
        </p>
      </div>

      {user?.isAdmin && (
        <>
          <div className="settings-section">
            <h3>Admin Features</h3>
            <div className="settings-item">
              <button className="btn-secondary" onClick={handleToggleGhostMode}>
                {user?.isGhostMode ? 'Disable' : 'Enable'} Ghost Mode
              </button>
              <p className="settings-note">
                Ghost mode hides your online status from others
              </p>
            </div>

            <div className="settings-item">
              <button className="btn-secondary" onClick={loadAboutMe}>
                {showAboutMe ? 'Refresh' : 'Manage'} About Me
              </button>
            </div>
          </div>

          {showAboutMe && (
            <div className="settings-section">
              <h3>About Me Knowledge Store</h3>
              <p className="settings-note">
                Add facts that automation can use. Never guess - only use data here.
              </p>

              <form onSubmit={handleAddAboutMe} className="about-me-form">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Key (e.g., 'brother name')"
                    value={newAboutMe.key}
                    onChange={(e) => setNewAboutMe({ ...newAboutMe, key: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Value (e.g., 'Bittu')"
                    value={newAboutMe.value}
                    onChange={(e) => setNewAboutMe({ ...newAboutMe, value: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <select
                    value={newAboutMe.category}
                    onChange={(e) => setNewAboutMe({ ...newAboutMe, category: e.target.value })}
                  >
                    <option value="personal">Personal</option>
                    <option value="relationships">Relationships</option>
                    <option value="preferences">Preferences</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary">Add</button>
              </form>

              <div className="about-me-list">
                {aboutMeData.map(item => (
                  <div key={item._id} className="about-me-item">
                    <div className="about-me-content">
                      <strong>{item.key}:</strong> {item.value}
                      <span className="about-me-category">({item.category})</span>
                    </div>
                    <button
                      className="btn-danger-sm"
                      onClick={() => handleDeleteAboutMe(item._id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="settings-section">
        <button className="btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;
