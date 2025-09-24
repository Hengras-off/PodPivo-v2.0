import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import Header from './Header';
import MovieCard from './MovieCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  
  const { user, token, t, language } = useAuth();
  const navigate = useNavigate();

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Initialize sample data first
        await axios.post(`${API}/init-data`);
        
        // Fetch genres
        const genresResponse = await axios.get(`${API}/genres`);
        setGenres(genresResponse.data);
        
        // Fetch movies
        const moviesResponse = await axios.get(`${API}/movies`);
        setMovies(moviesResponse.data);
        
        // Set featured movie (first one)
        if (moviesResponse.data.length > 0) {
          setFeaturedMovie(moviesResponse.data[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Search movies
  useEffect(() => {
    const searchMovies = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedGenre) params.append('genre_id', selectedGenre);
        
        const response = await axios.get(`${API}/movies?${params}`);
        setMovies(response.data);
      } catch (error) {
        console.error('Error searching movies:', error);
      }
    };

    const debounceTimer = setTimeout(() => {
      if (searchQuery || selectedGenre) {
        searchMovies();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedGenre]);

  // Add to list function
  const addToList = async (movieId, listType) => {
    try {
      const params = new URLSearchParams();
      params.append('movie_id', movieId);
      params.append('list_type', listType);
      
      await axios.post(`${API}/user/lists?${params}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Show success message (you could use a toast here)
      console.log(`Added to ${listType}`);
    } catch (error) {
      console.error('Error adding to list:', error);
    }
  };

  const playMovie = (movieId) => {
    navigate(`/watch/${movieId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Hero Section */}
      {featuredMovie && (
        <div className="relative h-screen">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${featuredMovie.poster_url})`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>
          
          <div className="relative z-10 flex items-center h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
                {language === 'ru' ? featuredMovie.title_ru : featuredMovie.title}
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
                {language === 'ru' ? featuredMovie.description_ru : featuredMovie.description}
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => playMovie(featuredMovie.id)}
                  className="btn-primary px-8 py-3 text-lg flex items-center space-x-2"
                  data-testid="hero-play-btn"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>Play</span>
                </button>
                
                <button
                  onClick={() => addToList(featuredMovie.id, 'favorites')}
                  className="btn-secondary px-8 py-3 text-lg flex items-center space-x-2"
                  data-testid="hero-add-list-btn"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{t.myList}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="relative z-20 bg-black pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input flex-1"
                data-testid="search-input"
              />
            </div>
            
            {/* Genre filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedGenre('')}
                className={`genre-filter ${!selectedGenre ? 'active' : ''}`}
                data-testid="genre-all"
              >
                All Genres
              </button>
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`genre-filter ${selectedGenre === genre.id ? 'active' : ''}`}
                  data-testid={`genre-${genre.id}`}
                >
                  {language === 'ru' ? genre.name_ru : genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Movies Grid */}
          <div className="movies-grid" data-testid="movies-grid">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onPlay={() => playMovie(movie.id)}
                onAddToList={(listType) => addToList(movie.id, listType)}
                language={language}
              />
            ))}
          </div>

          {movies.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <p className="text-xl">No movies found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
