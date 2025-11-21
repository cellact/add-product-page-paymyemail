import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACTIONS } from '../utils/DefaultParameters';
import '../styles/Common.css';

const VerifySolana = ({ walletAddress }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [solanaAddress, setSolanaAddress] = useState('');
  const [seekerId, setSeekerId] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  // Add log entry (for debugging only, not displayed)
  const addLog = (message, type = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Send message to native app using controller
  const sendMessageToNativeApp = (jsonData) => {
    if (window.top.controller && window.top.controller.sendMessageToNativeApp) {
      window.top.controller.sendMessageToNativeApp(jsonData);
    } else {
      console.error('Controller not available');
      addLog('Native interface not available', 'error');
    }
  };

  // Handle Solana responses from native app
  useEffect(() => {
    const handleNativeResponse = (event) => {
      try {
        const data = event.detail;
        
        if (data && data.action === ACTIONS.DATA_RETRIEVED && data.body) {
          const body = data.body;
          
          if (body['solana-signed-in']) {
            handleSolanaResponse('solana-signed-in', body['solana-signed-in']);
          } else if (body['solana-connected']) {
            handleSolanaResponse('solana-connected', body['solana-connected']);
          } else if (body['solana-disconnected']) {
            handleSolanaResponse('solana-disconnected', body['solana-disconnected']);
          } else if (body['solana-wallet-info']) {
            handleSolanaResponse('solana-wallet-info', body['solana-wallet-info']);
          }
        }
      } catch (error) {
        console.error('Error handling native response:', error);
        addLog(`Error: ${error.message}`, 'error');
      }
    };

    document.addEventListener('onDataReceived', handleNativeResponse);
    return () => document.removeEventListener('onDataReceived', handleNativeResponse);
  }, []);

  // Handle different types of Solana responses
  const handleSolanaResponse = (action, data) => {
    addLog(`Received: ${action}`, 'info');
    
    try {
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      switch(action) {
        case 'solana-signed-in':
          handleSignInResult(result);
          break;
        case 'solana-connected':
          handleConnectResult(result);
          break;
        case 'solana-disconnected':
          handleDisconnectResult(result);
          break;
        case 'solana-wallet-info':
          handleWalletInfo(result);
          break;
        default:
          break;
      }
    } catch (error) {
      addLog(`Error parsing response: ${error.message}`, 'error');
    }
  };

  // Handle sign-in result
  const handleSignInResult = (result) => {
    if (result.success) {
      addLog('✓ Signed in successfully!', 'success');
      setIsConnected(true);
      setSolanaAddress(result.walletAddress || '');
      setSeekerId(result.seekerId || 'Not available');
    } else {
      addLog(`✗ Sign-in failed: ${result.error}`, 'error');
    }
  };

  // Handle connect result
  const handleConnectResult = (result) => {
    if (result.success) {
      addLog('✓ Connected to wallet!', 'success');
      setIsConnected(true);
      setSolanaAddress(result.walletAddress || '');
      setSeekerId(result.seekerId || 'Not available');
    } else {
      addLog(`✗ Connection failed: ${result.error}`, 'error');
    }
  };

  // Handle disconnect result
  const handleDisconnectResult = (result) => {
    if (result.success) {
      addLog('✓ Disconnected from wallet', 'success');
      setIsConnected(false);
      setSolanaAddress('');
      setSeekerId('');
    } else {
      addLog('✗ Disconnect failed', 'error');
    }
  };

  // Handle wallet info result
  const handleWalletInfo = (result) => {
    addLog(`Wallet info: Connected=${result.isConnected}`, 'info');
    if (result.isConnected) {
      setIsConnected(true);
      setSolanaAddress(result.walletAddress || '');
      setSeekerId(result.seekerId || 'Not available');
    } else {
      setIsConnected(false);
      setSolanaAddress('');
      setSeekerId('');
    }
  };

  // Sign in with Solana
  const signInWithSolana = () => {
    addLog('Requesting Sign In with Solana...', 'info');
    const request = {
      action: ACTIONS.SOLANA_SIGN_IN,
      body: {
        domain: 'arnacon.app',
        statement: 'Sign in to Arnacon to verify your identity and access secure communication features.'
      }
    };
    sendMessageToNativeApp(request);
  };

  // Connect to wallet
  const connectWallet = () => {
    addLog('Connecting to wallet...', 'info');
    const request = {
      action: ACTIONS.SOLANA_CONNECT,
      body: {}
    };
    sendMessageToNativeApp(request);
  };

  // Disconnect from wallet
  const disconnectWallet = () => {
    addLog('Disconnecting from wallet...', 'info');
    const request = {
      action: ACTIONS.SOLANA_DISCONNECT,
      body: {}
    };
    sendMessageToNativeApp(request);
  };

  // Get wallet info
  const getWalletInfo = () => {
    addLog('Requesting wallet info...', 'info');
    const request = {
      action: ACTIONS.SOLANA_GET_WALLET_INFO,
      body: {}
    };
    sendMessageToNativeApp(request);
  };

  // Verify and register subdomain
  const verifyAndReceiveProduct = async () => {
    if (!seekerId || !solanaAddress) {
      setStatusMessage('Missing Seeker ID or wallet address');
      addLog('✗ Missing Seeker ID or wallet address', 'error');
      return;
    }

    // Split the Seeker ID into label and domain (e.g., "gat.skr" -> label: "gat", domain: "skr")
    const parts = seekerId.split('.');
    if (parts.length !== 2) {
      setStatusMessage('Invalid Seeker ID format. Expected: label.domain');
      addLog('✗ Invalid Seeker ID format. Expected format: label.domain', 'error');
      return;
    }

    const [label, domain] = parts;

    setIsVerifying(true);
    setStatusMessage('');
    setShowSuccess(false);
    addLog('Starting verification process...', 'info');
    
    try {
      const apiUrl = 'https://seeker-register-subdomain-309305771885.europe-west1.run.app';
      const payload = {
        label: label,
        domain: domain,
        owner: walletAddress
      };

      addLog(`Sending registration request for ${label}.${domain}...`, 'info');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setStatusMessage('');
        addLog('✓ Registration successful!', 'success');
        addLog(`Response: ${JSON.stringify(data)}`, 'success');
      } else {
        setStatusMessage(data.error || 'Registration failed. Please try again.');
        addLog(`✗ Registration failed: ${data.error || response.statusText}`, 'error');
      }
    } catch (error) {
      setStatusMessage('Network error. Please check your connection and try again.');
      addLog(`✗ Network error: ${error.message}`, 'error');
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  // Request wallet info on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      getWalletInfo();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Navigate handler
  const handleNavigate = (path) => {
    if (!isNavigating) {
      setIsNavigating(true);
      navigate(path);
    }
  };

  // Truncate address for display
  const getTruncatedAddress = (address) => {
    if (!address) return 'Not connected';
    return address.length > 16 
      ? `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
      : address;
  };

  return (
    <div className="container" style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <div className="card" style={{ 
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        padding: '32px 24px',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '1.75rem',
            margin: '0 0 8px 0',
            color: '#00FFA3',
            fontWeight: '700'
          }}>
            Solana Seeker
          </h1>
          <p style={{ 
            fontSize: '0.95rem',
            color: '#888',
            margin: 0
          }}>
            Verify your wallet to receive your product
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 163, 0.15), rgba(0, 255, 163, 0.05))',
            border: '2px solid #00FFA3',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✓</div>
            <p style={{ 
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#00FFA3',
              margin: '0 0 8px 0'
            }}>
              Registration Successful!
            </p>
            <p style={{ 
              fontSize: '0.9rem',
              color: '#aaa',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Your Seeker ID has been verified and registered successfully.
            </p>
          </div>
        )}

        {/* Error Message */}
        {statusMessage && (
          <div style={{
            background: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid #FF4444',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            color: '#FF4444',
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            {statusMessage}
          </div>
        )}
        
        {/* Not Connected View */}
        {!isConnected && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 42, 58, 0.8), rgba(30, 42, 58, 0.4))',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <p style={{ 
                fontSize: '1rem', 
                marginBottom: '12px', 
                fontWeight: '600',
                color: '#fff'
              }}>
                Connect Your Wallet
              </p>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#aaa', 
                lineHeight: '1.6',
                margin: 0
              }}>
                Connect your Solana Seeker wallet to verify your device and link it to your Arnacon account.
              </p>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px'
            }}>
              <button 
                className="button primary-button"
                onClick={signInWithSolana}
                style={{ 
                  width: '100%',
                  fontSize: '1rem', 
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #00FFA3, #00CC82)',
                  color: '#000',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 12px rgba(0, 255, 163, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 255, 163, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 255, 163, 0.3)';
                }}
              >
                Sign In with Solana
              </button>
              
              <button 
                className="button secondary-button"
                onClick={connectWallet}
                style={{ 
                  width: '100%',
                  fontSize: '0.9rem', 
                  padding: '14px 20px',
                  borderRadius: '12px'
                }}
              >
                Connect Wallet (Simple)
              </button>
            </div>
          </>
        )}

        {/* Connected View */}
        {isConnected && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 42, 58, 0.8), rgba(30, 42, 58, 0.4))',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                background: '#00FFA3',
                color: '#000',
                fontWeight: '600',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Signed In
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <p style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: '0.75rem',
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Wallet Address
                </p>
                <p style={{ 
                  margin: 0,
                  fontFamily: 'monospace', 
                  fontSize: '0.875rem',
                  wordBreak: 'break-all',
                  color: '#fff'
                }}
                  title={solanaAddress}
                >
                  {getTruncatedAddress(solanaAddress)}
                </p>
              </div>
              
              <div>
                <p style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: '0.75rem',
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Seeker ID
                </p>
                <p style={{ 
                  margin: 0,
                  fontFamily: 'monospace', 
                  fontSize: '0.875rem',
                  color: '#00FFA3',
                  fontWeight: '600'
                }}>
                  {seekerId}
                </p>
              </div>
            </div>

            {!showSuccess && (
              <button 
                className="button primary-button"
                onClick={verifyAndReceiveProduct}
                disabled={isVerifying}
                style={{ 
                  width: '100%',
                  fontSize: '1rem', 
                  padding: '16px 24px',
                  background: isVerifying ? '#666' : 'linear-gradient(135deg, #00FFA3, #00CC82)',
                  color: '#000',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: isVerifying ? 'not-allowed' : 'pointer',
                  opacity: isVerifying ? 0.7 : 1,
                  marginBottom: '12px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: isVerifying ? 'none' : '0 4px 12px rgba(0, 255, 163, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!isVerifying) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(0, 255, 163, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isVerifying) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 255, 163, 0.3)';
                  }
                }}
              >
                {isVerifying ? (
                  <>
                    <span style={{ 
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid #000',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      marginRight: '8px'
                    }}></span>
                    Processing...
                  </>
                ) : 'Verify & Receive Product'}
              </button>
            )}

            <div style={{ 
              display: 'flex', 
              gap: '12px',
              marginTop: '12px'
            }}>
              <button 
                className="button secondary-button"
                onClick={getWalletInfo}
                style={{ 
                  flex: 1,
                  fontSize: '0.875rem', 
                  padding: '12px 16px',
                  borderRadius: '12px'
                }}
              >
                Refresh
              </button>
              
              <button 
                className="button secondary-button"
                onClick={disconnectWallet}
                style={{ 
                  flex: 1,
                  fontSize: '0.875rem', 
                  padding: '12px 16px',
                  borderRadius: '12px'
                }}
              >
                Disconnect
              </button>
            </div>
          </>
        )}

        {/* Back Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button 
            className="button secondary-button"
            onClick={() => handleNavigate('/')}
            disabled={isNavigating}
            style={{ 
              fontSize: '0.875rem', 
              padding: '10px 24px',
              borderRadius: '12px'
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Add spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerifySolana;
