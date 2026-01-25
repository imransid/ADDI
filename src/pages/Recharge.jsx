import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { rechargeWallet } from '../store/walletSlice';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { walletAPI } from '../services/api';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import defaultBikashQrJpeg from '../assets/default-bikash-qr.jpeg';

// Component to display default Bikash QR code image
const DefaultBikashQR = ({ size = 220 }) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    // Try different image formats and paths
    const imagePaths = [
      // Prefer bundled asset so Vercel deploys the updated image from `src/assets/`
      defaultBikashQrJpeg,
      '/assets/default-bikash-qr.png',
      '/assets/default-bikash-qr.jpg',
      '/assets/default-bikash-qr.jpeg',
      '/assets/default-bikash-qr.webp',
    ];

    let currentIndex = 0;
    const tryNextImage = () => {
      if (currentIndex >= imagePaths.length) {
        setImageError(true);
        return;
      }

      const img = new Image();
      img.onload = () => {
        setImageSrc(imagePaths[currentIndex]);
        setImageError(false);
      };
      img.onerror = () => {
        currentIndex++;
        tryNextImage();
      };
      img.src = imagePaths[currentIndex];
    };

    tryNextImage();
  }, []);

  if (imageError || !imageSrc) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          />
        </svg>
        <p className="text-xs text-center px-2">Default QR code image not found</p>
        <p className="text-xs text-center px-2 mt-1 text-gray-300">Please add image to /public/assets/</p>
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center bg-white">
      <img 
        src={imageSrc} 
        alt="Default Touch 'n Go QR Code"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

/**
 * Recharge page. Allows the user to select an amount and shows QR code for Touch 'n Go payment.
 * After payment, user can submit proof for admin approval.
 * Beautiful modern UI with gradients and animations.
 */
