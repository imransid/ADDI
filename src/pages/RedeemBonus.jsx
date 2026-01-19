import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/currency';

/**
 * Redeem Bonus page. Explains how to redeem bonuses and lists available bonuses.
 */
const RedeemBonus = () => {
  const { settings } = useSettings();
  const bonuses = [
    { id: 1, description: 'Welcome bonus', amount: 50, status: 'available' },
    { id: 2, description: 'Referral bonus', amount: 30, status: 'redeemed' },
  ];
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Redeem Bonus</h1>
      <p className="text-sm text-gray-700">Here you can view and redeem your available bonuses.</p>
      <div className="space-y-2">
        {bonuses.map((bonus) => (
          <div
            key={bonus.id}
            className="bg-white p-3 rounded-md shadow-sm flex justify-between items-center text-sm"
          >
            <div>
              <div className="font-medium">{bonus.description}</div>
              <div className="text-xs text-gray-500">Amount: {formatCurrency(bonus.amount, settings.currency)}</div>
            </div>
            {bonus.status === 'available' ? (
              <button
                onClick={() => alert('Bonus redeemed!')}
                className="bg-primary text-white py-1 px-3 rounded-md text-xs hover:bg-primary/90"
              >
                Redeem
              </button>
            ) : (
              <span className="text-xs text-gray-400">Redeemed</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RedeemBonus;