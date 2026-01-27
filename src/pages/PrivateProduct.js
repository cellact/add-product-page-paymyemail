import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRandomNames, generateUUID } from '../components/GenerateUUID';
import { API_ENDPOINTS, ACTIONS, DOMAIN_SUFFIXES, PACKAGE_TYPES, REQUEST_CONFIG, UI_CONFIG } from '../utils/DefaultParameters';
import '../styles/Common.css';

const PrivateProduct = ({ walletAddress }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [randomNames, setRandomNames] = useState([]);
  const [selectedName, setSelectedName] = useState('');

  // Generate random names when component mounts
  useEffect(() => {
    setRandomNames(generateRandomNames(UI_CONFIG.NAME_GENERATION_COUNT));
  }, []);

  // Function to send data to native app
  const sendDataToNative = (jsonData) => {
    console.log('Attempting to send data to native:', jsonData);
    
    if (window.ReactNativeWebView) {
      console.log('Using ReactNativeWebView bridge');
      window.ReactNativeWebView.postMessage(JSON.stringify(jsonData));
    }
    else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeHandler) {
      console.log('Using WKWebView message handler');
      window.webkit.messageHandlers.nativeHandler.postMessage(JSON.stringify(jsonData));
    }
    else if (window.AndroidBridge && window.AndroidBridge.processAction) {
      console.log('Using Android bridge');
      window.AndroidBridge.processAction(JSON.stringify(jsonData));
    }
    else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.buttonPressed) {
      console.log('Using buttonPressed message handler');
      window.webkit.messageHandlers.buttonPressed.postMessage(JSON.stringify(jsonData));
    }
    else {
      console.error('No native interface available');
      setError('Unable to communicate with the app. Please try again.');
    }
  };

  const handleNameSelection = (name) => {
    setSelectedName(name);
  };

  const submitSelectedName = async () => {
    if (!selectedName) {
      setError('Please select a name first');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const uuid_to_sign = generateUUID();
      
      // Send pending product to native with the selected name
      const nativeData = {
        action: ACTIONS.NEW_ITEM,
        body: { 
          item: selectedName + DOMAIN_SUFFIXES.TEMP,
          customer_id: uuid_to_sign
        }
      };

      //Fire and forget - launch the request without waiting for it
      try {
        const response = await fetch(API_ENDPOINTS.ORDER_DISPATCHER, {
          method: 'POST',
          headers: REQUEST_CONFIG.HEADERS,
          body: JSON.stringify({
            user_address: walletAddress,
            uuid_to_sign: uuid_to_sign,
            customer_id: uuid_to_sign,
            package_type: PACKAGE_TYPES.TEMP_ENS,
            selected_name: selectedName
          }),
        });
        
        console.log('Fetch request completed with status:', response.status);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Request timed out after 30 seconds');
        } else {
          console.error('Error in fetch request:', error);
        }
        // Error is handled here and won't affect the main flow
      }
      
      // Continue with the flow immediately without waiting
      sendDataToNative(nativeData);
      setIsProcessing(true);
      setIsSuccess(true);
      
    } catch (error) {
      console.error('Error getting private product:', error);
      setError(error.message || 'An error occurred while getting the private product');
      setIsLoading(false);
    }
  };

  const renderNameSelectionButtons = () => {
    return (
      <div className="name-options" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginTop: '15px',
        width: '100%'
      }}>
        {randomNames.map((name, index) => (
          <button
            key={index}
            className={`button ${selectedName === name ? 'primary-button' : 'secondary-button'}`}
            onClick={() => handleNameSelection(name)}
            style={{
              fontSize: '0.95rem',
              padding: '12px 15px',
              position: 'relative',
              border: selectedName === name ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              margin: '0 auto',
              transition: 'all 0.3s ease'
            }}
          >
            {name}
            {selectedName === name && (
              <span style={{
                position: 'absolute',
                right: '15px',
                color: 'var(--primary-color)'
              }}>✓</span>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="container" style={{ 
      maxWidth: '100%', 
      padding: '5px',
      overflowX: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh'
    }}>
      <div className="card" style={{ 
        overflowY: 'auto',
        maxHeight: '90vh',
        width: '100%',
        maxWidth: UI_CONFIG.MAX_CARD_WIDTH,
        margin: '0 auto',
        padding: UI_CONFIG.CARD_PADDING,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '25px'
      }}>
        <div className="header" style={{
          textAlign: 'center',
          marginBottom: '10px'
        }}>
          <h1 style={{ 
            fontSize: 'calc(1.2rem + 1vw)', 
            wordBreak: 'break-word',
            margin: '0',
            color: 'var(--primary-color)',
            fontWeight: '600',
            textAlign: 'center'
          }}>{isSuccess ? 'Success!' : 'Get Private Product'}</h1>
        </div>
        
        {!isProcessing ? (
          <>
            <div className="disclaimer" style={{ 
              textAlign: 'center',
              fontSize: '1rem',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '20px',
              borderRadius: '10px',
              lineHeight: '1.5',
              width: '100%',
              boxSizing: 'border-box',
              margin: '0 auto'
            }}>
              <p style={{ margin: '0 0 15px 0' }}>Choose your preferred private username from the options below:</p>
              {renderNameSelectionButtons()}
            </div>
            
            {error && <p className="error-message" style={{ 
              textAlign: 'center', 
              wordBreak: 'break-word', 
              fontSize: '0.95rem', 
              color: '#ff4d4f',
              margin: '0'
            }}>{error}</p>}
            
            <div className="button-group" style={{ 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '10px',
              gap: '15px',
              width: '100%'
            }}>
              <button 
                className="button primary-button"
                onClick={submitSelectedName}
                disabled={isLoading || !selectedName}
                style={{ 
                  fontSize: '0.95rem', 
                  padding: '12px 24px',
                  width: '100%',
                  maxWidth: '300px'
                }}
              >
                {isLoading ? 'Processing...' : 'Confirm Selection'}
              </button>
              
              <button 
                className="button secondary-button"
                onClick={() => navigate('/')}
                disabled={isLoading}
                style={{ 
                  fontSize: '0.95rem', 
                  padding: '12px 24px',
                  width: '100%',
                  maxWidth: '300px'
                }}
              >
                Back
              </button>
            </div>
          </>
        ) : (
          <div className="processing-message" style={{ 
            textAlign: 'center',
            padding: '20px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div className="success-icon" style={{
              transform: 'scale(1.2)',
              margin: '10px 0'
            }}>
              <div className="success-circle" style={{
                backgroundColor: 'rgba(0, 200, 83, 0.1)',
                border: '2px solid rgb(0, 200, 83)'
              }}></div>
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" stroke="rgb(0, 200, 83)" strokeWidth="2"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" stroke="rgb(0, 200, 83)" strokeWidth="3"/>
              </svg>
            </div>
            <h2 style={{ 
              fontSize: 'calc(1.1rem + 0.3vw)',
              margin: '0',
              color: 'var(--primary-color)'
            }}>Username Selected!</h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <p style={{ fontSize: '1.1rem', margin: '0', fontWeight: '600', color: 'rgb(0, 200, 83)' }}>{selectedName}</p>
              <p style={{ fontSize: '0.95rem', margin: '15px 0 0 0' }}>Your username has been successfully registered.</p>
              <p style={{ fontSize: '0.95rem', margin: '0' }}>You'll receive a notification when your account is ready.</p>
            </div>
            <div className="button-group" style={{ 
              display: 'flex',
              justifyContent: 'center',
              marginTop: '10px',
              width: '100%'
            }}>
              <button 
                className="button primary-button"
                onClick={() => navigate('/')}
                style={{ 
                  fontSize: '0.95rem', 
                  padding: '12px 24px',
                  minWidth: '200px',
                  backgroundColor: 'rgb(0, 200, 83)',
                  borderColor: 'rgb(0, 200, 83)'
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivateProduct; 