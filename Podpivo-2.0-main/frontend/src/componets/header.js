import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const Header = ({ showAuth }) => {
  const { user, logout, language, switchLanguage, t } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-red-600 text-3xl font-black">RuFlix</span>
          </Link>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className="text-white hover:text-red-500 transition-colors"
                data-testid="nav-home"
              >
                Главная
              </Link>
              <Link 
                to="/profile" 
                className="text-white hover:text-red-500 transition-colors"
                data-testid="nav-profile"
              >
                {t.myList}
              </Link>
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="language-switcher">
              <button
                onClick={() => switchLanguage('ru')}
                className={language === 'ru' ? 'active' : ''}
                data-testid="lang-ru"
              >
                RU
              </button>
              <button
                onClick={() => switchLanguage('en')}
                className={language === 'en' ? 'active' : ''}
                data-testid="lang-en"
              >
                EN
              </button>
            </div>

            {user ? (
              /* User Menu */
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-white hover:text-red-500 transition-colors"
                  data-testid="user-menu-btn"
                >
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block">{user.name}</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-700">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-white hover:bg-red-600/20 transition-colors"
                      onClick={() => setShowDropdown(false)}
                      data-testid="dropdown-profile"
                    >
                      {t.profile}
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-white hover:bg-red-600/20 transition-colors"
                      data-testid="dropdown-logout"
                    >
                      {t.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Sign In Button */
              showAuth && (
                <button
                  onClick={showAuth}
                  className="btn-primary px-4 py-2"
                  data-testid="header-signin-btn"
                >
                  {t.signIn}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
