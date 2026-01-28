import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { productAPI } from '../services/api';
import { fetchWallet } from '../store/walletSlice';
import { fetchUserProfile } from '../store/userSlice';
import { updateUserStatus } from '../store/authSlice';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

/**
 * Product page. Displays a list of products available for purchase from admin-created products.
 */
const Product = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const wallet = useSelector((state) => state.wallet);
  const { settings } = useSettings();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState({});

  const getValidityDays = (product) => {
    const asNumber = Number(product?.validityDays);
    if (!Number.isNaN(asNumber) && asNumber > 0) return Math.floor(asNumber);

    // Backward compatibility: derive "days" from validateDate if present
    if (product?.validateDate) {
      const now = new Date();
      const validateDate =
        product.validateDate?.toDate
          ? product.validateDate.toDate()
          : product.validateDate?.toMillis
            ? new Date(product.validateDate.toMillis())
            : new Date(product.validateDate);
      if (!Number.isNaN(validateDate?.getTime?.())) {
        const msPerDay = 1000 * 60 * 60 * 24;
        return Math.max(0, Math.ceil((validateDate - now) / msPerDay));
      }
    }

    return null;
  };

  useEffect(() => {
    loadProducts();
    // Refresh wallet to show current balance
    if (user) {
      dispatch(fetchWallet());
    }
  }, [user, dispatch]);

  // Refresh wallet when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        dispatch(fetchWallet());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, dispatch]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productAPI.getProducts();
      if (response.success) {

        // Filter out deleted products
        const activeProducts = response.data.products.filter(p => !p.deleted);
        setProducts(activeProducts);
      }
    } catch (err) {
      setError(err.message || 'Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productId) => {
    if (!user) {
      alert('Please login to purchase products');
      return;
    }

    if (!confirm('Are you sure you want to purchase this product?')) {
      return;
    }

    try {
      setPurchasing(prev => ({ ...prev, [productId]: true }));
      const response = await productAPI.purchaseProduct(null, productId);
      if (response.success) {
        // Check if account was activated
        if (response.data.accountActivated) {
          alert('Product purchased successfully! Your account has been activated.');
          // Update auth state to reflect account activation
          dispatch(updateUserStatus({ isActive: true }));
          // Refresh user profile to get updated data from database
          await dispatch(fetchUserProfile()).unwrap();
        } else {
          alert('Product purchased successfully!');
        }
        // Reload products and refresh wallet balance
        loadProducts();
        dispatch(fetchWallet());
      }
    } catch (err) {
      alert(err.message || 'Failed to purchase product');
      console.error('Purchase error:', err);
    } finally {
      setPurchasing(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-3 sm:border-4 border-primary border-t-transparent rounded-full animate-spin mb-3 sm:mb-4"></div>
          <p className="text-gray-600 font-medium text-sm sm:text-base md:text-lg">Loading exclusive products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">Products</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm md:text-base">
            {error}
          </div>
          <button
            onClick={loadProducts}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 md:py-3 bg-primary text-white text-sm sm:text-base rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Premium Header Section - Fully Responsive */}
      <div className="bg-gradient-to-r from-primary via-accent to-primary text-white py-4 sm:py-5 md:py-6 px-3 sm:px-4 md:px-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 max-w-7xl mx-auto">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-wide truncate">Exclusive Collection</h1>
            <p className="text-xs sm:text-sm md:text-base text-white/90 mt-1">Premium Products</p>
          </div>
          {user && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 border border-white/30 w-full sm:w-auto shrink-0">
              <div className="text-[10px] sm:text-xs text-white/80">Wallet Balance</div>
              <div className="text-base sm:text-lg md:text-xl font-bold truncate">{formatCurrency(wallet.rechargeWallet || 0, settings.currency)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24 max-w-7xl mx-auto">
        {products.length === 0 ? (
          <div className="text-center py-12 sm:py-16 md:py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 rounded-full mb-4">
              <svg
                className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400"
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
            <p className="text-gray-500 text-base sm:text-lg md:text-xl font-medium">No products available</p>
            <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-2">Check back later for exclusive offers</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {products.map((product) => {
              const validityDays = getValidityDays(product);

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col transform hover:-translate-y-1 border border-gray-100"
                >
                {/* Premium Image Section - Responsive Height */}
                <div className="relative h-40 sm:h-48 md:h-56 lg:h-52 xl:h-56 w-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {product.imageUrl ? (
                    <>
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                      <svg
                        className="h-12 w-12 sm:h-16 sm:w-16 text-primary/30"
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
                  
                  {/* Premium Badge - Responsive Size */}
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <div className="bg-gradient-to-r from-primary to-accent text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg">
                      EXCLUSIVE
                    </div>
                  </div>
                </div>

                {/* Product Info Section - Responsive Padding & Text */}
                <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-1 sm:line-clamp-2">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                    
                    {/* Premium Price Display - Responsive Text */}
                    <div className="mb-2 sm:mb-3 md:mb-4">
                      <div className="flex flex-wrap items-baseline gap-1">
                        <span className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-500">Price: {getCurrencySymbol(settings.currency)}</span>
                        <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary break-all">
                          {formatCurrency(product.price || 0, settings.currency).replace(getCurrencySymbol(settings.currency), '')}
                        </span>
                      </div>
                    </div>

                    {validityDays !== null && (
                      <div className="mb-2 sm:mb-3 md:mb-4">
                        <div className="flex flex-wrap items-baseline gap-1">
                          <span className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-500">Validity:</span>
                          <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary">
                            {validityDays} days
                          </span>
                        </div>
                      </div>
                    )}

                    {product.earnAmount > 0 && (
                      <div className="mb-2 sm:mb-3 md:mb-4">
                        <div className="flex flex-wrap items-baseline gap-1">
                          <span className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-500">Daily Earn: {getCurrencySymbol(settings.currency)}</span>
                          <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary break-all">
                            {formatCurrency(product.earnAmount || 0, settings.currency).replace(getCurrencySymbol(settings.currency), '')}
                          </span>
                        </div>
                      </div>
                    )}

                    {product.totalEarning > 0 && (
                      <div className="mb-2 sm:mb-3 md:mb-4">
                        <div className="flex flex-wrap items-baseline gap-1">
                          <span className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-500">Total Earning: {getCurrencySymbol(settings.currency)}</span>
                          <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary break-all">
                            {formatCurrency(product.totalEarning || 0, settings.currency).replace(getCurrencySymbol(settings.currency), '')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Premium Purchase Button - Responsive Size */}
                  <button
                    onClick={() => handlePurchase(product.id)}
                    disabled={purchasing[product.id] || (wallet.rechargeWallet || 0) < (product.price || 0)}
                    className="w-full bg-gradient-to-r from-primary to-accent text-white font-semibold text-xs sm:text-sm md:text-base py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md flex items-center justify-center gap-1.5 sm:gap-2 group/btn mt-3 sm:mt-4"
                  >
                    {purchasing[product.id] ? (
                      <>
                        <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4 sm:h-5 sm:w-5 group-hover/btn:translate-x-1 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                        <span>Purchase Now</span>
                      </>
                    )}
                  </button>
                  
                  {/* Insufficient Balance Warning - Responsive Text */}
                  {user && (wallet.rechargeWallet || 0) < (product.price || 0) && !purchasing[product.id] && (
                    <p className="text-[10px] sm:text-xs text-red-500 text-center mt-1.5 sm:mt-2">
                      Insufficient balance
                    </p>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Product;