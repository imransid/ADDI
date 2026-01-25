import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Carousel from "@/components/Carousel";
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { productAPI, vipAPI } from '../services/api';

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
  const [vipStatus, setVipStatus] = useState(null);
  const [loadingVIP, setLoadingVIP] = useState(false);

  // Check if user has purchased any product
  useEffect(() => {
    if (user) {
      checkUserPurchases();
      fetchVIPStatus();
    }
  }, [user]);

  // Fetch VIP status
  const fetchVIPStatus = async () => {
    if (!user?.id) {
      return;
    }

    try {
      setLoadingVIP(true);
      const response = await vipAPI.getVIPStatus(null);
      if (response.success) {
        setVipStatus(response.data);
        // Auto-check and claim rewards
        try {
          await vipAPI.claimVIPRewards(null);
        } catch (rewardError) {
          // Silently fail - rewards might already be claimed
        }
      }
    } catch (error) {
      console.error('Failed to fetch VIP status:', error);
    } finally {
      setLoadingVIP(false);
    }
  };

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
    <div className="flex flex-col gap-6 pb-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Hero carousel with enhanced styling */}
      <div className="relative -mt-4">
        <Carousel images={slides} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
        {/* Floating badge */}
        <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-full px-4 py-2 shadow-xl border border-white/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-gray-800">Live Now</span>
          </div>
        </div>
      </div>

      {/* VIP Status Card - Premium Display */}
      {vipStatus && (
        <div className="mx-4 relative">
          {vipStatus.vipLevel > 0 ? (
            // VIP Member Card
            <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-3xl p-6 shadow-2xl text-white transform hover:scale-[1.02] transition-all duration-300 border-2 border-yellow-300 relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-4 w-20 h-20 border-3 border-white rounded-full animate-pulse"></div>
                <div className="absolute bottom-4 right-4 w-16 h-16 border-3 border-white rounded-full animate-pulse delay-500"></div>
                <div className="absolute top-1/2 left-1/3 w-12 h-12 border-2 border-white rounded-full animate-pulse delay-700"></div>
              </div>
              
              {/* Sparkle effects */}
              <div className="absolute top-3 right-6 text-2xl animate-bounce">✨</div>
              <div className="absolute bottom-6 left-8 text-xl animate-bounce delay-500">⭐</div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl animate-pulse">👑</div>
                    <div>
                      <div className="text-2xl font-black mb-1">{vipStatus.vipLevelName}</div>
                      <div className="text-sm text-white/90">Exclusive VIP Member</div>
                    </div>
                  </div>
                  <div className="text-5xl opacity-30">
                    {vipStatus.vipLevel === 2 ? '💎' : '⭐'}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
                    <div className="text-xs text-white/80 mb-1">Referrals</div>
                    <div className="text-2xl font-black">{vipStatus.referralCount}</div>
                    <div className="text-xs text-yellow-200 mt-1">
                      {vipStatus.vipLevel === 2 ? 'VIP 2 Unlocked!' : `${20 - vipStatus.referralCount} to VIP 2`}
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
                    <div className="text-xs text-white/80 mb-1">Weekly Reward</div>
                    <div className="text-xl font-black">{formatCurrency(vipStatus.weeklyReward, settings.currency)}</div>
                    {vipStatus.nextWeeklyReward && (
                      <div className="text-xs text-yellow-200 mt-1">
                        Next: {new Date(vipStatus.nextWeeklyReward).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Benefits */}
                <div className="bg-white/25 backdrop-blur-md rounded-xl p-4 border border-white/30 mb-3">
                  <div className="text-xs font-bold text-yellow-200 mb-2">VIP Benefits</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span>💰</span> Weekly Reward
                      </span>
                      <span className="font-bold">{formatCurrency(vipStatus.weeklyReward, settings.currency)}</span>
                    </div>
                    {vipStatus.monthlyReward > 0 && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span>💎</span> Monthly Reward
                          </span>
                          <span className="font-bold">{formatCurrency(vipStatus.monthlyReward, settings.currency)}</span>
                        </div>
                        {vipStatus.nextMonthlyReward && (
                          <div className="text-xs text-white/80 pt-1 border-t border-white/20">
                            Next Monthly: {new Date(vipStatus.nextMonthlyReward).toLocaleDateString()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Progress to next level */}
                {vipStatus.vipLevel === 1 && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-white/90">Progress to VIP 2</span>
                      <span className="font-bold text-yellow-200">{vipStatus.referralCount} / 20</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((vipStatus.referralCount / 20) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Regular Member - Progress Card
            <div className="bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-3xl p-6 shadow-2xl text-white border-2 border-gray-600 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-12 h-12 border-2 border-white rounded-full"></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">📈</div>
                    <div>
                      <div className="text-2xl font-black mb-1">Regular Member</div>
                      <div className="text-sm text-white/80">Become a VIP Member</div>
                    </div>
                  </div>
                  <div className="text-5xl opacity-30">🎯</div>
                </div>

                {/* Progress to VIP 1 */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-3">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-white/90 font-semibold">Progress to VIP 1</span>
                    <span className="font-black text-yellow-300">{vipStatus.referralCount} / 5</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((vipStatus.referralCount / 5) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-white/70">
                    {5 - vipStatus.referralCount} more {vipStatus.referralCount === 4 ? 'referral' : 'referrals'} needed for VIP 1
                  </div>
                </div>

                {/* VIP Benefits Preview */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-xs font-bold text-yellow-300 mb-2">VIP 1 Benefits</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span>✅</span>
                      <span>Weekly reward: {formatCurrency(5, settings.currency)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>✅</span>
                      <span>Exclusive VIP status</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <span>🔒</span>
                      <span>VIP 2: {formatCurrency(5, settings.currency)} weekly + {formatCurrency(2000, settings.currency)} monthly</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/invitation')}
                    className="mt-3 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2.5 rounded-xl transition-all transform hover:scale-105 text-sm"
                  >
                    Invite Friends to Unlock VIP
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Marquee welcome message - Ultra Enhanced with Glassmorphism */}
      <div className="mx-4 relative">
        <div className="bg-gradient-to-r from-white via-white/95 to-white backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-white/50 overflow-hidden relative">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-50"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 bg-gradient-to-br from-primary to-accent p-2 rounded-xl shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-800 tracking-tight">Latest News</h2>
              <div className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">NEW</div>
            </div>
            <div className="relative overflow-hidden">
              <div className="animate-marquee text-sm text-gray-700 leading-relaxed font-medium">
                Welcome to ADDI! Today we gather to celebrate the fusion of fashion
                and beauty. As a luxury brand with a long history, ADDI remains
                committed to innovation and elegance.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick action buttons - Ultra Enhanced with 3D effects */}
      <div className="mx-4 grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/recharge")}
          className="group relative flex items-center justify-center gap-3 py-5 bg-gradient-to-br from-primary via-primary to-accent rounded-2xl shadow-2xl hover:shadow-primary/50 transform hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 text-white font-semibold overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl group-hover:rotate-180 transition-transform duration-500">
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
            </div>
            <span className="text-base tracking-wide">Recharge</span>
          </div>
          
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-full"></div>
        </button>
        
        <button
          onClick={() => navigate("/withdraw")}
          className="group relative flex items-center justify-center gap-3 py-5 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl shadow-2xl hover:shadow-blue-500/50 transform hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 text-white font-semibold overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl group-hover:rotate-180 transition-transform duration-500">
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
            </div>
            <span className="text-base tracking-wide">Withdraw</span>
          </div>
          
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-full"></div>
        </button>
      </div>

      {/* Golden egg card - Ultra Enhanced with Premium Design */}
      <div className="mx-4 relative group">
        <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-pink-400 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden transform hover:scale-[1.02] transition-all duration-500 border-2 border-white/30">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-4 w-20 h-20 border-3 border-white rounded-full animate-pulse"></div>
            <div className="absolute bottom-4 right-4 w-16 h-16 border-3 border-white rounded-full animate-pulse delay-300"></div>
            <div className="absolute top-1/2 left-1/4 w-12 h-12 border-3 border-white rounded-full animate-pulse delay-700"></div>
            <div className="absolute top-1/3 right-1/3 w-8 h-8 border-2 border-white rounded-full animate-pulse delay-1000"></div>
          </div>
          
          {/* Sparkle effects */}
          <div className="absolute top-2 right-8 text-2xl animate-bounce">✨</div>
          <div className="absolute bottom-8 left-12 text-xl animate-bounce delay-500">⭐</div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-black text-xl tracking-wide flex items-center gap-3">
                <span className="text-3xl animate-bounce">🥚</span>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">Smash Golden Egg</span>
              </h3>
              <button
                onClick={() => alert("Rules: Smashing eggs is for fun only!")}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all transform hover:scale-110"
              >
                Rules
              </button>
            </div>
            
            <div className="flex justify-around mb-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="transform hover:scale-125 transition-all duration-300 cursor-pointer group/egg"
                >
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-14 w-14 filter drop-shadow-2xl group-hover/egg:drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] transition-all"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      stroke="none"
                    >
                      <path d="M12 2C7.031 2 3 7.03 3 12s4.031 10 9 10 9-5.03 9-10S16.969 2 12 2zm0 18c-4.411 0-8-4.037-8-8s3.589-8 8-8 8 4.037 8 8-3.589 8-8 8z" />
                    </svg>
                    <div className="absolute inset-0 bg-white/30 rounded-full blur-xl opacity-0 group-hover/egg:opacity-100 transition-opacity"></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center bg-white/25 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-inner">
              <p className="text-sm mb-2 font-bold">
                Remaining amount: <span className="text-3xl font-black text-yellow-100 drop-shadow-lg">0</span>
              </p>
              <p className="text-xs leading-relaxed font-semibold opacity-95">
                Participate in the Golden Egg Smash to Win {formatCurrency(100000, settings.currency)} Grand Prize
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature grid - Ultra Enhanced with Modern Cards */}
      <div className="mx-4 bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-100/50 relative overflow-hidden">
        {/* Decorative top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
        
        <h3 className="text-xl font-black text-gray-800 mb-5 flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-xl shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </div>
          <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Quick Access</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {gridItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className="group relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl text-sm text-gray-700 bg-gradient-to-br from-white to-gray-50 hover:from-primary/10 hover:to-accent/10 hover:text-primary focus:outline-none transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 border-2 border-gray-100 hover:border-primary/40 shadow-md hover:shadow-xl overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Icon container with glow effect */}
              <div className="relative z-10 bg-gradient-to-br from-primary/10 to-accent/10 p-3 rounded-xl group-hover:from-primary/20 group-hover:to-accent/20 transition-all transform group-hover:scale-125 group-hover:rotate-6 duration-300">
                <span className="text-primary transform transition-transform duration-300 filter drop-shadow-lg">
                  {item.icon}
                </span>
              </div>
              
              <span className="relative z-10 font-bold group-hover:font-black transition-all text-xs sm:text-sm">{item.label}</span>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
