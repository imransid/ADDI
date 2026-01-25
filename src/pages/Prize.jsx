import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/currency';
import { collection, doc, getDoc, getDocs, query, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Prize page - Golden Egg Smash with 10-hour cooldown timer
 * Enhanced UI with animations and countdown
 */
const Prize = () => {
  const { settings } = useSettings();
  const { user } = useSelector((state) => state.auth);
  const [lastSmashTime, setLastSmashTime] = useState(null);
  const [canSmash, setCanSmash] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [smashing, setSmashing] = useState(false);
  const [selectedEgg, setSelectedEgg] = useState(null);
  const [prizeWon, setPrizeWon] = useState(null);
  const [showPrize, setShowPrize] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successfulReferralsToday, setSuccessfulReferralsToday] = useState(0);
  const [hasThreeSuccessfulToday, setHasThreeSuccessfulToday] = useState(false);

  const prizes = [
    { amount: 5, type: 'bonus', probability: 30 },
    { amount: 10, type: 'bonus', probability: 25 },
    { amount: 15, type: 'bonus', probability: 20 },
    { amount: 20, type: 'bonus', probability: 15 },
    { amount: 25, type: 'bonus', probability: 5 },
    { amount: 0, type: 'try again', probability: 5 },
  ];

  // Daily cooldown - users with 3+ referrals can smash once per day

  useEffect(() => {
    loadLastSmashTime();
  }, [user]);

  useEffect(() => {
    if (hasThreeSuccessfulToday !== undefined) {
      checkCanSmash();
      const timer = setInterval(() => {
        checkCanSmash();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lastSmashTime, hasThreeSuccessfulToday]);

  const startOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const computeSuccessfulReferralsToday = async (referrerId) => {
    const start = startOfToday();
    const startMs = start.getTime();

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('referredBy', '==', referrerId),
      where('createdAt', '>=', start)
    );

    const snap = await getDocs(q);

    let count = 0;
    snap.forEach((d) => {
      const data = d.data();
      const fp = data.firstPurchaseAt;
      const fpMs = fp?.toMillis ? fp.toMillis() : (fp ? new Date(fp).getTime() : null);
      // "Successful" = new account today + first product purchase today
      if (fpMs && fpMs >= startMs) count++;
    });

    return count;
  };

  const refreshTodayStatus = async () => {
    if (!user?.id) return;
    try {
      const count = await computeSuccessfulReferralsToday(user.id);
      setSuccessfulReferralsToday(count);
      setHasThreeSuccessfulToday(count >= 3);
    } catch (e) {
      console.error('Failed to compute today successful referrals:', e);
      setSuccessfulReferralsToday(0);
      setHasThreeSuccessfulToday(false);
    }
  };

  const loadLastSmashTime = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastSmash = userData.lastEggSmash;
        setLastSmashTime(lastSmash ? lastSmash.toMillis() : null);
      }

      await refreshTodayStatus();
    } catch (error) {
      console.error('Failed to load last smash time:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanSmash = () => {
    // Only users with 3 successful (active) referrals TODAY can smash eggs
    // "Active" means referred user purchased a product.
    if (!hasThreeSuccessfulToday) {
      setCanSmash(false);
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    if (!lastSmashTime) {
      setCanSmash(true);
      return;
    }

    const now = Date.now();
    const lastSmashDate = new Date(lastSmashTime);
    const today = new Date();
    
    // Reset time to start of day for comparison
    const lastSmashDay = new Date(lastSmashDate.getFullYear(), lastSmashDate.getMonth(), lastSmashDate.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Check if they've smashed today (daily cooldown)
    if (lastSmashDay.getTime() < todayDay.getTime()) {
      // Last smash was before today, can smash
      setCanSmash(true);
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
    } else {
      // Already smashed today, calculate time until next day (midnight)
      const tomorrow = new Date(todayDay);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const timeUntilMidnight = tomorrow.getTime() - now;
      
      if (timeUntilMidnight <= 0) {
        setCanSmash(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        setCanSmash(false);
        const hours = Math.floor(timeUntilMidnight / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntilMidnight % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    }
  };

  const getRandomPrize = () => {
    const random = Math.random() * 100;
    let cumulative = 0;
    for (const prize of prizes) {
      cumulative += prize.probability;
      if (random <= cumulative) {
        return prize;
      }
    }
    return prizes[0];
  };

  const handleSmash = async (eggIndex) => {
    if (!canSmash || smashing || !user) return;

    setSmashing(true);
    setSelectedEgg(eggIndex);
    setShowPrize(false);
    setPrizeWon(null);

    // Animate smash
    setTimeout(async () => {
      const prize = getRandomPrize();
      setPrizeWon(prize);
      setShowPrize(true);

      // Update last smash time in Firestore
      try {
        const now = new Date();
        await updateDoc(doc(db, 'users', user.id), {
          lastEggSmash: serverTimestamp(),
        });
        setLastSmashTime(now.getTime());
        setCanSmash(false);
      } catch (error) {
        console.error('Failed to update last smash time:', error);
      }

      setTimeout(() => {
        setSmashing(false);
        setSelectedEgg(null);
      }, 3000);
    }, 1500);
  };

  const formatTime = (time) => String(time).padStart(2, '0');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-amber-700 font-medium">Loading Golden Eggs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 pb-20">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white py-8 px-4 shadow-2xl relative overflow-hidden">
        {/* Animated background stars */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-4xl animate-bounce">🥚</span>
            <h1 className="text-3xl font-bold tracking-wide">Golden Egg Smash</h1>
            <span className="text-4xl animate-bounce" style={{ animationDelay: '0.3s' }}>🥚</span>
          </div>
          <p className="text-yellow-100 text-sm mt-2">Break the golden eggs and win amazing prizes!</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Referral Status Banner */}
        {hasThreeSuccessfulToday ? (
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 shadow-xl text-white border-2 border-green-400">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⭐</div>
              <div className="flex-1">
                <div className="font-bold text-lg mb-1">Prize Unlocked (Today)!</div>
                <div className="text-sm text-green-100">
                  Successful referrals today: <strong>{successfulReferralsToday}/3</strong> (must purchase product).
                  <div className="mt-1">You can smash eggs <strong>once today</strong>. Tomorrow it resets.</div>
                </div>
              </div>
              <button
                onClick={refreshTodayStatus}
                className="text-xs font-bold bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl px-3 py-2 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 shadow-xl text-white border-2 border-orange-400">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🔒</div>
              <div className="flex-1">
                <div className="font-bold text-lg mb-1">Egg Smashing Locked</div>
                <div className="text-sm text-orange-100">
                  Successful referrals today: <strong>{successfulReferralsToday}/3</strong>.
                  You need <strong>{Math.max(0, 3 - successfulReferralsToday)} more</strong> new users to register and purchase a product today.
                  <div className="mt-1">Tomorrow everything resets.</div>
                </div>
              </div>
              <button
                onClick={refreshTodayStatus}
                className="text-xs font-bold bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl px-3 py-2 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Cooldown Timer Card */}
        {!canSmash && hasThreeSuccessfulToday && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl text-white border-2 border-yellow-400/30">
            <div className="text-center">
              <div className="text-yellow-400 text-sm mb-2 font-semibold">
                ⏰ Next Smash Available In
              </div>
              <div className="flex items-center justify-center gap-3 text-3xl font-bold text-yellow-400">
                <div className="bg-gray-700 rounded-lg px-4 py-2 min-w-[80px]">
                  {formatTime(timeLeft.hours)}
                  <div className="text-xs text-gray-400 mt-1">Hours</div>
                </div>
                <div className="text-yellow-500">:</div>
                <div className="bg-gray-700 rounded-lg px-4 py-2 min-w-[80px]">
                  {formatTime(timeLeft.minutes)}
                  <div className="text-xs text-gray-400 mt-1">Minutes</div>
                </div>
                <div className="text-yellow-500">:</div>
                <div className="bg-gray-700 rounded-lg px-4 py-2 min-w-[80px]">
                  {formatTime(timeLeft.seconds)}
                  <div className="text-xs text-gray-400 mt-1">Seconds</div>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-4">
                Come back tomorrow for another daily chance!
              </p>
            </div>
          </div>
        )}

        {/* Ready to Smash Card */}
        {canSmash && hasThreeSuccessfulToday && (
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-2xl text-white border-2 border-yellow-400 animate-pulse">
            <div className="text-center">
              <div className="text-3xl mb-2">✨</div>
              <div className="text-xl font-bold mb-1">Ready to Smash!</div>
              <div className="text-sm text-green-100">Tap an egg below to reveal your prize (Daily limit: 1 per day)</div>
            </div>
          </div>
        )}

        {/* Golden Eggs */}
        <div className="flex justify-center items-center gap-4 md:gap-8 flex-wrap">
          {Array.from({ length: 3 }).map((_, idx) => {
            const isSelected = selectedEgg === idx;
            const isSmashing = smashing && isSelected;
            const canClick = canSmash && !smashing;

            return (
              <button
                key={idx}
                onClick={() => handleSmash(idx)}
                disabled={!canClick || !hasThreeSuccessfulToday}
                className={`relative focus:outline-none transition-all duration-300 transform ${
                  canClick && hasThreeSuccessfulToday
                    ? 'hover:scale-110 hover:-translate-y-2 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                } ${isSmashing ? 'scale-125 rotate-12' : ''}`}
                aria-label="Smash egg"
              >
                {/* Egg Container with Glow */}
                <div
                  className={`relative ${
                    canClick ? 'animate-bounce filter drop-shadow-2xl' : ''
                  }`}
                  style={{ animationDelay: `${idx * 0.2}s` }}
                >
                  {/* Glowing effect */}
                  {canClick && (
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse" />
                  )}

                  {/* Egg SVG */}
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-28 w-28 md:h-36 md:w-36 transition-all duration-300 ${
                        isSmashing ? 'animate-spin text-orange-600' : 'text-yellow-400'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C7.031 2 3 7.03 3 12s4.031 10 9 10 9-5.03 9-10S16.969 2 12 2zm0 18c-4.411 0-8-4.037-8-8s3.589-8 8-8 8 4.037 8 8-3.589 8-8 8z" />
                    </svg>

                    {/* Sparkles */}
                    {canClick && (
                      <div className="absolute inset-0">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping"
                            style={{
                              left: `${30 + (i % 3) * 20}%`,
                              top: `${20 + Math.floor(i / 3) * 30}%`,
                              animationDelay: `${i * 0.3}s`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Smash animation overlay */}
                  {isSmashing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl animate-spin">💥</div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Prize Result Modal */}
        {showPrize && prizeWon && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-white transform animate-bounce">
              <div className="text-center text-white">
                {prizeWon.amount === 0 ? (
                  <>
                    <div className="text-6xl mb-4 animate-bounce">😔</div>
                    <h2 className="text-3xl font-bold mb-2">Try Again!</h2>
                    <p className="text-lg">Better luck next time!</p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4 animate-bounce">🎉</div>
                    <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
                    <div className="text-4xl font-extrabold mb-2 text-yellow-100">
                      {formatCurrency(prizeWon.amount, settings.currency)}
                    </div>
                    <p className="text-xl font-semibold">{prizeWon.type.toUpperCase()}</p>
                    <p className="text-sm text-yellow-100 mt-2">Prize has been added to your wallet!</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-3 text-center flex items-center justify-center gap-2">
            <span>📋</span> How It Works
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 font-bold">•</span>
              <span>Tap any golden egg to reveal your prize</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 font-bold">•</span>
              <span>Win amazing bonuses ranging from {formatCurrency(5, settings.currency)} to {formatCurrency(25, settings.currency)}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 font-bold">•</span>
              <span>
                {hasThreeSuccessfulToday
                  ? 'You can smash once today (resets tomorrow)'
                  : 'You need 3 new referred users to purchase a product today to unlock prize'}
              </span>
            </li>
            {!hasThreeSuccessfulToday && (
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 font-bold">•</span>
                <span>Share your referral code. New users must register and purchase a product today.</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 font-bold">•</span>
              <span>Prizes are automatically added to your balance wallet</span>
            </li>
          </ul>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
      `}</style>
    </div>
  );
};

export default Prize;