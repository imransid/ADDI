import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { productAPI } from "../services/api";
import { fetchWallet } from "../store/walletSlice";
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

/**
 * My Product page. Displays earnings summary and lists purchased products
 * grouped into unexpired and expired categories.
 */
const MyProduct = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.wallet);
  const { user } = useSelector((state) => state.auth);
  const { settings } = useSettings();
  const [tab, setTab] = useState("unexpired");
  const [products, setProducts] = useState({ unexpired: [], expired: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState({});
  const [earnTimers, setEarnTimers] = useState({}); // Track earning opportunity timers
  const [earning, setEarning] = useState({}); // Track which products are being earned from

  // Load user products and wallet data
  useEffect(() => {
    if (user) {
      loadUserProducts();
      dispatch(fetchWallet());
    }
  }, [user, dispatch]);

  // Update countdown timers for unexpired products (expiry and earning opportunity)
  useEffect(() => {
    if (products.unexpired.length === 0) return;

    const timer = setInterval(() => {
      const newTimeLeft = {};
      const newEarnTimers = {};
      const now = Date.now();

      products.unexpired.forEach((product) => {
        // Expiry countdown
        if (product.expiryDate) {
          const expiry = new Date(product.expiryDate);
          const diff = expiry - now;

          if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            newTimeLeft[product.id] = { hours, minutes, seconds };
          } else {
            newTimeLeft[product.id] = { hours: 0, minutes: 0, seconds: 0 };
          }
        }

        // Earning opportunity countdown (3-hour window every 24 hours)
        if (product.earnAmount > 0) {
          const toMs = (ts) =>
            ts?.toMillis ? ts.toMillis() : (ts ? new Date(ts).getTime() : null);

          // Use `earnWindowStartAt` when present; otherwise anchor the schedule
          // to `purchaseDate` so the 3-hour window still expires even if the user
          // never clicks the Earn button (backward compatibility).
          const baseWindowStart = toMs(product.earnWindowStartAt) ?? toMs(product.purchaseDate);
          const THREE_HOURS = 3 * 60 * 60 * 1000;
          const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

          // If we still can't anchor (should be rare), fall back to "window now"
          // with a 3-hour countdown.
          const anchoredBase = baseWindowStart ?? now;

          const cyclesElapsed = Math.floor(Math.max(0, now - anchoredBase) / TWENTY_FOUR_HOURS);
          const windowStart = anchoredBase + cyclesElapsed * TWENTY_FOUR_HOURS;
          const windowEnd = windowStart + THREE_HOURS;

          if (now < windowStart) {
            const timeRemaining = windowStart - now;
            const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
            const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
            newEarnTimers[product.id] = {
              status: 'cooldown',
              hours,
              minutes,
              seconds,
              canEarn: false,
            };
          } else if (now <= windowEnd) {
            const timeRemaining = windowEnd - now;
            const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
            const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
            newEarnTimers[product.id] = {
              status: 'window',
              hours,
              minutes,
              seconds,
              canEarn: true,
            };
          } else {
            const nextWindowStart = windowStart + TWENTY_FOUR_HOURS;
            const timeRemaining = nextWindowStart - now;
            const hours = Math.max(0, Math.floor(timeRemaining / (60 * 60 * 1000)));
            const minutes = Math.max(0, Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000)));
            const seconds = Math.max(0, Math.floor((timeRemaining % (60 * 1000)) / 1000));
            newEarnTimers[product.id] = {
              status: 'missed',
              hours,
              minutes,
              seconds,
              canEarn: false,
            };
          }
        }
      });
      setTimeLeft(newTimeLeft);
      setEarnTimers(newEarnTimers);
    }, 1000);

    return () => clearInterval(timer);
  }, [products.unexpired]);

  const loadUserProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productAPI.getUserProducts();
      if (response.success) {
        setProducts({
          unexpired: response.data.unexpired || [],
          expired: response.data.expired || [],
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load products');
      console.error('Error loading user products:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    return String(time || 0).padStart(2, "0");
  };

  const formatValidityPeriod = (product) => {
    if (product.daysRemaining !== undefined && product.validityDays) {
      const used = product.validityDays - product.daysRemaining;
      return `${used}/${product.validityDays}`;
    }
    return "0/48";
  };

  const handleReceive = async (productId) => {
    if (earning[productId]) return; // Already processing

    const product = products.unexpired.find(p => p.id === productId);
    if (!product) return;

    const earnTimer = earnTimers[productId];
    if (!earnTimer || !earnTimer.canEarn) {
      alert('Earning opportunity is not available. You can only earn during the 3-hour window.');
      return;
    }

    if (!confirm(`Are you sure you want to earn ${formatCurrency(product.earnAmount || 0, settings.currency)} from this product?`)) {
      return;
    }

    try {
      setEarning(prev => ({ ...prev, [productId]: true }));
      const response = await productAPI.earnFromProduct(null, productId);
      
      if (response.success) {
        alert(`Successfully earned ${formatCurrency(response.data.amount, settings.currency)}!`);
        // Reload products and wallet
        await loadUserProducts();
        dispatch(fetchWallet());
      }
    } catch (err) {
      alert(err.message || 'Failed to earn from product');
      console.error('Earn error:', err);
    } finally {
      setEarning(prev => ({ ...prev, [productId]: false }));
    }
  };

  const currentProducts = products[tab] || [];


  // Calculate today's earnings
  const todayEarnings = wallet.incomeToday > 0 ? wallet.incomeToday : 0;
  // Calculate total earnings
  const totalEarnings = wallet.totalEarnings > 0 ? wallet.totalEarnings : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Premium Header Section */}
      <div className="bg-gradient-to-r from-primary via-accent to-primary text-white py-6 px-4 shadow-lg">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white hover:text-white/80 transition-colors mr-4"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-wide">My Products</h1>
            <p className="text-sm text-white/90 mt-1">Your Exclusive Collection</p>
          </div>
        </div>

        {/* Premium Earnings Summary */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="text-xs text-white/80 mb-1">Today's Earnings</div>
            <div className="text-2xl font-bold">{formatCurrency(todayEarnings, settings.currency)}</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="text-xs text-white/80 mb-1">Total Earnings</div>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings, settings.currency)}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {/* Premium Filter Tabs */}
        <div className="bg-white rounded-2xl mb-6 shadow-lg overflow-hidden border border-gray-100">
          <div className="flex">
            <button
              onClick={() => setTab("unexpired")}
              className={`flex-1 py-4 text-sm font-semibold relative transition-all ${
                tab === "unexpired" 
                  ? "text-primary bg-primary/10" 
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              <span className="relative z-10">Active Products</span>
              {tab === "unexpired" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent"></div>
              )}
            </button>
            <button
              onClick={() => setTab("expired")}
              className={`flex-1 py-4 text-sm font-semibold relative transition-all ${
                tab === "expired" 
                  ? "text-primary bg-primary/10" 
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              <span className="relative z-10">Expired Products</span>
              {tab === "expired" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent"></div>
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your products...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
            <button
              onClick={loadUserProducts}
              className="ml-2 text-red-800 underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Product List */}
        {!loading && !error && (
          <div className="space-y-4">
            {currentProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <svg
                    className="h-10 w-10 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg font-medium">
                  No {tab === "unexpired" ? "active" : "expired"} products
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {tab === "unexpired" 
                    ? "Purchase products to see them here" 
                    : "No expired products yet"}
                </p>
              </div>
            ) : (
              currentProducts.map((product) => {
                const timer = timeLeft[product.id] || { hours: 0, minutes: 0, seconds: 0 };
                const isExpired = tab === "expired";
                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1"
                  >
                    <div className="flex">
                      {/* Premium Product Image */}
                      <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      {product.imageUrl ? (
                          <>
                            <img
                              src={product.imageUrl}
                              alt={product.productName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                            <svg
                              className="h-12 w-12 text-primary/30"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        {!isExpired && (
                          <div className="absolute top-2 left-2">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              ACTIVE
                            </div>
                          </div>
                        )}
                        {isExpired && (
                          <div className="absolute top-2 left-2">
                            <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              EXPIRED
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Premium Product Details */}
                      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                        <div className="space-y-2">
                          <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                            {product.productName}
                          </h3>
                          
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-gray-500">Price:</span>
                            <span className="text-lg font-bold text-primary">
                              {formatCurrency(product.productPrice || 0, settings.currency)}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <div>
                              <span className="text-gray-500">Validity: </span>
                              <span className="font-semibold text-gray-900">
                                {formatValidityPeriod(product)} days
                              </span>
                            </div>
                            {product.daysRemaining !== undefined && !isExpired && (
                              <div className="text-primary font-semibold">
                                {product.daysRemaining} days left
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Total Earnings:</span>
                            <span className="text-sm font-bold text-green-600">
                              {formatCurrency(product.totalEarnings || 0, settings.currency)}
                            </span>
                            {product.totalEarning > 0 && (
                              <span className="text-xs text-gray-400">
                                / {formatCurrency(product.totalEarning, settings.currency)} max
                              </span>
                            )}
                          </div>
                          {product.totalEarning > 0 && product.totalEarnings >= product.totalEarning && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-semibold text-orange-600">
                                ⚠️ Maximum earning limit reached
                              </span>
                            </div>
                          )}
                          {product.totalEarning > 0 && product.totalEarnings < product.totalEarning && (
                            <div className="mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${Math.min((product.totalEarnings / product.totalEarning) * 100, 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {((product.totalEarnings / product.totalEarning) * 100).toFixed(1)}% of maximum earned
                              </div>
                            </div>
                          )}

                          {/* Validation Date */}
                          {product.validateDate && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Valid Until:</span>
                              <span className="text-xs font-semibold text-gray-900">
                                {new Date(product.validateDate?.toMillis ? product.validateDate.toMillis() : product.validateDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {/* Earn Amount */}
                          {product.earnAmount > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Daily Earn:</span>
                              <span className="text-sm font-bold text-blue-600">
                                {formatCurrency(product.earnAmount, settings.currency)}
                              </span>
                            </div>
                          )}

                          {/* Total Earning (Maximum) */}
                          {product.totalEarning > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Max Total Earning:</span>
                              <span className="text-sm font-bold text-purple-600">
                                {formatCurrency(product.totalEarning, settings.currency)}
                              </span>
                            </div>
                          )}

                          {/* Earning Opportunity Status - Prominent Display */}
                          {!isExpired && product.earnAmount > 0 && earnTimers[product.id] && (
                            <div className="mt-3 p-3 rounded-xl border-2 shadow-md" style={{
                              backgroundColor: earnTimers[product.id].status === 'available' || earnTimers[product.id].status === 'window' 
                                ? 'rgba(34, 197, 94, 0.1)' 
                                : earnTimers[product.id].status === 'missed'
                                ? 'rgba(239, 68, 68, 0.1)'
                                : 'rgba(59, 130, 246, 0.1)',
                              borderColor: earnTimers[product.id].status === 'available' || earnTimers[product.id].status === 'window'
                                ? 'rgb(34, 197, 94)'
                                : earnTimers[product.id].status === 'missed'
                                ? 'rgb(239, 68, 68)'
                                : 'rgb(59, 130, 246)'
                            }}>
                              {earnTimers[product.id].status === 'available' && (
                                <div className="flex items-center gap-2">
                                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-bold text-green-700">
                                      Earning Available Now!
                                    </div>
                                    <div className="text-xs text-green-600 mt-0.5">
                                      You can earn {formatCurrency(product.earnAmount, settings.currency)} right away
                                    </div>
                                  </div>
                                </div>
                              )}
                              {earnTimers[product.id].status === 'window' && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-bold text-orange-700">
                                        ⏰ 3-Hour Window Open!
                                      </div>
                                      <div className="text-xs text-orange-600 mt-0.5">
                                        You can earn once during this window
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-white/50 rounded-lg p-2 text-center">
                                    <div className="text-xs text-gray-600 mb-1">Time Remaining:</div>
                                    <div className="text-lg font-bold text-orange-700">
                                      {formatTime(earnTimers[product.id].hours)}:{formatTime(earnTimers[product.id].minutes)}:{formatTime(earnTimers[product.id].seconds)}
                                    </div>
                                  </div>
                                </div>
                              )}
                              {earnTimers[product.id].status === 'cooldown' && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-bold text-blue-700">
                                        Next Earning Opportunity
                                      </div>
                                      <div className="text-xs text-blue-600 mt-0.5">
                                        You can earn {formatCurrency(product.earnAmount, settings.currency)} in:
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-white/50 rounded-lg p-3 text-center">
                                    <div className="text-xs text-gray-600 mb-1">Time Until Next Earn:</div>
                                    <div className="text-2xl font-bold text-blue-700 tracking-wider">
                                      {formatTime(earnTimers[product.id].hours)}:{formatTime(earnTimers[product.id].minutes)}:{formatTime(earnTimers[product.id].seconds)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {earnTimers[product.id].hours > 0 && `${earnTimers[product.id].hours} hour${earnTimers[product.id].hours > 1 ? 's' : ''}, `}
                                      {earnTimers[product.id].minutes} minute{earnTimers[product.id].minutes !== 1 ? 's' : ''}, {earnTimers[product.id].seconds} second{earnTimers[product.id].seconds !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </div>
                              )}
                              {earnTimers[product.id].status === 'missed' && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-bold text-red-700">
                                        ⚠️ Window Missed
                                      </div>
                                      <div className="text-xs text-red-600 mt-0.5">
                                        Next 3-hour window in:
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-white/50 rounded-lg p-3 text-center">
                                    <div className="text-xs text-gray-600 mb-1">Time Until Next Earn:</div>
                                    <div className="text-2xl font-bold text-red-700 tracking-wider">
                                      {formatTime(earnTimers[product.id].hours)}:{formatTime(earnTimers[product.id].minutes)}:{formatTime(earnTimers[product.id].seconds)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {earnTimers[product.id].hours > 0 && `${earnTimers[product.id].hours} hour${earnTimers[product.id].hours > 1 ? 's' : ''}, `}
                                      {earnTimers[product.id].minutes} minute{earnTimers[product.id].minutes !== 1 ? 's' : ''}, {earnTimers[product.id].seconds} second{earnTimers[product.id].seconds !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Premium Receive Button - Only for unexpired products with earn amount */}
                        {!isExpired && product.earnAmount > 0 && (
                          <button
                            className={`w-full font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 mt-4 flex items-center justify-center gap-2 group/btn ${
                              earnTimers[product.id]?.canEarn && !earning[product.id]
                                ? 'bg-gradient-to-r from-primary to-accent text-white hover:scale-[1.02]'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            onClick={() => handleReceive(product.id)}
                            disabled={!earnTimers[product.id]?.canEarn || earning[product.id]}
                          >
                            {earning[product.id] ? (
                              <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Processing...</span>
                              </>
                            ) : earnTimers[product.id]?.canEarn ? (
                              <>
                                <svg
                                  className="h-5 w-5 group-hover/btn:rotate-12 transition-transform"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="font-bold">Earn {formatCurrency(product.earnAmount, settings.currency)}</span>
                              </>
                            ) : (
                              <>
                                <span>Earn Unavailable</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Expiry Countdown - Show if no earn amount */}
                        {!isExpired && (!product.earnAmount || product.earnAmount === 0) && (
                          <div className="mt-4 text-center">
                            <div className="text-xs text-gray-500 mb-1">Expires in:</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatTime(timer.hours)}:{formatTime(timer.minutes)}:{formatTime(timer.seconds)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Premium End Indicator */}
            {currentProducts.length > 0 && (
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
                  <div className="h-px w-12 bg-gray-300"></div>
                  <span>End of list</span>
                  <div className="h-px w-12 bg-gray-300"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProduct;