const Recharge = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.wallet);
  const { settings, loading: settingsLoading } = useSettings();
  const [amount, setAmount] = useState('60');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showQRZoom, setShowQRZoom] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [proofImageFile, setProofImageFile] = useState(null);
  const [proofImagePreview, setProofImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const quickAmounts = ['60', '300', '800', '1600', '3000', '5000'];
  const GOOGLE_DRIVE_FOLDER_ID = '1ErJTfAu21KXcqwRvFSGun79D_t-b0SyY';
  const GOOGLE_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}`;
  
  // Touch 'n Go settings (stored under existing keys for backward compatibility)
  // Always use bikashQRCodeId for QR code generation (not bKashNumber)
  const bikashQRCodeId = settings?.bikashQRCodeId || '';
  const touchNGoNumber = settings?.bKashNumber || '';

  const handleShowQR = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Allow showing QR modal even if bikashQRCodeId is not set (will show default image)
    setShowQRModal(true);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, etc.)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
      }

      setProofImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenGoogleDriveUpload = () => {
    if (!proofImageFile) {
      alert('Please select an image first');
      return;
    }

    // Open Google Drive upload page with folder ID
    const uploadUrl = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}`;
    window.open(uploadUrl, '_blank');
    
    alert('Please upload your image to the opened Google Drive folder, then copy the shareable link and paste it below.');
  };

  const handleSubmitRecharge = async () => {
    // Image URL is optional, but if provided, validate it
    if (proofImageUrl.trim()) {
      // Validate Google Drive URL if provided
      if (!proofImageUrl.includes('drive.google.com') && !proofImageUrl.includes('docs.google.com')) {
        if (!confirm('The URL does not appear to be a Google Drive link. Continue anyway?')) {
          return;
        }
      }
    }

    const amt = parseFloat(amount);
    setSubmitting(true);
    try {
      await dispatch(rechargeWallet({ amount: amt, proofImageUrl })).unwrap();
      alert('Recharge request submitted! Waiting for admin approval.');
      setShowQRModal(false);
      setProofImageUrl('');
      setProofImageFile(null);
      setProofImagePreview('');
      navigate('/');
    } catch (err) {
      alert(`Recharge failed: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 pb-6">
      {/* Beautiful Header */}
      <div className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 text-white mb-6 rounded-b-3xl shadow-2xl">
        <div className="absolute inset-0 bg-black/10 rounded-b-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full transform hover:rotate-12 transition-transform duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Recharge Wallet</h1>
              <p className="text-white/90 text-sm">Add funds to your account</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Amount Selection Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <form onSubmit={handleShowQR} className="space-y-6">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Enter Amount ({getCurrencySymbol(settings.currency)})
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-4 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold transition-all duration-200"
                  placeholder="0.00"
                  required
                  min="1"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Quick Select
              </label>
              <div className="grid grid-cols-3 gap-3">
                {quickAmounts.map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    className={`relative py-4 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                      amount === amt
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-105'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-green-50 hover:to-emerald-50 hover:text-green-600 border-2 border-transparent hover:border-green-200'
                    }`}
                    onClick={() => setAmount(amt)}
                  >
                    {amount === amt && (
                      <div className="absolute -top-1 -right-1 bg-white rounded-full p-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-green-500"
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
                    )}
                    <span className="text-lg">{formatCurrency(parseFloat(amt), settings.currency)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-shake">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/60 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  Show QR Code
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 p-2 rounded-lg flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 mb-1">How it works</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Select your recharge amount, touch & scan the QR code (or use the bKash number) to send payment.
                Upload proof of payment (optional) and wait for admin approval.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full my-8 max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-green-100 animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Payment QR Code</h2>
              </div>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setShowQRZoom(false);
                  setProofImageUrl('');
                  setProofImageFile(null);
                  setProofImagePreview('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* QR Code Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border-2 border-green-100">
              <div className="flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-green-700 flex items-center gap-2">
                    <span className="text-lg">👆</span> Touch &amp; Scan
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQRZoom(true)}
                    className="text-xs font-semibold text-green-700 bg-white/80 border border-green-200 px-3 py-1.5 rounded-full hover:bg-white transition-colors"
                  >
                    Tap to zoom
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQRZoom(true)}
                  className="relative bg-white p-5 rounded-2xl shadow-lg mb-4 border-4 border-green-200 cursor-pointer active:scale-[0.99] transition-transform"
                  aria-label="Touch and scan QR code (tap to zoom)"
                >
                  <div className="absolute -inset-2 rounded-3xl border-2 border-green-400/40 animate-pulseRing pointer-events-none" />
                  {bikashQRCodeId ? (
                    <QRCodeSVG value={bikashQRCodeId} size={220} />
                  ) : (
                    <DefaultBikashQR size={220} />
                  )}
                </button>
                <div className="text-center space-y-2">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-green-200">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Send money to Touch 'n Go number:</p>
                    <p className="text-xl font-bold text-green-600">{touchNGoNumber}</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-green-200">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Amount to send:</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(parseFloat(amount) || 0, settings.currency)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Zoom Overlay */}
            {showQRZoom && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
                <div className="bg-white rounded-3xl p-5 max-w-lg w-full shadow-2xl border-4 border-green-100 animate-scaleIn">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-bold text-gray-800 flex items-center gap-2">
                      <span>Touch &amp; Scan</span>
                      <span className="text-xs text-gray-500 font-semibold">(Zoom)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQRZoom(false)}
                      className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Close QR zoom"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="relative bg-white p-4 rounded-2xl border-4 border-green-200 shadow-lg">
                      <div className="absolute -inset-2 rounded-3xl border-2 border-green-400/40 animate-pulseRing pointer-events-none" />
                      {bikashQRCodeId ? (
                        <QRCodeSVG value={bikashQRCodeId} size={320} />
                      ) : (
                        <DefaultBikashQR size={320} />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
                      <div className="text-xs text-gray-500 font-semibold mb-1">Touch 'n Go number</div>
                      <div className="text-sm font-bold text-gray-800 break-all">{touchNGoNumber || '-'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
                      <div className="text-xs text-gray-500 font-semibold mb-1">Amount</div>
                      <div className="text-sm font-bold text-gray-800">{formatCurrency(parseFloat(amount) || 0, settings.currency)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Proof Upload Section */}
            <div className="mb-6">
              <label className="block text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Payment Proof (Optional)
              </label>

              {/* Step 1: Select Image */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Step 1: Select Payment Screenshot</label>
                <label className="block w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={submitting}
                  />
                  <div className="w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 cursor-pointer text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm text-gray-600 font-medium">Click to upload image</p>
                    <p className="text-xs text-gray-400 mt-1">Max size: 10MB (JPG, PNG)</p>
                  </div>
                </label>
              </div>

              {/* Image Preview */}
              {proofImagePreview && (
                <div className="mb-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-3">Preview:</p>
                  <div className="relative">
                    <img
                      src={proofImagePreview}
                      alt="Payment proof preview"
                      className="max-w-full h-48 object-contain border-2 border-gray-300 rounded-xl mx-auto bg-white p-2"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Upload to Google Drive */}
              {proofImageFile && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Step 2: Upload to Google Drive</label>
                  <button
                    type="button"
                    onClick={handleOpenGoogleDriveUpload}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2L3 7v11h4v-6h6v6h4V7l-7-5z"/>
                    </svg>
                    Open Google Drive Upload Folder
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Upload your image to the Google Drive folder, then make it shareable
                  </p>
                </div>
              )}

              {/* Step 3: Paste Link */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Step 3: Paste Google Drive Link (Optional)
                </label>
                <input
                  type="url"
                  value={proofImageUrl}
                  onChange={(e) => setProofImageUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... (Optional)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all duration-200"
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 mt-2">
                  After uploading, right-click the file → Get link → Copy link and paste here
                </p>
              </div>

              {/* Help Text */}
              <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800 font-bold mb-2 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Note
                </p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Proof of payment is optional. You can submit without it, but admin approval may take longer without verification.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmitRecharge}
                disabled={submitting}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-base shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/60 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Submit Request
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setShowQRZoom(false);
                  setProofImageUrl('');
                  setProofImageFile(null);
                  setProofImagePreview('');
                }}
                className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recharge;
