import React, { useState } from 'react';

const MovieCard = ({ movie, onPlay, onAddToList, language }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="movie-card bg-gray-900 rounded-lg overflow-hidden relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`movie-card-${movie.id}`}
    >
      {/* Movie Poster */}
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={movie.poster_url}
          alt={language === 'ru' ? movie.title_ru : movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay on hover */}
        <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={onPlay}
            className="bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-colors"
            data-testid={`play-btn-${movie.id}`}
          >
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Rating badge */}
        <div className="absolute top-2 right-2 bg-black/80 rounded px-2 py-1 text-sm font-semibold">
          ⭐ {movie.rating}
        </div>
      </div>

      {/* Movie Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
          {language === 'ru' ? movie.title_ru : movie.title}
        </h3>
        
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {language === 'ru' ? movie.description_ru : movie.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
          <span>{movie.year}</span>
          <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={onPlay}
            className="flex-1 btn-primary py-2 text-sm flex items-center justify-center space-x-1"
            data-testid={`card-play-btn-${movie.id}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>Play</span>
          </button>
          
          <button
            onClick={() => onAddToList('favorites')}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors"
            title="Add to Favorites"
            data-testid={`add-favorites-btn-${movie.id}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          
          <button
            onClick={() => onAddToList('watched')}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors"
            title="Mark as Watched"
            data-testid={`add-watched-btn-${movie.id}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
