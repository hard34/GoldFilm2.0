import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MovieCard.css';
import api from '../api/api';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (movie.kinopoiskId) {
      api.get(`/film-rating/${movie.kinopoiskId}`)
        .then(res => {
          if (!isMounted) return;
          const ratings = res.data.ratings || [];
          setLikes(ratings.filter(r => r.like).length);
          setDislikes(ratings.filter(r => !r.like).length);
        })
        .catch(() => {
          if (!isMounted) return;
          setLikes(0);
          setDislikes(0);
        });
    }
    return () => { isMounted = false; };
  }, [movie.kinopoiskId]);

  const getRatingStyle = (rating) => {
    if (!rating) return { display: 'none' };
    
    if (rating >= 8.5) {
      return {
        backgroundImage: 'linear-gradient(160deg, rgb(234, 204, 127) 16%, rgb(173, 156, 114) 64%)',
        color: 'black'
      };
    }
    if (rating >= 6.1) return { backgroundColor: '#4CAF50', color: 'white' };
    if (rating >= 4.6) return { backgroundColor: '#FFC107', color: 'white' };
    return { backgroundColor: '#F44336', color: 'white' };
  };

  const genres = movie.genres?.slice(0, 2).map(g => g.genre).join(', ') || '';
  const year = movie.year ? `${movie.year}` : '';
  const title =
    movie.nameRu && movie.nameRu.length > 35
      ? movie.nameRu.slice(0, 35) + '...'
      : movie.nameRu;

  const handleClick = () => {
    navigate(`/film/${movie.kinopoiskId}`);
  };

  return (
    <div className="movie-card" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="movie-poster">
        <img src={movie.posterUrlPreview} alt={movie.nameRu} />
        {movie.ratingKinopoisk && (
          <div 
            className="movie-rating" 
            style={getRatingStyle(movie.ratingKinopoisk)}
          >
            {movie.ratingKinopoisk.toFixed(1)}
          </div>
        )}
        <div className="movie-likes-overlay">
          <span className="movie-likes-count">👍 {likes}</span>
          <span className="movie-dislikes-count">👎 {dislikes}</span>
        </div>
      </div>
      <div className="movie-info">
        <div className="movie-title">{title}</div>
        <div className="movie-year">{year}</div>
        <div className="movie-genres">{genres}</div>
      </div>
    </div>
  );
};

export default MovieCard; 