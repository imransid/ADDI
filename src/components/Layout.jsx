import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header with ADDI Logo */}
      <header className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white py-4 px-4 relative overflow-hidden">
        {/* Starry background effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-2 left-4 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute top-6 left-12 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute top-4 left-20 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute top-8 left-32 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute top-3 left-48 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute top-7 left-64 w-1 h-1 bg-white rounded-full"></div>
          <div className="absolute top-5 left-80 w-1 h-1 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10 text-center">
          <h1 className="text-2xl font-bold tracking-wider">ADDI</h1>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto pb-16">
        {/* Render the current page */}
        <Outlet />
      </main>
      {/* Bottom navigation bar */}
      <BottomNav currentPath={location.pathname} />
    </div>
  );
};

export default Layout;