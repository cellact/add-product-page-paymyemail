import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACTIONS } from '../utils/DefaultParameters';
import '../styles/Common.css';
import VerificationAnimation from '../components/VerificationAnimation';

const VerifySolana = ({ walletAddress }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [solanaAddress, setSolanaAddress] = useState('');
  const [seekerId, setSeekerId] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [logs, setLogs] = useState([{ message: 'Ready to connect...', type: 'info', time: new Date() }]);
  const logContainerRef = useRef(null);
  const navigate = useNavigate();

  // Add log entry
  const addLog = (message, type = 'info') => {
    setLogs(prevLogs => {
      const newLogs = [...prevLogs, { message, type, time: new Date() }];
      // Keep only last 50 entries
      return newLogs.slice(-50);
    });
  };

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

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
      maxWidth: '100%', 
      padding: '5px',
      overflowX: 'hidden'
    }}>
      <div className="card" style={{ 
        overflowY: 'auto',
        maxHeight: '90vh',
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '24px',
        boxSizing: 'border-box'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          fontSize: 'calc(1.2rem + 1vw)', 
          wordBreak: 'break-word',
          margin: '0 0 20px 0',
          color: '#00FFA3'
        }}>
          🦊 Solana Seeker Wallet
        </h1>
        
        {/* Not Connected View */}
        {!isConnected && (
          <>
            <div style={{
              background: '#1E2A3A',
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 0',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: 'bold' }}>
                Connect Your Solana Seeker Wallet
              </p>
              <p style={{ fontSize: '0.9rem', color: '#aaa', lineHeight: '1.6' }}>
                To verify your Seeker ID and receive your product, you need to connect your Solana wallet.
              </p>
              <p style={{ fontSize: '0.9rem', color: '#aaa', lineHeight: '1.6', marginTop: '12px' }}>
                This will allow us to verify your device and link it to your Arnacon account.
              </p>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              margin: '20px 0'
            }}>
              <button 
                className="button primary-button"
                onClick={signInWithSolana}
                style={{ 
                  fontSize: '1rem', 
                  padding: '14px 24px',
                  background: '#00FFA3',
                  color: '#000',
                  fontWeight: '600'
                }}
              >
                Sign In with Solana
              </button>
              
              <button 
                className="button secondary-button"
                onClick={connectWallet}
                style={{ fontSize: '0.9rem', padding: '12px 20px' }}
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
              background: '#1E2A3A',
              borderRadius: '8px',
              padding: '16px',
              margin: '16px 0'
            }}>
              <div style={{
                display: 'inline-block',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                background: '#00FFA3',
                color: '#000',
                fontWeight: '600',
                marginBottom: '12px'
              }}>
                Connected
              </div>
              
              <p style={{ margin: '8px 0', fontSize: '14px' }}>
                <strong style={{ color: '#00FFA3' }}>Wallet Address:</strong>
                <br />
                <span 
                  style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '13px',
                    wordBreak: 'break-all'
                  }}
                  title={solanaAddress}
                >
                  {getTruncatedAddress(solanaAddress)}
                </span>
              </p>
              
              <p style={{ margin: '8px 0', fontSize: '14px' }}>
                <strong style={{ color: '#00FFA3' }}>Seeker ID:</strong> {seekerId}
              </p>
            </div>

            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '8px',
              margin: '20px 0'
            }}>
              <button 
                className="button primary-button"
                onClick={() => addLog('Verify function to be implemented', 'info')}
                style={{ 
                  fontSize: '1rem', 
                  padding: '12px 24px',
                  background: '#00FFA3',
                  color: '#000',
                  fontWeight: '600',
                  flex: '1 1 auto'
                }}
              >
                Verify & Receive Product
              </button>
            </div>

            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '8px',
              margin: '12px 0'
            }}>
              <button 
                className="button secondary-button"
                onClick={getWalletInfo}
                style={{ fontSize: '0.85rem', padding: '8px 16px', flex: '1 1 auto' }}
              >
                Refresh Info
              </button>
              
              <button 
                className="button secondary-button"
                onClick={disconnectWallet}
                style={{ fontSize: '0.85rem', padding: '8px 16px', flex: '1 1 auto' }}
              >
                Disconnect
              </button>
            </div>
          </>
        )}

        {/* Activity Log */}
        <div style={{
          background: '#0a0a0a',
          borderRadius: '8px',
          padding: '12px',
          marginTop: '20px',
          maxHeight: '200px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '11px'
        }}
        ref={logContainerRef}
        >
          {logs.map((log, index) => (
            <div 
              key={index}
              style={{
                margin: '4px 0',
                padding: '4px',
                color: log.type === 'success' ? '#00FFA3' : 
                       log.type === 'error' ? '#FF4444' : '#888'
              }}
            >
              [{log.time.toLocaleTimeString()}] {log.message}
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginTop: '20px'
        }}>
          <button 
            className="button secondary-button"
            onClick={() => handleNavigate('/')}
            disabled={isNavigating}
            style={{ fontSize: '0.9rem', padding: '10px 24px' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifySolana;
