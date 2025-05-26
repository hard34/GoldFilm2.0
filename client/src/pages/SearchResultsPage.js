import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import './SearchResultsPage.css';
import api from '../api/api';

const API_KEY = '8c8e1a50-6322-4135-8875-5d40a5420d86';
const FILMS_PER_PAGE = 16;

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const [films, setFilms] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(null);
    fetch(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(query)}&page=${page}`,
      {
        headers: {
          'X-API-KEY': API_KEY,
          'Content-Type': 'application/json',
        },
      })
      .then(res => res.json())
      .then(data => {
        setFilms(data.films || []);
        setTotalPages(data.pagesCount || 1);

        // Сохраняем фильмы в БД
        (data.films || []).forEach(film => {
          api.post('/films', {
            kinopoiskId: film.filmId,
            nameRu: film.nameRu,
            posterUrlPreview: film.posterUrlPreview || film.posterUrl,
            posterUrl: film.posterUrl,
            year: film.year,
            genres: film.genres,
            ratingKinopoisk: film.rating,
            description: film.description,
            type: film.type,
            ratingAgeLimits: film.ratingAgeLimits
          }).catch(() => {});
        });

        setLoading(false);
      })
      .catch(() => {
        setError('Ошибка поиска');
        setLoading(false);
      });
  }, [query, page]);

  const handlePageChange = (newPage) => {
    navigate(`/search?query=${encodeURIComponent(query)}&page=${newPage}`);
  };

  // Пагинация: максимум 3 кнопки, стрелки если нужно
  const getPagination = () => {
    if (totalPages <= 1) return null;
    let pages = [];
    let start = Math.max(1, page - 1);
    let end = Math.min(totalPages, start + 2);
    if (end - start < 2) start = Math.max(1, end - 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return (
      <div className="search-pagination">
        {page > 1 && <button onClick={() => handlePageChange(page - 1)}>&lt;</button>}
        {pages.map(p => (
          <button key={p} className={p === page ? 'active' : ''} onClick={() => handlePageChange(p)}>{p}</button>
        ))}
        {page < totalPages && <button onClick={() => handlePageChange(page + 1)}>&gt;</button>}
      </div>
    );
  };

  return (
    <div className="search-results-page">
      <h1>Результаты поиска: {query}</h1>
      {loading ? (
        <div className="search-loading">Загрузка...</div>
      ) : error ? (
        <div className="search-error">{error}</div>
      ) : films.length === 0 ? (
        <div className="search-error">Ничего не найдено</div>
      ) : (
        <>
          <div className="search-films-grid">
            {films.map(film => (
              <MovieCard key={film.filmId} movie={{
                ...film,
                kinopoiskId: film.filmId,
                posterUrlPreview: film.posterUrlPreview || film.posterUrl,
              }} />
            ))}
          </div>
          {getPagination()}
        </>
      )}
    </div>
  );
};

export default SearchResultsPage; 