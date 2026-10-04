import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Primero los estilos globales, así los de cada componente pueden pisarlos.
import './styles/tokens.css';
import './styles/base.css';
import { App } from './App';
import { CartProvider } from './lib/cart';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
);
