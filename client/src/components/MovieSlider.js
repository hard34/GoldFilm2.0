import React, { useState, useEffect, useRef } from 'react';
import MovieCard from './MovieCard';
import './MovieSlider.css';

const MovieSlider = ({ title, type, movies: propMovies, moviesPerPage = 5 }) => {
  const [movies, setMovies] = useState(propMovies || []);
  const [loading, setLoading] = useState(!propMovies);
  const [currentPage, setCurrentPage] = useState(1);
  const [slidesPerPage, setSlidesPerPage] = useState(moviesPerPage);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const sliderRef = useRef(null);
  const totalPages = Math.ceil(movies.length / slidesPerPage);

  useEffect(() => {
    if (propMovies) {
      setMovies(propMovies);
      setLoading(false);
      return;
    }
    const fetchMovies = async () => {
      try {
        const response = await fetch(
          `https://kinopoiskapiunofficial.tech/api/v2.2/films/collections?type=${type}&page=1`,
          {
            headers: {
              'X-API-KEY': '8c8e1a50-6322-4135-8875-5d40a5420d86',
              'Content-Type': 'application/json',
            },
          }
        );
        const data = await response.json();
        setMovies(data.items);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [type, propMovies]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 500) {
        setSlidesPerPage(2);
      } else if (window.innerWidth <= 900) {
        setSlidesPerPage(3);
      } else {
        setSlidesPerPage(moviesPerPage);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [moviesPerPage]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1) pageNumber = 1;
    if (pageNumber > totalPages) pageNumber = totalPages;
    setCurrentPage(pageNumber);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handlePageChange(currentPage + 1);
    }
    if (isRightSwipe) {
      handlePageChange(currentPage - 1);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const getCurrentMovies = () => {
    const startIndex = (currentPage - 1) * slidesPerPage;
    return movies.slice(startIndex, startIndex + slidesPerPage);
  };

  if (loading) {
    return <div className="slider-loading">Загрузка...</div>;
  }

  return (
    <div className="movie-slider">
      <h2 className="slider-title">{title}</h2>
      <div className="slider-container">
        <button 
          className="slider-arrow left"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          &#10094;
        </button>
        <div 
          className="movies-wrapper" 
          style={{ transform: `translateX(-${(currentPage - 1) * 100}%)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          ref={sliderRef}
        >
          {Array.from({ length: totalPages }, (_, pageIndex) => (
            <div key={pageIndex} className="movies-page">
              {movies.slice(pageIndex * slidesPerPage, (pageIndex + 1) * slidesPerPage).map((movie) => (
                <MovieCard key={movie.kinopoiskId} movie={movie} />
              ))}
            </div>
          ))}
        </div>
        <button 
          className="slider-arrow right"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          &#10095;
        </button>
      </div>
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`pagination-dot ${currentPage === i + 1 ? 'active' : ''}`}
            onClick={() => handlePageChange(i + 1)}
            aria-label={`Page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default MovieSlider; 