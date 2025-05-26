import React, { useEffect, useState, useCallback } from 'react';
import MovieSlider from '../components/MovieSlider';
import './Home.css';
import api from '../api/api';

const Home = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [showRecs, setShowRecs] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (userId && token) {
        setIsLoading(true);
        const response = await api.get(`/users/${userId}/recommendations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.recommendations && response.data.recommendations.length > 0) {
          setRecommendations(response.data.recommendations);
          setShowRecs(true);
        } else {
          setShowRecs(false);
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setShowRecs(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Загружаем рекомендации при монтировании компонента
    fetchRecommendations();

    // Обработчик для обновления при возвращении на вкладку
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRecommendations();
      }
    };

    // Обработчик для обновления при фокусе на окне
    const handleFocus = () => {
      fetchRecommendations();
    };

    // Добавляем слушатели событий
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Очищаем слушатели при размонтировании
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchRecommendations]);

  return (
    <div className="home">
      {showRecs && (
        <MovieSlider 
          title="Рекомендации для вас" 
          movies={recommendations}
          moviesPerPage={5}
          isLoading={isLoading}
        />
      )}
      <MovieSlider title="Популярные фильмы" type="TOP_POPULAR_MOVIES" />
      <MovieSlider title="Топ 250 фильмов" type="TOP_250_MOVIES" />
      <MovieSlider title="Топ 250 сериалов" type="TOP_250_TV_SHOWS" />
      <MovieSlider title="Мультфильмы" type="KIDS_ANIMATION_THEME" />
      <MovieSlider title="Популярные сериалы" type="POPULAR_SERIES" />
    </div>
  );
};

export default Home; 