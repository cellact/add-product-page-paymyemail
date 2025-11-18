import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACTIONS, BLUESKY_CONFIG } from '../utils/DefaultParameters';
import '../styles/Common.css';

const VerifyBlueSky = ({ walletAddress }) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const navigate = useNavigate();
  const [nativeSignature, setNativeSignature] = useState('');
  const [isSignatureLoading, setIsSignatureLoading] = useState(true);
  const [nonce, setNonce] = useState('');
  const [isMockMode, setIsMockMode] = useState(false);

  // Mock signature generation for testing
  const generateMockSignature = useCallback((dataToSign) => {
    console.log('Generating mock signature for:', dataToSign);
    
    // Simulate a realistic signature (this is just for testing)
    const mockSignature = '0x' + Array.from({length: 130}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    console.log('Mock signature generated:', mockSignature);
    return mockSignature;
  }, []);

  // Function to send data to native mobile app if available
  const sendDataToNative = (jsonData) => {
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeHandler) {
      window.webkit.messageHandlers.nativeHandler.postMessage(JSON.stringify(jsonData));
    } else if (window.AndroidBridge && window.AndroidBridge.processAction) {
      window.AndroidBridge.processAction(JSON.stringify(jsonData));
    } else {
      console.log("Native interface not available");
    }
  };

  // Handle native response - moved outside useEffect for proper access
  const handleNativeResponse = useCallback(async (event) => {
    try {
      console.log('Native response received:', event);
      
      // Parse the response if it's a string (for non-iOS devices)
      let response = event.detail;
      if (typeof event.detail === 'string') {
        try {
          console.log('Parsing string response as JSON');
          setNativeSignature(event.detail);
          setIsSignatureLoading(false);
          response = JSON.parse(event.detail);
          console.log('Parsed JSON response:', response);
        } catch (e) {
          console.log('Response is not JSON, using as is:', e.message);
          setIsSignatureLoading(false);
        }
      }
      
      // Handle iOS response for signed-data
      if (response?.action === ACTIONS.SIGNED_DATA && response?.body) {
        console.log('Processing iOS signed data response:', response);

        const { data } = response.body;
        const arnaconSign = data;
        console.log('Received iOS signature:', arnaconSign);
        
        if (arnaconSign) {
          setNativeSignature(arnaconSign);
          setIsSignatureLoading(false);
          console.log('iOS signature applied successfully');
        }
      } else if (response?.action === ACTIONS.DATA_RETRIEVED && response?.body) {
        console.log('Processing data-retrieved response:', response);
        
        const { xsign } = response.body;
        const arnaconSign = xsign;
        console.log('Received signature from data-retrieved:', arnaconSign);
        
        if (arnaconSign) {
          setNativeSignature(arnaconSign);
          setIsSignatureLoading(false);
          console.log('Data-retrieved signature applied successfully');
        } else {
          console.log('No signature found in data-retrieved response:', response);
        }
      } else {
        console.log('Unknown response format:', response);
      }

    } catch (error) {
      console.error('Error handling native response:', error);
      setIsSignatureLoading(false);
    }
  }, []);

  const requestNativeSignature = useCallback((dataToSign) => {
    const request = {
      action: ACTIONS.SIGN_DATA_TEMP,
      body: { dataToSign }
    };

    console.log('Requesting native signature for:', dataToSign);
    
    // Check if native interface is available
    const hasNativeInterface = (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeHandler) || 
                              (window.AndroidBridge && window.AndroidBridge.processAction);
    
    console.log('Native interface check:', { 
      hasNativeInterface,
      hasWebkit: !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeHandler),
      hasAndroidBridge: !!(window.AndroidBridge && window.AndroidBridge.processAction)
    });
    
    if (!hasNativeInterface) {
      console.log('Native interface not available - using mock mode');
      setIsMockMode(true);
      
      // Use mock signature for testing
      setTimeout(() => {
        const mockSignature = generateMockSignature(dataToSign);
        setNativeSignature(mockSignature);
        setIsSignatureLoading(false);
        console.log('Mock signature applied:', mockSignature);
      }, 1000); // Simulate delay
      return;
    }
    
    sendDataToNative(request);
  }, [generateMockSignature]);

  // Set up event listener immediately when component mounts
  useEffect(() => {
    console.log('Setting up event listener for onDataReceived');
    document.addEventListener('onDataReceived', handleNativeResponse);
    
    return () => {
      console.log('Removing event listener for onDataReceived');
      document.removeEventListener('onDataReceived', handleNativeResponse);
    };
  }, [handleNativeResponse]);

  useEffect(() => {
    // Generate nonce and request signature when component loads
    if (walletAddress) {
      console.log('Component initialized with wallet address:', walletAddress);
      
      // Generate nonce using timestamp + random number for uniqueness
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000000);
      const generatedNonce = `${timestamp}-${randomNum}`;
      setNonce(generatedNonce);
      
      console.log('Generated nonce:', generatedNonce);
      
      setIsSignatureLoading(true);
      const dataToSign = `${walletAddress}:${generatedNonce}`;
      console.log('Data to sign constructed:', dataToSign);
      
      requestNativeSignature(dataToSign);
      
      // Set a timeout to stop loading if no response is received
      const timeoutId = setTimeout(() => {
        console.log('Signature request timed out after 10 seconds');
        setIsSignatureLoading(false);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [walletAddress, requestNativeSignature]);

  const getVerificationMessage = () => {
    if (isSignatureLoading) {
      return `Loading signature...`;
    }
    return `Verify my wallet address: ${walletAddress}\nNonce: ${nonce}\nX-Sign: ${nativeSignature}`;
  };


  // Copy verification message to clipboard
  const copyToClipboard = () => {
    if (isSignatureLoading) {
      // If signature is still loading, request it again
      if (walletAddress && nonce) {
        const dataToSign = `${walletAddress}:${nonce}`;
        requestNativeSignature(dataToSign);
      }
      setCopySuccess('Waiting for signature...');
      return;
    }
    
    const message = getVerificationMessage();
    navigator.clipboard.writeText(message)
      .then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
        setCopySuccess('Failed to copy');
      });
  };

  // Try to open BlueSky app with profile link
  const openBlueSkyApp = () => {
    const username = BLUESKY_CONFIG.USERNAME;
    const universalLink = `${BLUESKY_CONFIG.PROFILE_URL_TEMPLATE}${username}`;
    const schemeLink = `${BLUESKY_CONFIG.SCHEME_TEMPLATE}${username}`;
    
    console.log(`Attempting to open BlueSky profile: ${universalLink}`);
    
    // 1. Attempt universal link (works on iOS/Android native Universal Link)
    window.location.href = universalLink;
    
    // 2. After a short delay, if page still focused, try custom scheme via iframe
    setTimeout(() => {
      if (document.hasFocus()) {
        // Insert hidden iframe to trigger bluesky:// scheme
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = schemeLink;
        document.body.appendChild(iframe);
        
        // 3. If still focused after another delay, fall back to web URL
        setTimeout(() => {
          if (document.hasFocus()) {
            window.open(universalLink, '_blank');
          }
          document.body.removeChild(iframe);
        }, 500);
      }
    }, 500);
  };

  // Handle BlueSky verification
  const handleBlueSkyVerify = () => {
    setIsLoading(true);
    
    try {
      // Open the BlueSky profile for arnacon
      openBlueSkyApp();
      
      // Send notification to native app if available
      // sendDataToNative({
      //   action: "bluesky-verification-initiated",
      //   body: { walletAddress }
      // });
      
    } catch (err) {
      console.error('Error opening BlueSky:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle go back action
  const handleBack = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigate('/');
    
    // Reset navigation flag after a short delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 300);
  };

  return (
    <div className="container">
      <div className="card" style={{ 
        textAlign: 'center',
        padding: '1rem', 
        gap: '0.8rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h1 style={{ textAlign: 'center', marginTop: '0', marginBottom: '0.5rem' }}>Verify your BlueSky account</h1>
        
        <div className="disclaimer" style={{ 
          textAlign: 'center', 
          padding: '0.8rem',
          marginBottom: '0'
        }}>
          <p style={{ marginTop: '0', marginBottom: '0.5rem' }}>Verify your identity using BlueSky by sending a message to our official account.</p>
          <p style={{ marginTop: '0', marginBottom: '0' }}>This will open the profile page where you can click "Message" to start a chat.</p>
        </div>

        <div style={{ 
          background: 'rgba(0, 0, 0, 0.2)', 
          padding: '0.8rem', 
          borderRadius: '6px', 
          marginBottom: '0.5rem',
          marginTop: '0.5rem',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--secondary-color)' }}>Copy this message to send:</p>
          <div style={{ 
            padding: '8px', 
            background: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: '4px',
            wordBreak: 'break-all',
            textAlign: 'center'
          }}>
            {getVerificationMessage()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
            <button 
              className="button secondary-button" 
              onClick={copyToClipboard}
              style={{ width: 'auto', padding: '6px 14px' }}
            >
              {copySuccess || 'Copy Message'}
            </button>
          </div>
        </div>
        
        <div className="action-buttons" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '20px',
          marginTop: '0'
        }}>
          <button 
            className="button secondary-button"
            onClick={handleBack}
            disabled={isLoading || isNavigating}
          >
            Back
          </button>
          
          <button 
            className={`button primary-button ${isLoading ? 'button-loading' : ''}`}
            onClick={handleBlueSkyVerify}
            disabled={isLoading}
          >
            {isLoading ? 'Opening...' : 'Open BlueSky Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyBlueSky;