import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/authSlice';

/**
 * Login page with modern design
 * Supports login with Phone (for admins), NID, or Passport (for consumers)
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  
  const [loginType, setLoginType] = useState('nid'); // 'phone', 'nid', or 'passport'
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear Redux error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    // Clear Redux error
    if (error) {
      dispatch(clearError());
    }
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    setFormData({ identifier: '', password: '' });
    setErrors({});
    dispatch(clearError());
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      const fieldName = loginType === 'phone' ? 'Phone number' : loginType === 'nid' ? 'NID' : 'Passport';
      newErrors.identifier = `${fieldName} is required`;
    } else if (loginType === 'phone' && !/^[0-9]{10,15}$/.test(formData.identifier.replace(/\s+/g, ''))) {
      newErrors.identifier = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const result = await dispatch(
          loginUser({
            identifier: formData.identifier.trim(),
            password: formData.password,
            loginType: loginType,
          })
        ).unwrap();
        
        // Redirect admin to admin panel, members to home or intended page
        if (result.user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }
      } catch (err) {
        // Error is handled by Redux state
        console.error('Login failed:', err);
      }
    }
  };

  const getPlaceholder = () => {
    switch (loginType) {
      case 'phone':
        return 'Enter your phone number';
      case 'nid':
        return 'Enter your NID number';
      case 'passport':
        return 'Enter your Passport number';
      default:
        return 'Enter your identifier';
    }
  };

  const getLabel = () => {
    switch (loginType) {
      case 'phone':
        return 'Phone Number';
      case 'nid':
        return 'NID (National ID)';
      case 'passport':
        return 'Passport Number';
      default:
        return 'Identifier';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-600 text-sm">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Login Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Login with:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleLoginTypeChange('nid')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  loginType === 'nid'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                NID
              </button>
              <button
                type="button"
                onClick={() => handleLoginTypeChange('passport')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  loginType === 'passport'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Passport
              </button>
              <button
                type="button"
                onClick={() => handleLoginTypeChange('phone')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  loginType === 'phone'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Phone
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identifier Field (NID/Passport/Phone) */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                {getLabel()}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {loginType === 'phone' ? (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  ) : loginType === 'nid' ? (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  )}
                </div>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder={getPlaceholder()}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                    errors.identifier ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.906 1.28L3.707 2.293zM14.95 6.05a3 3 0 014.242 4.242L14.95 6.05zm-4.95 4.95l-4.242-4.242a3 3 0 014.242 4.242L10 11z"
                        clipRule="evenodd"
                      />
                      <path d="M12.316 13.757l-1.415-1.415a3 3 0 01-4.242-4.242L3.05 6.05a10 10 0 00-.542 3.95c0 4.478 2.943 8.268 7 9.542a9.98 9.98 0 003.808-.795z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => alert('Forgot password feature coming soon')}
                className="text-sm text-primary hover:text-accent transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Error message from Redux */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary font-semibold hover:text-accent transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
