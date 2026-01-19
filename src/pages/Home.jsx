import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Carousel from "@/components/Carousel";
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { productAPI } from '../services/api';

/**
 * Home page replicating the landing page of the ADDI app. It features
 * a hero image carousel, a marquee welcome message, quick action buttons,
 * a promotional card, and a grid of feature shortcuts.
 */
const Home = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user } = useSelector((state) => state.auth);
  const [hasPurchasedProduct, setHasPurchasedProduct] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  // Check if user has purchased any product
  useEffect(() => {
    if (user) {
      checkUserPurchases();
    }
  }, [user]);

  const checkUserPurchases = async () => {
    try {
      setCheckingPurchase(true);
      const response = await productAPI.getUserProducts(null);
      if (response.success) {
        const totalProducts = (response.data.unexpired?.length || 0) + (response.data.expired?.length || 0);
        setHasPurchasedProduct(totalProducts > 0);
      }
    } catch (error) {
      console.error('Failed to check user purchases:', error);
      setHasPurchasedProduct(false);
    } finally {
      setCheckingPurchase(false);
    }
  };
  // Dummy images; replace with actual assets or CDN links if desired.
  const slides = [
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=700&q=80",
    "https://images.pexels.com/photos/5665384/pexels-photo-5665384.jpeg",
    "https://images.pexels.com/photos/27919253/pexels-photo-27919253.jpeg",
    "https://images.pexels.com/photos/27919272/pexels-photo-27919272.jpeg",
    "https://images.pexels.com/photos/27992044/pexels-photo-27992044.jpeg",
    "https://images.pexels.com/photos/18108801/pexels-photo-18108801.jpeg",
    "https://images.pexels.com/photos/27603695/pexels-photo-27603695.jpeg",
    "https://images.pexels.com/photos/14409995/pexels-photo-14409995.jpeg",
    "https://images.pexels.com/photos/27523254/pexels-photo-27523254.jpeg",
    "https://images.pexels.com/photos/27523299/pexels-photo-27523299.jpeg",
    "https://images.pexels.com/photos/27661934/pexels-photo-27661934.jpeg",
    "https://images.pexels.com/photos/27603571/pexels-photo-27603571.jpeg"
  ];

  const gridItems = [
    {
      label: "My product",
      onClick: () => navigate("/my-product"),
      icon: (
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
            d="M16 11V7a4 4 0 10-8 0v4M12 14v5m-3 0h6"
          />
        </svg>
      ),
    },
    {
      label: "Invitation",
      onClick: () => navigate("/invitation"),
      icon: (
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
            d="M12 11c2.28 0 4-1.79 4-4s-1.72-4-4-4-4 1.79-4 4 1.72 4 4 4zM6 21v-2a4 4 0 014-4h0a4 4 0 014 4v2"
          />
        </svg>
      ),
    },
    {
      label: "App Download",
      onClick: () => navigate("/app-download"),
      icon: (
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
            d="M4 4v16h16V4H4zm8 11l-4-4h3V8h2v3h3l-4 4z"
          />
        </svg>
      ),
    },
    {
      label: "My teams",
      onClick: () => navigate("/my-teams"),
      icon: (
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
            d="M17 20h5V9H2v11h5M12 13.01V13"
          />
        </svg>
      ),
    },
    {
      label: "Online",
      onClick: () => navigate("/online"),
      icon: (
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
            d="M21 12.79A9 9 0 1111.21 3H21z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Hero carousel with enhanced styling */}
      <div className="relative">
        <Carousel images={slides} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Marquee welcome message - Enhanced */}
      <div className="mx-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-4 shadow-lg border border-primary/20 overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-800">Latest News</h2>
        </div>
        <div className="animate-marquee text-sm text-gray-700 leading-relaxed">
          Welcome to ADDI! Today we gather to celebrate the fusion of fashion
          and beauty. As a luxury brand with a long history, ADDI remains
          committed to innovation and elegance.
        </div>
      </div>


      {/* Quick action buttons - Enhanced */}
      <div className="mx-4 grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/recharge")}
          className="group flex items-center justify-center gap-3 py-4 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-white font-medium"
        >
          <span className="inline-block transform group-hover:rotate-180 transition-transform duration-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m0 0-3-3h-3"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </span>
          <span className="text-base">Recharge</span>
        </button>
        <button
          onClick={() => navigate("/withdraw")}
          className="group flex items-center justify-center gap-3 py-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-white font-medium"
        >
          <span className="inline-block transform group-hover:rotate-180 transition-transform duration-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V12l-3-3m0 0 3 3h3"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </span>
          <span className="text-base">Withdraw</span>
        </button>
      </div>

      {/* Golden egg card - Enhanced */}
      <div className="mx-4 bg-gradient-to-br from-amber-400 via-orange-400 to-pink-400 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-16 h-16 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-8 h-8 border-2 border-white rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg tracking-wide flex items-center gap-2">
              <span className="text-2xl">🥚</span>
              Smash Golden Egg
            </h3>
            <button
              onClick={() => alert("Rules: Smashing eggs is for fun only!")}
              className="text-xs underline hover:text-yellow-100 transition-colors font-medium"
            >
              Rules
            </button>
          </div>
          
          <div className="flex justify-around mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="transform hover:scale-110 transition-transform duration-300 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 filter drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  stroke="none"
                >
                  <path d="M12 2C7.031 2 3 7.03 3 12s4.031 10 9 10 9-5.03 9-10S16.969 2 12 2zm0 18c-4.411 0-8-4.037-8-8s3.589-8 8-8 8 4.037 8 8-3.589 8-8 8z" />
                </svg>
              </div>
            ))}
          </div>
          
          <div className="text-center bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <p className="text-sm mb-1 font-semibold">
              Remaining amount: <span className="text-2xl font-bold text-yellow-100">0</span>
            </p>
            <p className="text-xs leading-relaxed font-medium">
              Participate in the Golden Egg Smash to Win {formatCurrency(100000, settings.currency)} Grand Prize
            </p>
          </div>
        </div>
      </div>

      {/* Feature grid - Enhanced */}
      <div className="mx-4 bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
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
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          Quick Access
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {gridItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className="group flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-xs text-gray-700 hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 hover:text-primary focus:outline-none transform hover:scale-110 transition-all duration-300 border border-transparent hover:border-primary/30"
            >
              <span className="text-primary transform group-hover:scale-125 transition-transform duration-300 filter drop-shadow-sm">
                {item.icon}
              </span>
              <span className="font-medium group-hover:font-semibold transition-all">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
