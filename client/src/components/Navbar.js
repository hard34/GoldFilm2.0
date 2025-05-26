import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Search from './Search';
import "./navbar.css";
import api from "../api/api";

const Navbar = ({ onAuthClick, isLoggedIn, userEmail, userId, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null);
    setIsMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
    navigate('/');
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
  }, [isLoggedIn]);

  const displayEmail = userEmail ? userEmail.split('@')[0] : '';
  const storedUserId = localStorage.getItem('userId');

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="logo">
          <img src={require('../assets/images/logo/logo_night.png')} alt="Кинотеатр" />
        </Link>
      </div>
      
      <div className={`burger-menu ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
        <div className="burger-line"></div>
        <div className="burger-line"></div>
        <div className="burger-line"></div>
      </div>

      <div className={`navbar-center ${isMenuOpen ? 'active' : ''}`}>
        <Search />
        <Link to="/genres" className="navbar-genres-link" onClick={() => setIsMenuOpen(false)}>
          Категории
        </Link>
      </div>

      <div className={`navbar-right ${isMenuOpen ? 'active' : ''}`}>
        {isLoggedIn && token ? (
          <div className="user-menu">
            <Link to={`/profile/${storedUserId}`} className="user-email" onClick={() => setIsMenuOpen(false)}>
              {displayEmail}
            </Link>
            <button onClick={handleLogout} className="logout-button">
              Выйти
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button onClick={() => {
              onAuthClick('login');
              setIsMenuOpen(false);
            }} className="login-button">
              Войти
            </button>
            <button onClick={() => {
              onAuthClick('register');
              setIsMenuOpen(false);
            }} className="register-button">
              Регистрация
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 