import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/Requests.css';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSendRequest, setShowSendRequest] = useState(false);
  const [requestData, setRequestData] = useState({
    email: '',
    message: ''
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await api.get('/requests');
      setRequests(response.data.requests);
      setLoading(false);
    } catch (error) {
      console.error('Error loading requests:', error);
      setLoading(false);
    }
  };

  const handleRequest = async (requestId, action) => {
    try {
      await api.put(`/requests/${requestId}`, { action });
      loadRequests();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to handle request');
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests/friend', requestData);
      setShowSendRequest(false);
      setRequestData({ email: '', message: '' });
      alert('Friend request sent!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send request');
    }
  };

  const getRequestTypeLabel = (type) => {
    const labels = {
      friend: 'Friend Request',
      invite: 'Invite Request',
      email: 'Email Request',
      website: 'Website Contact'
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="requests">
      <div className="requests-header">
        <h2>Requests</h2>
        <button className="btn-primary" onClick={() => setShowSendRequest(true)}>
          Send Friend Request
        </button>
      </div>

      {showSendRequest && (
        <div className="modal-overlay" onClick={() => setShowSendRequest(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Send Friend Request</h3>
            <form onSubmit={handleSendRequest}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={requestData.email}
                  onChange={(e) => setRequestData({ ...requestData, email: e.target.value })}
                  required
                  placeholder="friend@email.com"
                />
              </div>
              <div className="form-group">
                <label>Message (optional)</label>
                <textarea
                  value={requestData.message}
                  onChange={(e) => setRequestData({ ...requestData, message: e.target.value })}
                  placeholder="Say something..."
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Send</button>
                <button type="button" className="btn-secondary" onClick={() => setShowSendRequest(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="requests-list">
        {requests.length === 0 ? (
          <div className="empty-state">
            <p>No pending requests</p>
          </div>
        ) : (
          requests.map(request => (
            <div key={request._id} className="request-item">
              <div className="request-header">
                <span className="request-type">{getRequestTypeLabel(request.type)}</span>
                <span className="request-date">
                  {new Date(request.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="request-body">
                {request.from && (
                  <div className="request-from">
                    <strong>From:</strong> {request.from.name} ({request.from.email})
                  </div>
                )}
                {request.fromEmail && (
                  <div className="request-from">
                    <strong>From:</strong> {request.fromEmail}
                  </div>
                )}
                {request.message && (
                  <div className="request-message">
                    <strong>Message:</strong> {request.message}
                  </div>
                )}
              </div>

              <div className="request-actions">
                <button
                  className="btn-success"
                  onClick={() => handleRequest(request._id, 'accept')}
                >
                  Accept
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleRequest(request._id, 'ignore')}
                >
                  Ignore
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Requests;
