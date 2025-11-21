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
  const [isSigning, setIsSigning] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [signature, setSignature] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Send message to native app using controller
  const sendMessageToNativeApp = (jsonData) => {
    if (window.top.controller && window.top.controller.sendMessageToNativeApp) {
      window.top.controller.sendMessageToNativeApp(jsonData);
    } else {
      console.error('Controller not available');
      setErrorMessage('Native interface not available');
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
          } else if (body['solana-message-signed']) {
            handleSolanaResponse('solana-message-signed', body['solana-message-signed']);
          }
        }
      } catch (error) {
        console.error('Error handling native response:', error);
        setErrorMessage(`Error: ${error.message}`);
      }
    };

    document.addEventListener('onDataReceived', handleNativeResponse);
    return () => document.removeEventListener('onDataReceived', handleNativeResponse);
  }, []);

  // Handle different types of Solana responses
  const handleSolanaResponse = (action, data) => {
    console.log(`Received: ${action}`, data);
    
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
        case 'solana-message-signed':
          handleSignatureResult(result);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error parsing response: ${error.message}`);
      setErrorMessage(`Error parsing response: ${error.message}`);
    }
  };

  // Handle sign-in result
  const handleSignInResult = (result) => {
    if (result.success) {
      setIsConnected(true);
      setSolanaAddress(result.walletAddress || '');
      setSeekerId(result.seekerId || 'Not available');
      setStatusMessage('Connected successfully!');
      setErrorMessage('');
    } else {
      setErrorMessage(`Connection failed: ${result.error}`);
    }
  };

  // Handle connect result
  const handleConnectResult = (result) => {
    if (result.success) {
      setIsConnected(true);
      setSolanaAddress(result.walletAddress || '');
      setSeekerId(result.seekerId || 'Not available');
      setStatusMessage('Connected successfully!');
      setErrorMessage('');
    } else {
      setErrorMessage(`Connection failed: ${result.error}`);
    }
  };

  // Handle disconnect result
  const handleDisconnectResult = (result) => {
    if (result.success) {
      setIsConnected(false);
      setSolanaAddress('');
      setSeekerId('');
      setHasSigned(false);
      setSignature('');
      setStatusMessage('');
      setErrorMessage('');
    } else {
      setErrorMessage('Disconnect failed');
    }
  };

  // Handle wallet info result
  const handleWalletInfo = (result) => {
    console.log('Wallet info:', result);
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

  // Handle signature result
  const handleSignatureResult = (result) => {
    setIsSigning(false);
    if (result.success) {
      setHasSigned(true);
      setSignature(result.signature || '');
      setStatusMessage('Message signed successfully!');
      setErrorMessage('');
    } else {
      setErrorMessage(`Signature failed: ${result.error || 'Unknown error'}`);
    }
  };

  // Sign in with Solana
  const signInWithSolana = () => {
    setStatusMessage('Connecting to wallet...');
    setErrorMessage('');
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
    setStatusMessage('Connecting to wallet...');
    setErrorMessage('');
    const request = {
      action: ACTIONS.SOLANA_CONNECT,
      body: {}
    };
    sendMessageToNativeApp(request);
  };

  // Disconnect from wallet
  const disconnectWallet = () => {
    setStatusMessage('Disconnecting...');
    const request = {
      action: ACTIONS.SOLANA_DISCONNECT,
      body: {}
    };
    sendMessageToNativeApp(request);
  };

  // Get wallet info
  const getWalletInfo = () => {
    const request = {
      action: ACTIONS.SOLANA_GET_WALLET_INFO,
      body: {}
    };
    sendMessageToNativeApp(request);
  };

  // Sign message
  const signMessage = () => {
    setIsSigning(true);
    setErrorMessage('');
    setStatusMessage('Requesting signature...');
    const message = `Verify ownership of ${seekerId} for Arnacon registration`;
    const request = {
      action: ACTIONS.SOLANA_SIGN_MESSAGE,
      body: {
        message: message
      }
    };
    sendMessageToNativeApp(request);
  };

  // Verify and register subdomain
  const verifyAndReceiveProduct = async () => {
    if (!seekerId || !solanaAddress) {
      setErrorMessage('Missing Seeker ID or wallet address');
      return;
    }

    // Split the Seeker ID into label and domain (e.g., "gat.skr" -> label: "gat", domain: "skr")
    const parts = seekerId.split('.');
    if (parts.length !== 2) {
      setErrorMessage('Invalid Seeker ID format. Expected format: label.domain');
      return;
    }

    const [label, domain] = parts;

    setIsVerifying(true);
    setErrorMessage('');
    setStatusMessage('Verifying and registering...');
    
    try {
      const apiUrl = 'https://seeker-register-subdomain-309305771885.europe-west1.run.app';
      const payload = {
        label: label,
        domain: domain,
        owner: walletAddress
      };
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage('✓ Registration successful! Your product has been verified.');
        setErrorMessage('');
      } else {
        setErrorMessage(`Registration failed: ${data.error || response.statusText}`);
        setStatusMessage('');
      }
    } catch (error) {
      setErrorMessage(`Network error: ${error.message}`);
      setStatusMessage('');
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
            🦊 Solana Seeker
          </h1>
          <p style={{ 
            fontSize: '0.95rem',
            color: '#888',
            margin: 0
          }}>
            Verify your wallet to receive your product
          </p>
        </div>
        
        {/* Status and Error Messages */}
        {statusMessage && (
          <div style={{
            background: 'rgba(0, 255, 163, 0.1)',
            border: '1px solid #00FFA3',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            color: '#00FFA3',
            textAlign: 'center'
          }}>
            {statusMessage}
          </div>
        )}
        
        {errorMessage && (
          <div style={{
            background: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid #FF4444',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            color: '#FF4444',
            textAlign: 'center'
          }}>
            {errorMessage}
          </div>
        )}
        
        {/* Not Connected View */}
        {!isConnected && (
          <>
            <div style={{
              background: 'rgba(30, 42, 58, 0.5)',
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
                  fontSize: '1rem', 
                  padding: '16px 24px',
                  background: '#00FFA3',
                  color: '#000',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Sign In with Solana
              </button>
              
              <button 
                className="button secondary-button"
                onClick={connectWallet}
                style={{ 
                  fontSize: '0.9rem', 
                  padding: '14px 20px',
                  borderRadius: '8px'
                }}
              >
                Connect Wallet
              </button>
            </div>
          </>
        )}

        {/* Connected - Need Signature View */}
        {isConnected && !hasSigned && (
          <>
            <div style={{
              background: 'rgba(30, 42, 58, 0.5)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                background: '#00FFA3',
                color: '#000',
                fontWeight: '600',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Connected
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
                }}>
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

            <div style={{
              background: 'rgba(0, 255, 163, 0.05)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <p style={{ 
                fontSize: '0.95rem', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#fff'
              }}>
                Verify Ownership
              </p>
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#aaa', 
                lineHeight: '1.5',
                margin: 0
              }}>
                Sign a message to verify you own this wallet. This signature is used for authentication only.
              </p>
            </div>

            <button 
              className="button primary-button"
              onClick={signMessage}
              disabled={isSigning}
              style={{ 
                width: '100%',
                fontSize: '1rem', 
                padding: '16px 24px',
                background: isSigning ? '#666' : '#00FFA3',
                color: '#000',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: isSigning ? 'not-allowed' : 'pointer',
                opacity: isSigning ? 0.7 : 1,
                marginBottom: '12px',
                transition: 'all 0.2s'
              }}
            >
              {isSigning ? 'Signing...' : 'Sign Message'}
            </button>

            <button 
              className="button secondary-button"
              onClick={disconnectWallet}
              style={{ 
                width: '100%',
                fontSize: '0.875rem', 
                padding: '12px 20px',
                borderRadius: '8px'
              }}
            >
              Disconnect
            </button>
          </>
        )}

        {/* Connected and Signed - Ready to Verify View */}
        {isConnected && hasSigned && (
          <>
            <div style={{
              background: 'rgba(30, 42, 58, 0.5)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  background: '#00FFA3',
                  color: '#000',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Connected
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  background: 'rgba(0, 255, 163, 0.2)',
                  color: '#00FFA3',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Verified
                </div>
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
                }}>
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

            <button 
              className="button primary-button"
              onClick={verifyAndReceiveProduct}
              disabled={isVerifying}
              style={{ 
                width: '100%',
                fontSize: '1rem', 
                padding: '16px 24px',
                background: isVerifying ? '#666' : '#00FFA3',
                color: '#000',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: isVerifying ? 'not-allowed' : 'pointer',
                opacity: isVerifying ? 0.7 : 1,
                marginBottom: '12px',
                transition: 'all 0.2s'
              }}
            >
              {isVerifying ? 'Processing...' : 'Receive Product'}
            </button>

            <button 
              className="button secondary-button"
              onClick={disconnectWallet}
              style={{ 
                width: '100%',
                fontSize: '0.875rem', 
                padding: '12px 20px',
                borderRadius: '8px'
              }}
            >
              Disconnect
            </button>
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
              borderRadius: '8px'
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifySolana;
