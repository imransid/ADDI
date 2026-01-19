import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import store from './store';
import { SettingsProvider } from './contexts/SettingsContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);