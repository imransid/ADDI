import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({ 
    bKashNumber: '', 
    totalSystemCurrency: 0, 
    currency: 'USD',
    referralBonus: 200,
    supportNumber: ''
  });
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      if (response.success) {
        setSettings({
          bKashNumber: response.data.bKashNumber || '',
          totalSystemCurrency: response.data.totalSystemCurrency || 0,
          currency: response.data.currency || 'USD',
          referralBonus: response.data.referralBonus || 200,
          supportNumber: response.data.supportNumber || '',
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use defaults on error
      setSettings({ 
        bKashNumber: '', 
        totalSystemCurrency: 0, 
        currency: 'USD',
        referralBonus: 200,
        supportNumber: ''
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loadSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
