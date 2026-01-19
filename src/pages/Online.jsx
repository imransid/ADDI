import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

/**
 * Online page. Provides information on how to contact support or access online
 * customer service. Features an improved UI with WhatsApp integration.
 */
const Online = () => {
  const { settings, loading } = useSettings();

  // Format phone number to remove special characters for WhatsApp link
  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '');
  };

  // Open WhatsApp with support number
  const handleWhatsAppClick = () => {
    const phoneNumber = formatPhoneForWhatsApp(settings.supportNumber);
    if (!phoneNumber) {
      alert('Support number is not configured. Please contact admin.');
      return;
    }
    
    // Default message
    const message = encodeURIComponent('Hello! I need support.');
    // Open WhatsApp link
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-6">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-primary to-accent p-6 text-white mb-6 rounded-b-3xl shadow-lg">
        <div className="absolute inset-0 bg-black/10 rounded-b-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
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
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Online Support</h1>
              <p className="text-white/90 text-sm">We're here to help you 24/7</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-500 p-3 rounded-xl">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Need Help?</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our customer support team is ready to assist you with any questions or concerns. 
                Contact us through WhatsApp for instant support and quick responses.
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Support Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-2xl text-white transform hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">WhatsApp Support</h3>
                <p className="text-white/90 text-sm">Tap to chat with us instantly</p>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          ) : settings.supportNumber ? (
            <>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                <p className="text-sm text-white/80 mb-1">Support Number</p>
                <p className="text-xl font-bold">{settings.supportNumber}</p>
              </div>
              <button
                onClick={handleWhatsAppClick}
                className="w-full bg-white text-green-600 font-bold py-4 rounded-xl hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>Open WhatsApp</span>
              </button>
            </>
          ) : (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-white/90">
                Support number is not configured yet. Please contact administrator.
              </p>
            </div>
          )}
        </div>

        {/* Additional Support Information */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-primary"
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
            Support Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-semibold text-gray-800 text-sm">24/7 Availability</p>
                <p className="text-gray-600 text-xs">Our support team is available around the clock</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Quick Response</p>
                <p className="text-gray-600 text-xs">Get instant help through WhatsApp messaging</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Secure Communication</p>
                <p className="text-gray-600 text-xs">Your conversations are encrypted and private</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Online;