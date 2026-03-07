import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/index.css';

const rootElement = document.getElementById('root')!;
rootElement.style.width = '100%';
rootElement.style.height = '100vh';

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);