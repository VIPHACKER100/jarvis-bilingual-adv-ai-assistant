import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './context/NotificationContext';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);