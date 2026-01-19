import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyIdentity, resetPassword, clearError } from '../store/authSlice';

/**
 * Forgot Password page
 * Step 1: Verify identity using Passport or NID
 * Step 2: Reset password if identity is verified
 */
const ForgotPassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  
  const [step, setStep] = useState(1); // 1: Verify identity, 2: Reset password, 3: Success
  const [idType, setIdType] = useState('nid'); // 'nid' or 'passport'
  const [idNumber, setIdNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [verifiedUser, setVerifiedUser] = useState(null);

  // Clear Redux error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleIdTypeChange = (e) => {
    setIdType(e.target.value);
    setIdNumber('');
    setErrors({});
  };

  const handleIdNumberChange = (e) => {
    setIdNumber(e.target.value);
    if (errors.idNumber) {
      setErrors((prev) => ({ ...prev, idNumber: '' }));
    }
    if (error) {
      dispatch(clearError());
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    if (name === 'newPassword') {
      setNewPassword(value);
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) {
      dispatch(clearError());
    }
  };

  const validateIdentity = () => {
    const newErrors = {};
    if (!idNumber.trim()) {
      newErrors.idNumber = `${idType === 'nid' ? 'NID' : 'Passport'} is required`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    if (validateIdentity()) {
      try {
        const result = await dispatch(
          verifyIdentity({ idType, idNumber: idNumber.trim() })
        ).unwrap();
        setVerifiedUser(result);
        setStep(2);
      } catch (err) {
        console.error('Identity verification failed:', err);
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (validatePassword()) {
      try {
        await dispatch(
          resetPassword({ userId: verifiedUser.userId, newPassword })
        ).unwrap();
        setStep(3);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } catch (err) {
        console.error('Password reset failed:', err);
      }
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-gray-600 text-sm">
            {step === 1 && 'Verify your identity to reset your password'}
            {step === 2 && 'Enter your new password'}
            {step === 3 && 'Password reset successful!'}
          </p>
        </div>

        {/* Step 1: Verify Identity */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleVerifyIdentity} className="space-y-5">
              {/* ID Type Selection */}
              <div>
                <label htmlFor="idType" className="block text-sm font-medium text-gray-700 mb-2">
                  ID Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <select
                    id="idType"
                    name="idType"
                    value={idType}
                    onChange={handleIdTypeChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none bg-white"
                  >
                    <option value="nid">NID (National ID)</option>
                    <option value="passport">Passport Number</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* ID Number Input */}
              <div>
                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  {idType === 'nid' ? 'NID Number' : 'Passport Number'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {idType === 'nid' ? (
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
                    id="idNumber"
                    name="idNumber"
                    value={idNumber}
                    onChange={handleIdNumberChange}
                    placeholder={idType === 'nid' ? 'Enter your NID number' : 'Enter your Passport number'}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                      errors.idNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.idNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.idNumber}</p>
                )}
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
                {loading ? 'Verifying...' : 'Verify Identity'}
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-primary hover:text-accent transition-colors inline-flex items-center gap-1"
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
                Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Reset Password */}
        {step === 2 && verifiedUser && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Verified:</span> {verifiedUser.name} ({verifiedUser.phone})
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* New Password Field */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password <span className="text-red-500">*</span>
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
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
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
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
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
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
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
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>

            {/* Back Button */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setVerifiedUser(null);
                  setNewPassword('');
                  setConfirmPassword('');
                  setErrors({});
                  dispatch(clearError());
                }}
                className="text-sm text-primary hover:text-accent transition-colors inline-flex items-center gap-1"
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
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful!</h2>
              <p className="text-gray-600">
                Your password has been reset successfully. Redirecting to login page...
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary hover:text-accent transition-colors font-semibold"
            >
              Go to Login
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
