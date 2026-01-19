/**
 * Currency utility functions for formatting currency across the application
 */

export const getCurrencySymbol = (currency) => {
  const currencyMap = {
    'USD': '$',
    'BDT': '৳',
    'MYR': 'RM',
  };
  return currencyMap[currency] || '$';
};

export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
};

export const formatCurrencyWithoutSymbol = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }
  return parseFloat(amount).toFixed(2);
};
