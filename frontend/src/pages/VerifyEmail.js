import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus('success');
        setMessage('Email verified successfully! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard/dm');
        }, 2000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed');
      }
    };

    verify();
  }, [searchParams, verifyEmail, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Email Verification</h1>
        
        {status === 'verifying' && (
          <div className="info-message">
            <p>Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="success-message">
            <p>{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="error-message">
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
