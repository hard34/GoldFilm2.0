import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import './profile.css';
import MovieCard from '../components/MovieCard';
import MovieSlider from '../components/MovieSlider';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [isEditing, setIsEditing] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [recentFilms, setRecentFilms] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const response = await api.get(`/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUserData(response.data);

        // Убираем дубли и пустые значения
        const visited = Array.from(new Set((response.data.visitedFilms || []).filter(Boolean)));

        // Загружаем карточки последних просмотренных фильмов
        const filmPromises = visited.map(id =>
          api.get(`/films/${id}`).then(res => res.data.film).catch(() => null)
        );
        const films = (await Promise.all(filmPromises)).filter(Boolean);
        setRecentFilms(films);

        setWatchedMovies([]); // если нужно, можно реализовать историю просмотров отдельно
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        if (err.response?.status === 401) {
          navigate('/');
        } else {
          setError('Ошибка при загрузке данных пользователя');
        }
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, navigate]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!oldPassword) {
      setError("Введите текущий пароль");
      return;
    }

    if (newPassword !== repeatPassword) {
      setError("Новые пароли не совпадают");
      return;
    }

    if (newPassword.length < 6) {
      setError("Новый пароль должен содержать минимум 6 символов");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Сначала проверяем старый пароль
      const checkResponse = await api.post(
        '/check-password',
        { 
          email: userData.email,
          password: oldPassword 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (checkResponse.data.errors) {
        setError(checkResponse.data.errors[0]);
        return;
      }

      // Если старый пароль верный, меняем на новый
      const response = await api.post(
        `/users/${userId}/change-password`,
        { password: newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setIsEditing(false);
        setOldPassword("");
        setNewPassword("");
        setRepeatPassword("");
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowRepeatPassword(false);
        setError(null);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setError(error.response?.data?.error || "Не удалось изменить пароль");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="error-message">Загрузка...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!userData) return <div className="error-message">Пользователь не найден</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Профиль пользователя</h1>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
      <div className="profile-content">
        <div className="profile-section">
          <h2>Основная информация</h2>
          <p>Email: {userData?.email || 'Не указан'}</p>
          <p>Роль: {userData?.isAdmin ? 'Администратор' : 'Пользователь'}</p>
        </div>

        <div className="profile-section">
          <h2>Безопасность</h2>
          {isEditing ? (
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="password-input-container">
                <input
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Текущий пароль"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <div className="password-input-container">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Новый пароль"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <div className="password-input-container">
                <input
                  type={showRepeatPassword ? "text" : "password"}
                  placeholder="Повторите новый пароль"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                >
                  {showRepeatPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <div className="form-buttons">
                <button type="submit">Сохранить</button>
                <button type="button" onClick={() => {
                  setIsEditing(false);
                  setOldPassword("");
                  setNewPassword("");
                  setRepeatPassword("");
                  setShowOldPassword(false);
                  setShowNewPassword(false);
                  setShowRepeatPassword(false);
                  setError(null);
                }}>
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setIsEditing(true)} className="change-password-button">
              Изменить пароль
            </button>
          )}
        </div>

        <div className="profile-section">
          <h2>Последние просмотренные фильмы</h2>
          <div className="profile-slider">
            {recentFilms.length > 0 ? (
              <MovieSlider title="" movies={recentFilms} moviesPerPage={3} />
            ) : (
              <p>Вы ещё не смотрели фильмы</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 