import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile';
import FilmPage from './pages/FilmPage';
import SearchResultsPage from './pages/SearchResultsPage';
import Authorization from './auth/Authorization';
import GenresPage from './pages/GenresPage';
import './App.css';
import api from './api/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authType, setAuthType] = useState('login');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationColor, setNotificationColor] = useState('');

  useEffect(() => {
    // Загружаем сохраненную тему при старте приложения
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    const id = localStorage.getItem('userId');

    if (token && email && id) {
      setIsLoggedIn(true);
      setUserEmail(email);
      setUserId(id);
    }
  }, []);

  const handleAuthClick = (type) => {
    setAuthType(type);
    setShowAuth(true);
  };

  const handleCloseAuth = () => {
    setShowAuth(false);
  };

  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setUserEmail(user.email);
    setUserId(user._id);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUserEmail('');
    setUserId(null);
    window.location.href = '/'; // Принудительный переход на главную страницу
  };

  const onShowNotification = (message, color) => {
    setNotificationMessage(message);
    setNotificationColor(color);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  return (
    <Router>
      <div className="app">
        <Navbar
          onAuthClick={handleAuthClick}
          isLoggedIn={isLoggedIn}
          userEmail={userEmail}
          userId={userId}
          onLogout={handleLogout}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/film/:id" element={<FilmPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/genres" element={<GenresPage />} />
        </Routes>
        {showAuth && (
          <Authorization
            onClose={handleCloseAuth}
            type={authType}
            onLogin={handleLogin}
            onShowNotification={onShowNotification}
          />
        )}
        {showNotification && (
          <div
            className="notification"
            style={{ backgroundColor: notificationColor }}
          >
            {notificationMessage}
          </div>
        )}
    </div>
    </Router>
  );
}

export default App;
