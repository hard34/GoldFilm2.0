import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import "./search.css";

const API_KEY = '8c8e1a50-6322-4135-8875-5d40a5420d86';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const timeoutRef = useRef();

  const fetchSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await fetch(
        `https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(query)}&page=1`,
        {
          headers: {
            'X-API-KEY': API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      setSuggestions((data.films || []).slice(0, 5));
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fetchSuggestions(value), 250);
  };

  const handleSuggestionClick = (filmId) => {
    setShowSuggestions(false);
    setSearchQuery("");
    navigate(`/film/${filmId}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.length >= 3) {
      setShowSuggestions(false);
      navigate(`/search?query=${encodeURIComponent(searchQuery)}&page=1`);
      setSearchQuery("");
    }
  };

  return (
    <div className="search-autocomplete">
      <form className="search-form" onSubmit={handleSubmit} autoComplete="off">
        <input
          type="text"
          placeholder="Поиск фильмов..."
          value={searchQuery}
          onChange={handleChange}
          className="search-input"
          onFocus={() => searchQuery.length >= 3 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        <button type="submit" className="search-button">
          <svg 
            className="search-icon" 
            viewBox="0 0 24 24" 
            width="24" 
            height="24"
          >
            <path 
              fill="currentColor" 
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </svg>
        </button>
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map(film => (
            <div key={film.filmId} className="search-suggestion" onMouseDown={() => handleSuggestionClick(film.filmId)}>
              <img src={film.posterUrlPreview || film.posterUrl} alt={film.nameRu} className="suggestion-img" />
              <span className="suggestion-title">{film.nameRu}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search; 