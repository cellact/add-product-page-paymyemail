import React from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../utils/DefaultParameters';
import '../styles/Common.css';

const BuyProduct = ({ walletAddress }) => {
  const navigate = useNavigate();

  const handleBuyNow = () => {
    const url = new URL(API_ENDPOINTS.SP_STORE);
    if (walletAddress) {
      url.searchParams.append('walletAddress', walletAddress);
    }
    window.location.href = url.toString();
  };

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ textAlign: 'center' }}>Buy Product</h1>
        <div className="product-section" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ marginBottom: '1.5rem' }}>Ready to make your purchase? Click the button below to visit our store.</p>
          <button 
            className="button primary-button"
            onClick={handleBuyNow}
            style={{ 
              fontSize: '1.1rem', 
              padding: '1rem 2rem',
              marginBottom: '1rem'
            }}
          >
            Buy Now
          </button>
        </div>
        
        <div className="action-buttons" style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            className="button secondary-button"
            onClick={() => navigate('/')}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyProduct;
