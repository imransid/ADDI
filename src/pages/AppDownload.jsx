import React from 'react';

/**
 * App Download page. Provides information and links to download the mobile app.
 */
const AppDownload = () => {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">App Download</h1>
      <p className="text-sm text-gray-700">Get the full ADDI experience by downloading our mobile app.</p>
      <div className="bg-white p-4 rounded-md shadow-sm text-sm space-y-3 text-center">
        <div className="text-gray-700">Scan the QR code below with your phone camera to download:</div>
        <div className="flex justify-center">
          <img
            alt="QR code"
            className="h-32 w-32"
            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://example.com/download"
          />
        </div>
        <div className="text-gray-500 text-xs">Or visit: https://example.com/download</div>
      </div>
    </div>
  );
};

export default AppDownload;