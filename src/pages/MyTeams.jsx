import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

/**
 * Enhanced My Teams page with premium UI
 * Shows team cumulative recharge, commission details, and comprehensive statistics.
 */
const MyTeams = () => {
  const team = useSelector((state) => state.team);
  const navigate = useNavigate();
  const { settings } = useSettings();

  // Calculate growth percentages
  const memberGrowth = team.statistics?.yesterdayNewMembers 
    ? ((team.statistics.todayNewMembers - team.statistics.yesterdayNewMembers) / team.statistics.yesterdayNewMembers * 100).toFixed(1)
    : 0;
  
  const rechargeGrowth = team.statistics?.yesterdayRechargeAmount 
    ? ((team.statistics.todayRechargeAmount - team.statistics.yesterdayRechargeAmount) / team.statistics.yesterdayRechargeAmount * 100).toFixed(1)
    : 0;

  const monthGrowth = team.statistics?.lastMonthRechargeAmount
    ? ((team.statistics.currentMonthRechargeAmount - team.statistics.lastMonthRechargeAmount) / team.statistics.lastMonthRechargeAmount * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 text-white pb-20">
      {/* Premium Header with Animated Background */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-10 px-4 shadow-2xl relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors mr-3 backdrop-blur-sm"
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
            <h1 className="text-4xl font-extrabold tracking-wide mb-2 flex items-center gap-3">
              <span className="text-5xl">👥</span>
              My Teams
            </h1>
            <p className="text-white/90 text-sm">Track your team performance and earnings</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* Team Cumulative Recharge Card - Premium Design */}
        <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-3xl p-8 shadow-2xl text-white transform hover:scale-[1.02] transition-all duration-300 overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <span className="text-2xl">💎</span>
                  </div>
                  <div>
                    <div className="text-sm opacity-90 font-medium">Team Cumulative Recharge</div>
                    <div className="text-xs opacity-70">Total from all team members</div>
                  </div>
                </div>
                <div className="text-5xl font-black mb-2 tracking-tight">
                  {formatCurrency(team.cumulativeRecharge || 0, settings.currency)}
                </div>
              </div>
              <div className="text-7xl opacity-20">📊</div>
            </div>
            
            {/* Growth indicator */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/20">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-semibold">
                {monthGrowth > 0 ? '📈' : monthGrowth < 0 ? '📉' : '➡️'} {monthGrowth > 0 ? '+' : ''}{monthGrowth}% vs last month
              </div>
            </div>
          </div>
        </div>

        {/* Daily Commission Details Button - Enhanced */}
        <button
          onClick={() => alert("Daily commission details feature coming soon")}
          className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 text-white py-5 rounded-2xl font-bold shadow-2xl transform hover:scale-[1.02] hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center gap-3 text-lg"
        >
          <span className="text-2xl">💵</span>
          <span>Daily Commission Details</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Team Statistics Section - Premium Cards */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-2">
                <span className="text-2xl">📈</span>
              </div>
              <span>Team Statistics</span>
            </h2>
            <div className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">
              Real-time data
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Today's new members */}
            <div className="group relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-5 shadow-xl transform hover:scale-105 hover:shadow-blue-500/50 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl">👤</div>
                  {memberGrowth !== 0 && (
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${memberGrowth > 0 ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'}`}>
                      {memberGrowth > 0 ? '↑' : '↓'} {Math.abs(memberGrowth)}%
                    </div>
                  )}
                </div>
                <div className="text-4xl font-black text-white mb-2">
                  {team.statistics?.todayNewMembers || 0}
                </div>
                <div className="text-blue-200 text-xs font-semibold">
                  Today's New Members
                </div>
              </div>
            </div>

            {/* Yesterday's new members */}
            <div className="group relative bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 rounded-2xl p-5 shadow-xl transform hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl">👥</div>
                </div>
                <div className="text-4xl font-black text-white mb-2">
                  {team.statistics?.yesterdayNewMembers || 0}
                </div>
                <div className="text-indigo-200 text-xs font-semibold">
                  Yesterday's New Members
                </div>
              </div>
            </div>

            {/* Today recharge amount */}
            <div className="group relative bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded-2xl p-5 shadow-xl transform hover:scale-105 hover:shadow-green-500/50 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl">💰</div>
                  {rechargeGrowth !== 0 && (
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${rechargeGrowth > 0 ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'}`}>
                      {rechargeGrowth > 0 ? '↑' : '↓'} {Math.abs(rechargeGrowth)}%
                    </div>
                  )}
                </div>
                <div className="text-2xl font-black text-white mb-2 leading-tight">
                  {formatCurrency(team.statistics?.todayRechargeAmount || 0, settings.currency)}
                </div>
                <div className="text-green-200 text-xs font-semibold">
                  Today Recharge Amount
                </div>
              </div>
            </div>

            {/* Yesterday recharge amount */}
            <div className="group relative bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 rounded-2xl p-5 shadow-xl transform hover:scale-105 hover:shadow-cyan-500/50 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl">💳</div>
                </div>
                <div className="text-2xl font-black text-white mb-2 leading-tight">
                  {formatCurrency(team.statistics?.yesterdayRechargeAmount || 0, settings.currency)}
                </div>
                <div className="text-teal-200 text-xs font-semibold">
                  Yesterday Recharge Amount
                </div>
              </div>
            </div>

            {/* Current month recharge amount */}
            <div className="group relative bg-gradient-to-br from-orange-500 via-red-600 to-pink-700 rounded-2xl p-5 shadow-xl transform hover:scale-105 hover:shadow-orange-500/50 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl">📅</div>
                  {monthGrowth !== 0 && (
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${monthGrowth > 0 ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'}`}>
                      {monthGrowth > 0 ? '↑' : '↓'} {Math.abs(monthGrowth)}%
                    </div>
                  )}
                </div>
                <div className="text-2xl font-black text-white mb-2 leading-tight">
                  {formatCurrency(team.statistics?.currentMonthRechargeAmount || 0, settings.currency)}
                </div>
                <div className="text-orange-200 text-xs font-semibold">
                  Current Month Recharge
                </div>
              </div>
            </div>

            {/* Last month recharge amount */}
            <div className="group relative bg-gradient-to-br from-purple-500 via-pink-600 to-rose-700 rounded-2xl p-5 shadow-xl transform hover:scale-105 hover:shadow-pink-500/50 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl">📊</div>
                </div>
                <div className="text-2xl font-black text-white mb-2 leading-tight">
                  {formatCurrency(team.statistics?.lastMonthRechargeAmount || 0, settings.currency)}
                </div>
                <div className="text-purple-200 text-xs font-semibold">
                  Last Month Recharge
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary Card */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Quick Insights
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-white/60 mb-1">Member Growth</div>
              <div className={`text-lg font-bold ${memberGrowth > 0 ? 'text-green-400' : memberGrowth < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {memberGrowth > 0 ? '+' : ''}{memberGrowth}%
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-white/60 mb-1">Recharge Growth</div>
              <div className={`text-lg font-bold ${rechargeGrowth > 0 ? 'text-green-400' : rechargeGrowth < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {rechargeGrowth > 0 ? '+' : ''}{rechargeGrowth}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTeams;
