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
            Verify Email
          </button>
          
          <button 
            className="button primary-button"
            onClick={() => navigate('/verify-ens')}
          >
            Verify ENS
          </button>
          
          <button 
            className="button primary-button"
            onClick={() => navigate('/verify-bluesky')}
          >
            Verify BlueSky
          </button>
          
          {showSolanaVerification && (
            <button 
              className="button primary-button"
              onClick={() => navigate('/verify-solana')}
            >
              Verify Solana Seeker ID
            </button>
          )}
          
          <button 
            className="button primary-button"
            onClick={() => navigate('/temp-product')}
          >
            Get Temp Product
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
