import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Common.css';

const HomePage = ({ walletAddress, showSolanaVerification }) => {
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="card">
        <div className="button-group">
          <h1>Arnacon Product Portal</h1>
          <button 
            className="button primary-button hidden-button"
            onClick={() => navigate('/buy-product')}
          >
            Buy Product
          </button>
          
          <button 
            className="button primary-button"
            onClick={() => navigate('/verify-email')}
          >
            Email
          </button>
          
          <button 
            className="button primary-button"
            onClick={() => navigate('/verify-ens')}
          >
            ENS
          </button>
          
          <button 
            className="button primary-button"
            onClick={() => navigate('/verify-bluesky')}
          >
            BlueSky
          </button>
          
          <button 
            className="button primary-button"
            onClick={() => navigate('/private-product')}
          >
            Private Identity
          </button>

          {showSolanaVerification && (
            <button 
              className="button primary-button"
              onClick={() => navigate('/verify-solana')}
            >
              Solana Seeker ID
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
