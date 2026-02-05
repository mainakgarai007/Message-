import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DirectMessages from './DirectMessages';
import Groups from './Groups';
import Requests from './Requests';
import Settings from './Settings';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <nav className="main-nav">
        <div className="nav-header">
          <h2>Message Platform</h2>
          <span className="user-name">{user?.name}</span>
        </div>
        
        <div className="nav-tabs">
          <NavLink to="/dashboard/dm" className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}>
            DM
          </NavLink>
          <NavLink to="/dashboard/groups" className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}>
            Groups
          </NavLink>
          <NavLink to="/dashboard/requests" className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}>
            Requests
          </NavLink>
          <NavLink to="/dashboard/settings" className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}>
            Settings
          </NavLink>
        </div>
      </nav>

      <div className="dashboard-content">
        <Routes>
          <Route path="/dm" element={<DirectMessages />} />
          <Route path="/dm/:dmId" element={<DirectMessages />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:groupId" element={<Groups />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Navigate to="/dashboard/dm" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
