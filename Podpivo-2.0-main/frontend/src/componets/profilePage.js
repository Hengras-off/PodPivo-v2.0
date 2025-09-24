import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import Header from './Header';
import MovieCard from './MovieCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('favorites');
  const [favorites, setFavorites] = useState([]);
  const [watched, setWatched] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user, token, t, language } = useAuth();
  const navigate = useNavigate();

  // Fetch user lists
  useEffect(() => {
    const fetchUserLists = async () => {
      try {
        const [favoritesResponse, watchedResponse] = await Promise.all([
          axios.get(`${API}/user/lists/favorites`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/user/lists/watched`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setFavorites(favoritesResponse.data);
        setWatched(watchedResponse.data);
      } catch (error) {
        console.error('Error fetching user lists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserLists();
  }, [token]);

  const playMovie = (movieId) => {
    navigate(`/watch/${movieId}`);
  };

  const removeFromList = async (movieId, listType) => {
    try {
      const params = new URLSearchParams();
      params.append('movie_id', movieId);
      params.append('list_type', listType);
      
      await axios.delete(`${API}/user/lists?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      if (listType === 'favorites') {
        setFavorites(favorites.filter(movie => movie.id !== movieId));
      } else {
        setWatched(watched.filter(movie => movie.id !== movieId));
      }
    } catch (error) {
      console.error('Error removing from list:', error);
    }
  };

  const addToList = async (movieId, listType) => {
    try {
      const params = new URLSearchParams();
      params.append('movie_id', movieId);
      params.append('list_type', listType);
      
      await axios.post(`${API}/user/lists?${params}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh the lists
      window.location.reload();
    } catch (error) {
      console.error('Error adding to list:', error);
    }
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
      
      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-red-900/20 to-transparent p-8 rounded-lg mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-3xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
              <p className="text-gray-400">{user.email}</p>
              <p className="text-gray-500 text-sm">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-8 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`pb-4 px-2 font-semibold transition-colors ${
                activeTab === 'favorites'
                  ? 'text-red-500 border-b-2 border-red-500'
                  : 'text-gray-400 hover:text-white'
              }`}
              data-testid="favorites-tab"
            >
              {t.favorites} ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab('watched')}
              className={`pb-4 px-2 font-semibold transition-colors ${
                activeTab === 'watched'
                  ? 'text-red-500 border-b-2 border-red-500'
                  : 'text-gray-400 hover:text-white'
              }`}
              data-testid="watched-tab"
            >
              {t.watched} ({watched.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pb-12">
          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">{t.favorites}</h2>
              {favorites.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <p className="text-xl">No favorite movies yet</p>
                  <p className="text-sm mt-2">Add movies to your favorites to see them here</p>
                </div>
              ) : (
                <div className="movies-grid" data-testid="favorites-grid">
                  {favorites.map((movie) => (
                    <div key={movie.id} className="relative">
                      <MovieCard
                        movie={movie}
                        onPlay={() => playMovie(movie.id)}
                        onAddToList={(listType) => addToList(movie.id, listType)}
                        language={language}
                      />
                      <button
                        onClick={() => removeFromList(movie.id, 'favorites')}
                        className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors"
                        title="Remove from favorites"
                        data-testid={`remove-favorite-${movie.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'watched' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">{t.watched}</h2>
              {watched.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xl">No watched movies yet</p>
                  <p className="text-sm mt-2">Movies you watch will appear here</p>
                </div>
              ) : (
                <div className="movies-grid" data-testid="watched-grid">
                  {watched.map((movie) => (
                    <div key={movie.id} className="relative">
                      <MovieCard
                        movie={movie}
                        onPlay={() => playMovie(movie.id)}
                        onAddToList={(listType) => addToList(movie.id, listType)}
                        language={language}
                      />
                      <button
                        onClick={() => removeFromList(movie.id, 'watched')}
                        className="absolute top-2 left-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full p-2 transition-colors"
                        title="Remove from watched"
                        data-testid={`remove-watched-${movie.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
