import React, { useEffect, useRef } from "react";

const KinoboxPlayer = ({ kinopoiskId }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const loadKinobox = () => {
      try {
        // Проверяем, не был ли уже добавлен скрипт
        if (!document.querySelector('script[src="https://kinobox.tv/kinobox.min.js"]')) {
          const script = document.createElement("script");
          script.src = "https://kinobox.tv/kinobox.min.js";
          script.async = true;
          
          script.onload = () => {
            if (window.kbox && containerRef.current) {
              try {
                window.kbox(containerRef.current, {
                  search: { kinopoisk: kinopoiskId }
                });
              } catch (error) {
                console.error('Error initializing Kinobox:', error);
              }
            }
          };

          script.onerror = (error) => {
            console.error('Error loading Kinobox script:', error);
          };

          document.body.appendChild(script);
        } else if (window.kbox && containerRef.current) {
          try {
            window.kbox(containerRef.current, {
              search: { kinopoisk: kinopoiskId }
            });
          } catch (error) {
            console.error('Error initializing Kinobox:', error);
          }
        }
      } catch (error) {
        console.error('Error in loadKinobox:', error);
      }
    };

    // Даем время на монтирование компонента
    setTimeout(loadKinobox, 100);

    // Очистка при размонтировании
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [kinopoiskId]);

  return (
    <div 
      ref={containerRef} 
      className="kinobox_player" 
      style={{ 
        width: "100%", 
        minHeight: 420, 
        borderRadius: 12, 
        overflow: "hidden",
        backgroundColor: "#000" // Добавляем фон для лучшего UX при загрузке
      }} 
    />
  );
};

export default KinoboxPlayer; 