import React from 'react';
import './loading.css';

const Loading = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Загрузка...</p>
      </div>
    </div>
  );
};

export default Loading; 