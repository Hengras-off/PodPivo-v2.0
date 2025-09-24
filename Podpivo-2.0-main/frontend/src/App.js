import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import AuthModal from './components/AuthModal';
import Header from './components/Header';
import HomePage from './components/HomePage';
import MoviePlayer from './components/MoviePlayer';
import ProfilePage from './components/ProfilePage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showAuth, setShowAuth] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ru');
  const [loading, setLoading] = useState(true);

  // Translations
  const translations = {
    ru: {
      signIn: 'Войти',
      signUp: 'Регистрация', 
      email: 'Email',
      password: 'Пароль',
      name: 'Имя',
      welcome: 'Добро пожаловать в RuFlix',
      subtitle: 'Безграничные фильмы, сериалы и многое другое.',
      getStarted: 'Начать просмотр',
      myList: 'Мой список',
      favorites: 'Избранное',
      watched: 'Просмотренное',
      search: 'Поиск...',
      logout: 'Выйти',
      profile: 'Профиль'
    },
    en: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email', 
      password: 'Password',
      name: 'Name',
      welcome: 'Welcome to RuFlix',
      subtitle: 'Unlimited movies, TV shows and more.',
      getStarted: 'Get Started',
      myList: 'My List',
      favorites: 'Favorites',
      watched: 'Watched',
      search: 'Search...',
      logout: 'Logout',
      profile: 'Profile'
    }
  };

  const t = translations[language];

  // Check auth on load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { user, token: newToken } = response.data;
      
      setUser(user);
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setShowAuth(false);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await axios.post(`${API}/auth/register`, { 
        email, 
        password, 
        name 
      });
      const { user, token: newToken } = response.data;
      
      setUser(user);
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setShowAuth(false);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const switchLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const authContextValue = {
    user,
    token,
    login,
    register,
    logout,
    language,
    switchLanguage,
    t
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="App">
        <BrowserRouter>
          {!user ? (
            // Landing Page for non-authenticated users
            <div className="min-h-screen bg-gradient-to-b from-black via-red-900/20 to-black">
              <div className="absolute inset-0 bg-black/60" />
              <div 
                className="min-h-screen bg-cover bg-center bg-no-repeat relative"
                style={{
                  backgroundImage: `url('https://assets.nflxext.com/ffe/siteui/vlv3/563192ea-ac0e-4906-a865-ba9899ffafad/6b2842d1-2339-4f08-84f6-148e9fcbe01b/RU-en-20231218-popsignuptwoweeks-perspective_alpha_website_large.jpg')`
                }}
              >
                <div className="relative z-10">
                  <Header showAuth={() => setShowAuth(true)} />
                  
                  <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 max-w-4xl">
                      {t.welcome}
                    </h1>
                    <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl">
                      {t.subtitle}
                    </p>
                    <button
                      data-testid="get-started-btn"
                      onClick={() => setShowAuth(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded text-xl transition-colors"
                    >
                      {t.getStarted}
                    </button>
                  </div>
                </div>
              </div>
              
              {showAuth && (
                <AuthModal 
                  onClose={() => setShowAuth(false)} 
                />
              )}
            </div>
          ) : (
            // Main App for authenticated users
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/watch/:movieId" element={<MoviePlayer />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </BrowserRouter>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
