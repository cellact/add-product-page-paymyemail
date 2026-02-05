import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Common.css';

const HomePage = ({ walletAddress, showSolanaVerification }) => {
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="card">
        <div className="button-group">
          <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Email identity creation portal</h1>
          
          <button 
            className="button primary-button"
            onClick={() => navigate('/verify-email')}
            style={{ fontSize: '18px', padding: '15px 40px' }}
          >
            Get started
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
