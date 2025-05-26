import React, { useState, useEffect } from 'react';
import api from '../api/api';
import MovieCard from '../components/MovieCard';
import './GenresPage.css';

const API_KEY = '8c8e1a50-6322-4135-8875-5d40a5420d86';
const FILMS_PER_PAGE = 20;

const GENRES = [
  { id: 1, genre: 'триллер' }, { id: 2, genre: 'драма' }, { id: 3, genre: 'криминал' },
  { id: 4, genre: 'мелодрама' }, { id: 5, genre: 'детектив' }, { id: 6, genre: 'фантастика' },
  { id: 7, genre: 'приключения' }, { id: 8, genre: 'биография' }, { id: 9, genre: 'фильм-нуар' },
  { id: 10, genre: 'вестерн' }, { id: 11, genre: 'боевик' }, { id: 12, genre: 'фэнтези' },
  { id: 13, genre: 'комедия' }, { id: 14, genre: 'военный' }, { id: 15, genre: 'история' },
  { id: 16, genre: 'музыка' }, { id: 17, genre: 'ужасы' }, { id: 18, genre: 'мультфильм' },
  { id: 19, genre: 'семейный' }, { id: 20, genre: 'мюзикл' }, { id: 21, genre: 'спорт' },
  { id: 22, genre: 'документальный' }, { id: 23, genre: 'короткометражка' }, { id: 24, genre: 'аниме' },
  { id: 26, genre: 'новости' }, { id: 27, genre: 'концерт' }, { id: 28, genre: 'для взрослых' },
  { id: 29, genre: 'церемония' }, { id: 30, genre: 'реальное ТВ' }, { id: 31, genre: 'игра' },
  { id: 32, genre: 'ток-шоу' }, { id: 33, genre: 'детский' }
];

const GenresPage = () => {
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0].id);
  const [films, setFilms] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFilms = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://kinopoiskapiunofficial.tech/api/v2.2/films?genres=${selectedGenre}&order=RATING&type=ALL&ratingFrom=0&ratingTo=10&yearFrom=1000&yearTo=3000&page=${page}`,
          {
            headers: {
              'X-API-KEY': API_KEY,
              'Content-Type': 'application/json',
            },
          }
        );
        const data = await response.json();
        setFilms(data.items || []);
        setTotalPages(data.totalPages || 1);

        // Сохраняем фильмы в БД
        (data.items || []).forEach(film => {
          api.post('/films', {
            kinopoiskId: film.kinopoiskId,
            nameRu: film.nameRu,
            posterUrlPreview: film.posterUrlPreview,
            posterUrl: film.posterUrl,
            year: film.year,
            genres: film.genres,
            ratingKinopoisk: film.ratingKinopoisk,
            description: film.description,
            type: film.type,
            ratingAgeLimits: film.ratingAgeLimits
          }).catch(() => {});
        });
      } catch {
        setFilms([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFilms();
  }, [selectedGenre, page]);

  return (
    <div className="genres-page">
      <div className="genres-list">
        {GENRES.map(g => (
          <button
            key={g.id}
            className={selectedGenre === g.id ? 'active' : ''}
            onClick={() => { setSelectedGenre(g.id); setPage(1); }}
          >
            {g.genre}
          </button>
        ))}
      </div>
      <div className="genres-films-grid">
        {loading ? (
          <div className="genres-loading">Загрузка...</div>
        ) : films.length === 0 ? (
          <div className="genres-error">Нет фильмов</div>
        ) : (
          <div className="genres-films">
            {films.map(film => (
              <MovieCard key={film.kinopoiskId} movie={film} />
            ))}
          </div>
        )}
        <div className="genres-pagination">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={p === page ? 'active' : ''}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenresPage; 