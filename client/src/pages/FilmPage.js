import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import './FilmPage.css';
import KinoboxPlayer from '../components/KinoboxPlayer';

const API_KEY = '8c8e1a50-6322-4135-8875-5d40a5420d86';

// Список запрещенных слов (можно расширить)
const BAD_WORDS = ['блять', 'хуй', 'пизда', 'ебать', 'сука', 'нахуй', 'бля', 'хуя', 'пиздец', 'ебаный'];

// Функция для фильтрации текста
const filterText = (text) => {
  if (!text) return '';
  let filtered = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  return filtered;
};

const FilmPage = () => {
  const { id } = useParams();
  const [film, setFilm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastSavedFilmId = useRef(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Для рейтинга и комментариев
  const [ratings, setRatings] = useState([]);
  const [userLike, setUserLike] = useState(null); // true/false/null
  const [userComment, setUserComment] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshRatings, setRefreshRatings] = useState(false);
  const [hasUserComment, setHasUserComment] = useState(false);

  useEffect(() => {
    const fetchFilm = async () => {
      try {
        const response = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/${id}`, {
          headers: {
            'X-API-KEY': API_KEY,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();

        // Сохраняем информацию о фильме в нашу базу данных
        try {
          await api.post('/films', {
            kinopoiskId: data.kinopoiskId,
            nameRu: data.nameRu,
            posterUrlPreview: data.posterUrlPreview,
            posterUrl: data.posterUrl,
            year: data.year,
            genres: data.genres,
            ratingKinopoisk: data.ratingKinopoisk,
            description: data.description,
            type: data.type,
            ratingAgeLimits: data.ratingAgeLimits
          });
        } catch (e) {
          console.error('Error saving film to database:', e);
        }

        // Теперь получаем фильм только из своей базы
        let filmFromDb = null;
        try {
          const dbFilmRes = await api.get(`/films/${data.kinopoiskId}`);
          filmFromDb = dbFilmRes.data.film;
        } catch (e) {
          console.error('Ошибка получения фильма из базы:', e);
          setError('Фильм не найден в базе');
          setLoading(false);
          return;
        }

        // Если нет description или ratingAgeLimits, дозапрашиваем с Кинопоиска и обновляем в базе
        if (filmFromDb && (!filmFromDb.description || !filmFromDb.ratingAgeLimits)) {
          try {
            const kpRes = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/${data.kinopoiskId}`, {
              headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json',
              },
            });
            const kpData = await kpRes.json();
            const updatedFields = {};
            if (!filmFromDb.description && kpData.description) updatedFields.description = kpData.description;
            if (!filmFromDb.ratingAgeLimits && kpData.ratingAgeLimits) updatedFields.ratingAgeLimits = kpData.ratingAgeLimits;
            if (Object.keys(updatedFields).length > 0) {
              await api.patch(`/films/${data.kinopoiskId}`, updatedFields);
              // Получаем обновлённый фильм
              const updatedFilmRes = await api.get(`/films/${data.kinopoiskId}`);
              filmFromDb = updatedFilmRes.data.film;
            }
          } catch (e) {
            console.error('Ошибка дозапроса/обновления описания фильма:', e);
            setError('Ошибка при обновлении описания фильма');
            setLoading(false);
            return;
          }
        }

        if (!filmFromDb) {
          setError('Фильм не найден в базе после обновления');
          setLoading(false);
          return;
        }

        setFilm(filmFromDb);
      } catch (e) {
        console.error('FilmPage error:', e);
        setError('Ошибка загрузки фильма: ' + (e?.message || e));
      } finally {
        setLoading(false);
      }
    };
    fetchFilm();
  }, [id]);

  // Сохраняем фильм в localStorage и отправляем на сервер (с защитой от двойного запроса)
  useEffect(() => {
    if (film && film.kinopoiskId && film.kinopoiskId !== lastSavedFilmId.current) {
      lastSavedFilmId.current = film.kinopoiskId;
      const key = 'recentFilms';
      let recent = JSON.parse(localStorage.getItem(key) || '[]');
      recent = recent.filter(f => f.kinopoiskId !== film.kinopoiskId);
      recent.unshift({
        kinopoiskId: film.kinopoiskId,
        nameRu: film.nameRu,
        posterUrlPreview: film.posterUrlPreview || film.posterUrl,
        year: film.year,
        genres: film.genres,
        ratingKinopoisk: film.ratingKinopoisk,
      });
      if (recent.length > 20) recent = recent.slice(0, 20);
      localStorage.setItem(key, JSON.stringify(recent));

      // Отправляем на сервер
      const token = localStorage.getItem('token');
      if (token) {
        api.post(
          '/users/visit-film',
          { filmId: film.kinopoiskId },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => {});
      }
    }
  }, [film]);

  // Получить все оценки и комментарии
  useEffect(() => {
    if (!film?.kinopoiskId) return;
    api.get(`/film-rating/${film.kinopoiskId}`)
      .then(res => setRatings(res.data.ratings || []))
      .catch(() => setRatings([]));
  }, [film, refreshRatings]);

  // Проверить, ставил ли пользователь оценку
  useEffect(() => {
    if (!ratings.length) return;
    const token = localStorage.getItem('token');
    let userId = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.id;
    } catch {}
    if (userId) {
      const my = ratings.find(r => r.userId === userId);
      if (my) {
        setUserLike(my.like);
        setUserComment(my.comment || '');
        setHasUserComment(!!my.comment);
      } else {
        setUserLike(null);
        setUserComment('');
        setHasUserComment(false);
      }
    }
  }, [ratings]);

  // Проверяем, является ли пользователь админом
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(payload.isAdmin === true);
      } catch {}
    }
  }, []);

  const handleLike = (like) => setUserLike(like);
  const handleCommentChange = (e) => setUserComment(e.target.value);

  const handleSend = async () => {
    if (userLike === null) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await api.post('/film-rating', {
        filmId: film.kinopoiskId,
        like: userLike,
        comment: userComment.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserComment('');
      setHasUserComment(true);
      setRefreshRatings(r => !r);
    } catch (error) {
      console.error('Error sending rating:', error);
    }
    setSending(false);
  };

  // Функция удаления комментария
  const handleDeleteComment = async (ratingId) => {
    if (!isAdmin) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/film-rating/${ratingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRefreshRatings(r => !r);
    } catch (e) {
      console.error('Error deleting comment:', e);
    }
  };

  // Подсчёт лайков/дизлайков
  const likes = ratings.filter(r => r.like).length;
  const dislikes = ratings.filter(r => !r.like).length;

  if (loading) return <div className="film-loading">Загрузка...</div>;
  if (error || !film) return <div className="film-error">{error || 'Фильм не найден'}</div>;

  return (
    <div className="film-page">
      <div className="film-grid">
        <div className="film-poster">
          <img src={film.posterUrl} alt={film.nameRu} />
        </div>
        <div className="film-info">
          <h1 className="film-title">{film.nameRu}</h1>
          <div className="film-rating">Оценка: <b>{film.ratingKinopoisk || '-'}</b></div>
          <div className="film-genres">Жанры: {film.genres.map(g => g.genre).join(', ')}</div>
          <div className="film-year">Год: {film.year}</div>
          <div className="film-type">Категория: {film.type}</div>
          <div className="film-age">Возраст: {film.ratingAgeLimits ? film.ratingAgeLimits.replace('age', '') + '+' : '-'}</div>
          <div className="film-description">{film.description}</div>
          <a className="film-link" href={`https://www.kinopoisk.ru/film/${film.kinopoiskId}/`} target="_blank" rel="noopener noreferrer">Смотреть на Кинопоиске</a>
        </div>
      </div>
      <div className="film-player">
        {film?.kinopoiskId && <KinoboxPlayer kinopoiskId={film.kinopoiskId} />}
      </div>
      <div className="film-rating-section">
        <div className="like-dislike-block">
          <button className={`like-btn ${userLike === true ? 'active' : ''}`} onClick={() => handleLike(true)} disabled={sending}>
            <span role="img" aria-label="like">👍</span>
          </button>
          <button className={`dislike-btn ${userLike === false ? 'active' : ''}`} onClick={() => handleLike(false)} disabled={sending}>
            <span role="img" aria-label="dislike">👎</span>
          </button>
        </div>
        {!hasUserComment ? (
          <>
            <textarea
              className="film-comment-input"
              placeholder="Оставьте комментарий..."
              value={userComment}
              onChange={handleCommentChange}
              rows={2}
              disabled={sending}
            />
            <button className="film-comment-send" onClick={handleSend} disabled={userLike === null || sending}>
              Отправить
            </button>
          </>
        ) : (
          <div className="film-comment-sent-message">
            Вы уже оставили комментарий к этому фильму
          </div>
        )}
        <div className="film-likes-count">
          <span style={{ color: '#4CAF50', marginRight: 12 }}>👍 {likes}</span>
          <span style={{ color: '#F44336' }}>👎 {dislikes}</span>
        </div>
      </div>
      <div className="film-comments-list">
        <h3>Комментарии:</h3>
        {ratings.filter(r => r.comment).length === 0 && <div className="film-no-comments">Комментариев пока нет</div>}
        {ratings.filter(r => r.comment).map((r, idx) => (
          <div key={r.userId + idx} className="film-comment-item">
            <span className={r.like ? 'like-color' : 'dislike-color'}>{r.like ? '👍' : '👎'}</span>
            <div className="film-comment-content">
              <div className="film-comment-email">{r.userEmail?.split('@')[0] || 'Аноним'}</div>
              <div className="film-comment-text">{filterText(r.comment)}</div>
            </div>
            <div className="film-comment-actions">
              <span className="film-comment-date">{new Date(r.createdAt).toLocaleString()}</span>
              {isAdmin && (
                <button 
                  className="film-comment-delete"
                  onClick={() => handleDeleteComment(r._id)}
                  title="Удалить комментарий"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilmPage; 