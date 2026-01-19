import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

/**
 * Cashback page. Demonstrates a simple cashback reward screen. It lists
 * fictitious transactions and shows total cashback earned.
 */
const Cashback = () => {
  const { settings } = useSettings();
  const cashbackTransactions = [
    { id: 1, date: '2026-01-01', description: 'Purchase ABC', amount: 100, cashback: 10 },
    { id: 2, date: '2026-01-05', description: 'Purchase XYZ', amount: 50, cashback: 5 },
  ];
  const totalCashback = cashbackTransactions.reduce((sum, t) => sum + t.cashback, 0);
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Cashback</h1>
      <p className="text-sm text-gray-700">Earn cashback on every purchase. Your cashback will be added to your balance wallet automatically.</p>
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="font-medium mb-2">Cashback Transactions</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-1">Date</th>
              <th className="py-1">Description</th>
              <th className="py-1">Amount ({getCurrencySymbol(settings.currency)})</th>
              <th className="py-1">Cashback ({getCurrencySymbol(settings.currency)})</th>
            </tr>
          </thead>
          <tbody>
            {cashbackTransactions.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="py-1">{t.date}</td>
                <td className="py-1">{t.description}</td>
                <td className="py-1">{formatCurrency(t.amount, settings.currency)}</td>
                <td className="py-1">{formatCurrency(t.cashback, settings.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 text-right font-medium">
          Total cashback: {formatCurrency(totalCashback, settings.currency)}
        </div>
      </div>
    </div>
  );
};

export default Cashback;