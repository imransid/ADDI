import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { withdrawWallet } from '../store/walletSlice';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { userAPI, productAPI } from '../services/api';

/**
 * Enhanced Withdraw page with BIKASH support
 * Users can add and manage their payment method details
 */
const Withdraw = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wallet = useSelector((state) => state.wallet);
  const { loading, error } = useSelector((state) => state.wallet);
  const { user } = useSelector((state) => state.auth);
  const { settings } = useSettings();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bikash');
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    bikash: { number: '', name: '' },
  });
  const [formData, setFormData] = useState({ number: '', name: '' });
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [hasPurchasedProduct, setHasPurchasedProduct] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);

  // Load user payment details and check if user has purchased any product
  useEffect(() => {
    loadPaymentDetails();
    checkUserPurchases();
  }, [user]);

  const loadPaymentDetails = async () => {
    if (!user) {
      setLoadingDetails(false);
      return;
    }

    try {
      setLoadingDetails(true);
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setPaymentDetails({
          bikash: userData.bikash || { number: '', name: '' },
        });
      }
    } catch (error) {
      console.error('Failed to load payment details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const checkUserPurchases = async () => {
    if (!user) {
      setCheckingPurchase(false);
      return;
    }

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

  const handleAddMethod = () => {
    setFormData({ number: '', name: '' });
    setEditingMethod(null);
    setShowAddMethod(true);
  };

  const handleEditMethod = (method) => {
    setFormData(paymentDetails[method] || { number: '', name: '' });
    setEditingMethod(method);
    setShowAddMethod(true);
  };

  const handleSaveMethod = async () => {
    if (!formData.number || !formData.name) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const method = editingMethod || paymentMethod;
      const updatedDetails = {
        ...paymentDetails,
        [method]: { number: formData.number, name: formData.name },
      };

      // Update in Firestore
      await updateDoc(doc(db, 'users', user.id), {
        [method]: updatedDetails[method],
        updatedAt: serverTimestamp(),
      });

      setPaymentDetails(updatedDetails);
      setShowAddMethod(false);
      setEditingMethod(null);
      setFormData({ number: '', name: '' });
      alert(`${method.toUpperCase()} details saved successfully!`);
    } catch (error) {
      alert(`Failed to save ${editingMethod || paymentMethod} details: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Use balance wallet for withdrawal
    const availableBalance = wallet.balanceWallet || 0;
    
    if (amt > availableBalance) {
      alert(`Insufficient balance. Available balance: ${formatCurrency(availableBalance, settings.currency)}`);
      return;
    }

    // Calculate VAT tax (10% of withdrawal amount)
    const vatTax = amt * 0.10;
    const netAmount = amt - vatTax;

    // Check if payment method is configured
    const selectedDetails = paymentDetails[paymentMethod];
    if (!selectedDetails?.number || !selectedDetails?.name) {
      alert(`Please add your ${paymentMethod.toUpperCase()} details first`);
      setShowAddMethod(true);
      setEditingMethod(paymentMethod);
      return;
    }

    // Confirm withdrawal with VAT information
    const confirmMessage = `Withdrawal Details:\n\n` +
      `Withdrawal Amount: ${formatCurrency(amt, settings.currency)}\n` +
      `VAT Tax (10%): ${formatCurrency(vatTax, settings.currency)}\n` +
      `You will receive: ${formatCurrency(netAmount, settings.currency)}\n\n` +
      `Proceed with withdrawal?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Update withdraw API call to include payment method and VAT
      await dispatch(withdrawWallet({ 
        amount: amt, 
        paymentMethod, 
        vatTax,
        netAmount,
        ...selectedDetails 
      })).unwrap();
      alert(`Withdrawal request submitted!\n\n` +
        `Amount: ${formatCurrency(amt, settings.currency)}\n` +
        `VAT (10%): ${formatCurrency(vatTax, settings.currency)}\n` +
        `You will receive: ${formatCurrency(netAmount, settings.currency)}`);
      setAmount('');
      navigate('/');
    } catch (err) {
      alert(`Withdrawal failed: ${err}`);
    }
  };

  // Calculate available balance for withdrawal
  const availableBalance = wallet.balanceWallet || 0;

  // Check if withdrawals are allowed (only Saturday and Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[dayOfWeek];

  const currentMethod = paymentDetails[paymentMethod];

  if (loadingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-purple-50 pb-20">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-8 px-4 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-12 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-4 left-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-4xl mb-2">💸</div>
          <h1 className="text-3xl font-bold tracking-wide">Withdraw Funds</h1>
          <p className="text-white/90 text-sm mt-2">Withdraw to BIKASH</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Weekend Restriction Warning */}
        {!isWeekend && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 shadow-2xl text-white border-2 border-orange-400">
            <div className="flex items-start gap-4">
              <div className="text-4xl animate-pulse">📅</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Only Saturday and Sunday Withdraw possible</h3>
                <p className="text-white/90 text-sm mb-2">
                  Withdrawals are only available on <strong>Saturday</strong> and <strong>Sunday</strong>.
                </p>
                <p className="text-white/80 text-xs">
                  Today is {currentDayName}. Please come back on the weekend to withdraw.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account Lock Warning */}
        {!checkingPurchase && !hasPurchasedProduct && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 shadow-2xl text-white border-2 border-red-400">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🔒</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Account Locked</h3>
                <p className="text-white/90 text-sm mb-3">
                  You must purchase at least one product before you can withdraw funds.
                </p>
                <button
                  onClick={() => navigate('/product')}
                  className="bg-white text-red-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Go to Products
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 shadow-2xl text-white transform hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">Available Balance</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(availableBalance, settings.currency)}</div>
          <div className="text-xs opacity-80 mt-2">
            You can withdraw from your balance wallet
          </div>
        </div>

        {/* 72 Hours Notice */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 shadow-2xl text-white border-2 border-blue-400">
          <div className="flex items-start gap-4">
            <div className="text-4xl animate-pulse">⏰</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                Processing Time
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white/90 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-white/90 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/90 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </h3>
              <p className="text-white/90 text-sm">
                Your withdraw amount will be received within <strong>72 Hours</strong> after submission.
              </p>
              <div className="mt-4 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>💳</span> Payment Method
          </h2>
          <div className="p-4 rounded-xl border-2 border-green-500 bg-green-50 shadow-lg">
            <div className="text-3xl mb-2">📱</div>
            <div className="font-semibold text-green-600">
              BIKASH
            </div>
            {currentMethod?.number && (
              <div className="text-xs text-gray-500 mt-1">{currentMethod.number}</div>
            )}
          </div>
        </div>

        {/* Payment Details Card */}
        {currentMethod?.number && currentMethod?.name ? (
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>✅</span> {paymentMethod.toUpperCase()} Details
              </h2>
              <button
                onClick={() => handleEditMethod(paymentMethod)}
                className="text-primary text-sm font-medium hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-sm">Account Name:</span>
                <span className="font-semibold text-gray-800">{currentMethod.name}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-sm">Account Number:</span>
                <span className="font-semibold text-gray-800">{currentMethod.number}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-800 mb-1">No {paymentMethod.toUpperCase()} Details</h3>
                <p className="text-sm text-yellow-700 mb-3">Please add your {paymentMethod.toUpperCase()} account details to withdraw.</p>
                <button
                  onClick={() => handleAddMethod()}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-colors"
                >
                  Add {paymentMethod.toUpperCase()} Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Payment Method Modal */}
        {showAddMethod && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingMethod ? 'Edit' : 'Add'} {paymentMethod.toUpperCase()} Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder={`Enter ${paymentMethod.toUpperCase()} number`}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveMethod}
                    className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowAddMethod(false);
                      setEditingMethod(null);
                      setFormData({ number: '', name: '' });
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>💰</span> Withdrawal Amount
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter Amount ({getCurrencySymbol(settings.currency)})</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">Available Balance: {formatCurrency(availableBalance, settings.currency)}</p>
              <button
                type="button"
                onClick={() => setAmount(availableBalance > 0 ? availableBalance.toFixed(2) : '0')}
                className="text-xs text-primary font-medium hover:underline"
              >
                Use Max
              </button>
            </div>
            
            {/* VAT Tax Calculation Display */}
            {amount && parseFloat(amount) > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Withdrawal Amount:</span>
                  <span className="text-sm font-semibold text-gray-800">{formatCurrency(parseFloat(amount) || 0, settings.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">VAT Tax (10%):</span>
                  <span className="text-sm font-semibold text-red-600">-{formatCurrency((parseFloat(amount) || 0) * 0.10, settings.currency)}</span>
                </div>
                <div className="pt-2 border-t-2 border-blue-300 flex justify-between items-center">
                  <span className="text-base font-bold text-gray-800">You will receive:</span>
                  <span className="text-base font-bold text-green-600">{formatCurrency((parseFloat(amount) || 0) * 0.90, settings.currency)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">* 10% VAT tax will be deducted from your withdrawal amount</p>
              </div>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 1000, 5000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setAmount(Math.min(amt, availableBalance).toFixed(2));
                }}
                className="py-2 text-sm rounded-lg bg-gray-100 hover:bg-primary hover:text-white transition-colors font-medium"
              >
                {formatCurrency(amt, settings.currency)}
              </button>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !currentMethod?.number || !currentMethod?.name || availableBalance <= 0 || !hasPurchasedProduct || checkingPurchase || !isWeekend}
            className="w-full py-4 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Withdraw to ${paymentMethod.toUpperCase()}`
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Withdraw;