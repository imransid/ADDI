import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/currency';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { userAPI } from '../services/api';

/**
 * Enhanced Invitation page with unique referral codes and cool UI
 * Users get unique referral codes and can invite friends
 */
const Invitation = () => {
  const user = useSelector((state) => state.user);
  const authUser = useSelector((state) => state.auth.user);
  const { settings } = useSettings();
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [purchasedReferralCount, setPurchasedReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  const userId = authUser?.id || user?.id;
  const fallbackCode = userId ? userId.substring(0, 8).toUpperCase() : '';
  const codeToShare = referralCode || fallbackCode;

  // Generate or get referral code from user document
  useEffect(() => {
    loadReferralCode();
  }, [userId]);

  // Load referral purchase stats (who purchased vs not)
  useEffect(() => {
    loadReferralStats();
  }, [authUser?.id]);

  const loadReferralCode = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Get or generate referral code
        let code = userData.referralCode;
        if (!code) {
          // Generate unique referral code (8 characters, alphanumeric)
          code = generateReferralCode();
          await updateDoc(doc(db, 'users', userId), {
            referralCode: code,
            updatedAt: serverTimestamp(),
          });
        }
        
        setReferralCode(code);
        
        // Optional fallback count (stats call will overwrite with live values)
        const referralsCount = userData.totalReferrals || 0;
        setReferralCount(referralsCount);
      } else {
        // If something is off, never produce an empty referral link.
        setReferralCode(fallbackCode);
      }
    } catch (error) {
      console.error('Failed to load referral code:', error);
      // Fallback to user ID if error
      setReferralCode(fallbackCode);
    } finally {
      setLoading(false);
    }
  };

  const loadReferralStats = async () => {
    // This API reads current user from localStorage; just ensure we have an auth user.
    if (!authUser?.id) return;
    try {
      setLoadingStats(true);
      const response = await userAPI.getReferralStatistics(null);
      if (response?.success) {
        setReferralCount(response.data.totalReferrals || 0);
        setPurchasedReferralCount(response.data.purchasedCount || 0);
      }
    } catch (error) {
      console.error('Failed to load referral stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const generateReferralCode = () => {
    // Generate 8-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const referralLink = codeToShare
    ? `${window.location.origin}/register?ref=${encodeURIComponent(codeToShare)}`
    : `${window.location.origin}/register`;

  const handleCopyCode = () => {
    if (!codeToShare) return;
    navigator.clipboard.writeText(codeToShare);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Loading referral information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 pb-20">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white py-10 px-4 shadow-2xl relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-12 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-4 left-1/4 w-2.5 h-2.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="text-5xl mb-3 animate-bounce">🎁</div>
          <h1 className="text-3xl font-bold tracking-wide mb-2">Invite & Earn</h1>
          <p className="text-white/90 text-sm">Share your referral code and get rewards!</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Reward Banner */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-2xl text-white border-2 border-green-400">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-2xl font-bold mb-1">🎉 Referral Rewards</div>
              <div className="text-sm text-green-100">
                You earn {formatCurrency(settings.referralBonus || 200, settings.currency)} when a referred user makes their first product purchase.
              </div>
            </div>
            <div className="text-4xl font-extrabold text-yellow-200">
              {formatCurrency(settings.referralBonus || 200, settings.currency)}
            </div>
          </div>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-xl border border-gray-100 text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {loadingStats ? '...' : referralCount}
            </div>
            <div className="text-sm text-gray-600">Total Referrals</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-xl border border-gray-100 text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {formatCurrency((purchasedReferralCount || 0) * (settings.referralBonus || 200), settings.currency)}
            </div>
            <div className="text-sm text-gray-600">Total Rewards Earned</div>
            <div className="text-xs text-gray-400 mt-1">
              {loadingStats ? 'Calculating…' : `${purchasedReferralCount} referral purchase(s)`}
            </div>
          </div>
        </div>

        {/* Your Referral Code Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-primary/30">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🎫</span> Your Unique Referral Code
          </h2>
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border-2 border-dashed border-primary/50 relative">
            <div className="text-center">
              <div className="text-4xl font-black text-primary tracking-widest mb-3 select-all">
                {codeToShare || '—'}
              </div>
              <button
                onClick={handleCopyCode}
                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm flex items-center gap-2 mx-auto"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔗</span> Share Referral Link
          </h2>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 break-all select-all text-sm text-gray-700 font-mono">
              {referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full px-4 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Link Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Referral Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📤</span> Share Via
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                const text = `Join using my referral code: ${codeToShare}. After your first product purchase, I will receive ${formatCurrency(settings.referralBonus || 200, settings.currency)}. ${referralLink}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="p-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors flex flex-col items-center gap-2"
            >
              <span className="text-2xl">📱</span>
              <span className="text-xs">WhatsApp</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`Join using my referral code: ${codeToShare}. After your first product purchase, I will receive ${formatCurrency(settings.referralBonus || 200, settings.currency)}. ${referralLink}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors flex flex-col items-center gap-2"
            >
              <span className="text-2xl">📋</span>
              <span className="text-xs">Message</span>
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Join with my referral code!',
                    text: `Join using my referral code: ${codeToShare}. After your first product purchase, I will receive ${formatCurrency(settings.referralBonus || 200, settings.currency)}.`,
                    url: referralLink,
                  });
                } else {
                  handleCopyLink();
                }
              }}
              className="p-4 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors flex flex-col items-center gap-2"
            >
              <span className="text-2xl">🌐</span>
              <span className="text-xs">Share</span>
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>ℹ️</span> How It Works
          </h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-lg">1.</span>
              <span>Share your unique referral code with friends</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-lg">2.</span>
              <span>They sign up using your referral code</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-lg">3.</span>
              <span>When they make their first product purchase, you receive {formatCurrency(settings.referralBonus || 200, settings.currency)}.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-lg">4.</span>
              <span>The bonus is added to your wallet automatically after their first purchase.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Invitation;