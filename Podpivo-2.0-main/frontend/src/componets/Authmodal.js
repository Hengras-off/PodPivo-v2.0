import React, { useState } from 'react';
import { useAuth } from '../App';

const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, t } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        result = await register(email, password, name);
      }

      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="bg-black/90 p-8 rounded-lg max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
          data-testid="close-auth-modal"
        >
          ×
        </button>
        
        <h2 className="text-3xl font-bold mb-6 text-white">
          {isLogin ? t.signIn : t.signUp}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder={t.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full search-input"
              required
              data-testid="name-input"
            />
          )}
          
          <input
            type="email"
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full search-input"
            required
            data-testid="email-input"
          />
          
          <input
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full search-input"
            required
            data-testid="password-input"
          />

          {error && (
            <div className="text-red-500 text-sm" data-testid="auth-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-lg"
            data-testid="auth-submit-btn"
          >
            {loading ? 'Loading...' : (isLogin ? t.signIn : t.signUp)}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-400">
            {isLogin ? "New to RuFlix? " : "Already have an account? "}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-white hover:underline"
            data-testid="toggle-auth-mode"
          >
            {isLogin ? t.signUp : t.signIn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
