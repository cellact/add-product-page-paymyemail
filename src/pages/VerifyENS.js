import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, ACTIONS, VERIFICATION_MESSAGES, UI_CONFIG } from '../utils/DefaultParameters';
import { fetchMessageFromContract } from '../utils/smartContractUtils';
import '../styles/Common.css';
import WalletConnectButton from '../components/WalletConnect';
import VerificationAnimation from '../components/VerificationAnimation';
import { JsonRpcProvider } from 'ethers';
import { ethers } from 'ethers';
const VerifyENS = ({ walletAddress }) => {
  const [ens, setEns] = useState('');
  const [normalizedEns, setNormalizedEns] = useState('');
  const [ensAddress, setEnsAddress] = useState('');
  const ensAddressRef = useRef(''); // Ref to store ensAddress for more reliable access
  const [step, setStep] = useState('input'); // input, resolving, connect, ready-to-sign, signing, complete, done, ios-loading-message, ios-confirm
  const [error, setError] = useState('');
  const [signature, setSignature] = useState('');
  const [nativeSignature, setNativeSignature] = useState('');
  const [message, setMessage] = useState('');
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [userWalletAddress, setUserWalletAddress] = useState(walletAddress || '');
  const [mainWalletAddress, setMainWalletAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();
  
  // Update userWalletAddress when walletAddress prop changes
  useEffect(() => {
    if (walletAddress) {
      setUserWalletAddress(walletAddress);
    }
  }, [walletAddress]);
  
  // Check if we're on iOS with more accurate detection
  useEffect(() => {
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
        !window.MSStream && 
        !navigator.platform.includes('Mac') && 
        !navigator.platform.includes('Win');
      setIsIOS(isIOSDevice);
    };
    
    checkIOS();
  }, []);
  
  // Initialize provider for ENS resolution
  const provider = new JsonRpcProvider(API_ENDPOINTS.ETH_RPC_PROVIDER);
  
  // This effect now only clears errors and does not automatically change steps
  useEffect(() => {
    // Skip if we're in these steps
    if (step === 'complete' || step === 'signing' || step === 'done') return;
  }, [step]);
  
  // When ensAddress state changes, update the ref
  useEffect(() => {
    ensAddressRef.current = ensAddress;
    console.log('ensAddress updated in state:', ensAddress);
    console.log('ensAddress updated in ref:', ensAddressRef.current);
  }, [ensAddress]);
  
  // Set up event listener for native app response
  useEffect(() => {
    const handleNativeResponse = async (event) => {
      try {
        console.log("Raw native response:", event);
        
        // Parse the response if it's a string (for non-iOS devices)
        let response = event.detail;
        if (typeof event.detail === 'string') {
          try {
            setNativeSignature(event.detail);
            response = JSON.parse(event.detail);
          } catch (e) {
            console.log("Response is not JSON, using as is");
          }
        }
        
        // Handle iOS ENS verification response
        if (response?.action === ACTIONS.VERIFIED_ENS && response?.body) {
          const { arnaconSign, walletSign } = response.body;
          console.log("Received iOS signatures:", { arnaconSign, walletSign });
          
          if (arnaconSign && walletSign) {
            setNativeSignature(arnaconSign);
            setSignature(walletSign);
            console.log("Verifying signature matches ENS owner address");
            
            try {
              // Recover address from signature
              let recoveredAddress = verifySignature(message, walletSign);
              console.log("Recovered address:", recoveredAddress);
              
              // Use the ref for more reliable access to the current value
              const currentEnsAddress = ensAddressRef.current;
              console.log("ENS resolved address (from ref):", currentEnsAddress);
              
              // Verify the ENS address was properly set during resolution
              if (!currentEnsAddress) {
                console.error("ENS address is empty, cannot verify signature");
                setError("ENS address is missing. Please try again from the beginning.");
                setStep('input');
                setIsSubmitting(false);
                return;
              }
              
              if (recoveredAddress.toLowerCase() === currentEnsAddress.toLowerCase()) {
                console.log("Signature verification successful - addresses match");
                setStep('complete');
              } else {
                console.log("Signature verification failed - addresses don't match");
                setError(`The signing wallet (${recoveredAddress}) does not match the ENS owner (${currentEnsAddress}). Please try again with the correct wallet.`);
                setStep('input');
              }
              setIsSubmitting(false);

            } catch (verifyErr) {
              console.error("Error verifying signature:", verifyErr);
              setError("Failed to verify signature. Please try again.");
              setStep('input');
              setIsSubmitting(false);
            }
          }
        }
        // Handle Android data-retrieved response  
        else if (response?.action === ACTIONS.DATA_RETRIEVED && response?.body) {
          console.log('Processing Android data-retrieved response:', response);
          
          const { xsign } = response.body;
          const arnaconSign = xsign;
          console.log('Received Android signature from data-retrieved:', arnaconSign);
          
          if (arnaconSign) {
            setNativeSignature(arnaconSign);
            console.log('Android signature applied successfully');
            setIsSubmitting(false);
            
            // If we have both signatures (wallet signature should already be set from direct signing), proceed to complete
            if (signature) {
              console.log('Both signatures available, proceeding to complete step');
              setStep('complete');
            } else {
              console.log('Wallet signature missing, but Android signature received');
            }
          } else {
            console.log('No signature found in Android data-retrieved response:', response);
            setError('No signature received from Android app. Please try again.');
            setStep('input');
            setIsSubmitting(false);
          }
        }
      } catch (err) {
        console.log('Error handling native response:', err.message);
        setError('Failed to process verification. Please try again.');
        setStep('input')
        setIsSubmitting(false);
      }
    };
    
    document.addEventListener('onDataReceived', handleNativeResponse);
    return () => document.removeEventListener('onDataReceived', handleNativeResponse);
  }, [message, signature]); // Added signature dependency since it's used in the handler

  // Helper function to normalize ENS name
  const normalizeEnsName = (name) => {
    return name.trim().toLowerCase();
  };

  // Helper function to resolve ENS to address using ethers.js
  const handleResolveENS = async (ensName) => {
    try {
      setStep('resolving');
      setError('');
      
      // Normalize the ENS name (convert to lowercase)
      const normalized = normalizeEnsName(ensName);
      setNormalizedEns(normalized);
      
      console.log('Resolving normalized ENS name:', normalized);
      
      // Use ethers.js to resolve the ENS name
      const resolvedAddress = await provider.resolveName(normalized);
      if (!resolvedAddress) {
        setError('Could not resolve this ENS name. Please check and try again.');
        setStep('input');
        return null;
      }
      
      console.log('ENS resolved address:', resolvedAddress);
      setEnsAddress(resolvedAddress);
      ensAddressRef.current = resolvedAddress; // Update ref directly for immediate access
      setStep('connect');
      return resolvedAddress;
    } catch (err) {
      console.error('Error resolving ENS:', err);
      setError('Error resolving ENS name. Please try again.');
      setStep('input');
      return null;
    }
  };

  // Function to fetch message from smart contract
  const fetchMessage = async (walletAddress) => {
    try {
      setIsLoadingMessage(true);
      setError('');
      
      console.log('Fetching message from smart contract for address:', walletAddress);
      const contractMessage = await fetchMessageFromContract(walletAddress);
      setMessage(contractMessage);
      console.log('Message fetched successfully:', contractMessage);
      
    } catch (err) {
      console.error('Error fetching message from contract:', err);
      setError(`Failed to fetch verification message: ${err.message}`);
      // Fallback to default message if contract fails
      setMessage(VERIFICATION_MESSAGES.ENS_SIGNATURE);
    } finally {
      setIsLoadingMessage(false);
    }
  };

  // Called when wallet is connected - stores the address and fetches message
  const onWalletConnected = async (address) => {
    // Don't update wallet address if we're already in complete or signing state
    if (step === 'complete' || step === 'signing' || step === 'done') return;
    
    console.log('Wallet connected with address:', address);
    setMainWalletAddress(address);
    
    // Fetch message from smart contract
    await fetchMessage(address);
  };

  // New function to manually verify the connected wallet
  const verifyWalletAddress = () => {
    if (!userWalletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    // Compare addresses using the ref for more reliable access
    const currentEnsAddress = ensAddressRef.current;
    
    if (mainWalletAddress.toLowerCase() === currentEnsAddress.toLowerCase()) {
      // Clear any existing errors when addresses match
      setError('');
      setStep('ready-to-sign');
    } else {
      setError(`This wallet (${userWalletAddress}) does not match the ENS owner address (${currentEnsAddress})`);
    }
  };

  // Add a function to verify the signature and recover the address
  const verifySignature =  (message, signature) => {
    try {
      // Use ethers.js to recover the address from the signature
    const signerAddress = ethers.verifyMessage(message, signature) 
     return signerAddress;
    } catch (error) {
      console.error("Error recovering address from signature:", error);
      throw new Error("Failed to verify signature");
    }
  };


  // Called when wallet signs message - used in direct signing callback
  const handleMessageSigned = async (sig) => {
    console.log('Direct signature callback with signature:', sig.substring(0, 10) + '...');
    
    try {
      // Recover address from signature
      const recoveredAddress = await verifySignature(message, sig);
      console.log("Recovered address:", recoveredAddress);
      
      // Use the ref for more reliable access
      const currentEnsAddress = ensAddressRef.current;
      
      if (recoveredAddress.toLowerCase() === currentEnsAddress.toLowerCase()) {
        console.log("Signature verification successful - addresses match");
        // Force an immediate state update to complete
        setSignature(sig);
        requestNativeSignature(sig);
        setStep('complete');
      } else {
        console.log("Signature verification failed - addresses don't match");
        setError(`The signing wallet (${recoveredAddress}) does not match the ENS owner (${currentEnsAddress}). Please try again with the correct wallet.`);
        setStep('ready-to-sign');
      }
    } catch (error) {
      console.error("Error verifying signature:", error);
      setError("Failed to verify signature. Please try again.");
      setStep('ready-to-sign');
    }
  };

  // Function to handle message signing - passes to WalletConnect
  const handleSign = () => {
    setError('');
    setStep('signing');
  };

  const handleSubmit = async () => {
    if (!ens) {
      setError('Please enter an ENS name');
      return;
    }
    
    // Validate if input is a valid ENS name (ends with .eth or similar)
    if (!ens.includes('.')) {
      setError('Please enter a valid ENS name (e.g., name.eth)');
      return;
    }

    if (isIOS) {
      try {
        console.log('Resolving ENS name for iOS verification flow');
        
        // First resolve the ENS name to get the address
        const normalized = normalizeEnsName(ens);
        console.log("Normalized ENS name:", normalized);
        setNormalizedEns(normalized);
        
        setStep('resolving');
        
        // Use ethers.js to resolve the ENS name
        const resolvedAddress = await provider.resolveName(normalized);
        
        if (!resolvedAddress) {
          setError('Could not resolve this ENS name. Please check and try again.');
          setStep('input');
          return;
        }
        
        console.log('ENS resolved address:', resolvedAddress);
        setEnsAddress(resolvedAddress);
        ensAddressRef.current = resolvedAddress; // Update ref directly
        
        // Set to iOS loading message step
        setStep('ios-loading-message');
        
        // Fetch message from smart contract for iOS flow
        await fetchMessage(resolvedAddress);
        
        // Set to iOS confirmation step after message is fetched
        setStep('ios-confirm');
      } catch (error) {
        console.error('Error resolving ENS:', error);
        setError('Error resolving ENS name. Please try again.');
        setStep('input');
      }
      return;
    }
    
    // For non-iOS devices, continue with normal flow
    await handleResolveENS(ens);
  };
  
  // Function to proceed with iOS native verification after confirmation
  const handleIOSProceed = async () => {
    try {
      // Safety check - make sure we have the ENS address before proceeding
      if (!ensAddress) {
        console.error("Missing ENS address in handleIOSProceed");
        setError("Missing ENS address information. Please try again.");
        setStep('input');
        return;
      }
      
      // Safety check - make sure we have the message
      if (!message) {
        console.error("Missing message in handleIOSProceed");
        setError("Verification message is missing. Please try again.");
        setStep('input');
        return;
      }
      
      console.log('Sending ENS verification request to native app');
      console.log('Using ENS address:', ensAddress);
      console.log('Using message:', message);
      setStep('pending');
      setIsSubmitting(true);
      
      const jsonData = {
        action: ACTIONS.VERIFY_ENS,
        body: { 
          ens: normalizedEns,
          message: message,
          ensAddress: ensAddress,
          walletAddress: walletAddress
        }
      };
      
      console.log('Sending data to native app:', jsonData);
      sendDataToNative(jsonData);
    } catch (error) {
      console.error('Error sending data to native:', error);
      setError('Failed to communicate with the app. Please try again.');
      setIsSubmitting(false);
      setStep('input');
    }
  };
  
  // Handle navigation with prevention of multiple clicks
  const handleNavigate = (path) => {
    if (!isNavigating) {
      setIsNavigating(true);
      navigate(path);
    }
  };
  
  function generateUUID(){
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : ((r&0x3)|0x8);
        return v.toString(16);
        });
    }

    function handleENS(ENS, customer_id) {
        const jsonData = {
            action: ACTIONS.NEW_ITEM,
            body: { item: ENS, customer_id: customer_id }
        };
        sendDataToNative(jsonData);
    }

    function sendDataToNative(jsonData) {
        console.log('Attempting to send data to native:', jsonData);
        
        // Check for ReactNativeWebView first (most common for webviews)
        if (window.ReactNativeWebView) {
            console.log('Using ReactNativeWebView bridge');
            window.ReactNativeWebView.postMessage(JSON.stringify(jsonData));
        }
        // Then check for iOS WKWebView handler
        else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeHandler) {
            console.log('Using WKWebView message handler');
            window.webkit.messageHandlers.nativeHandler.postMessage(JSON.stringify(jsonData));
        }
        // Then check for Android bridge
        else if (window.AndroidBridge && window.AndroidBridge.processAction) {
            console.log('Using Android bridge');
            window.AndroidBridge.processAction(JSON.stringify(jsonData));
        }
        // Finally check for iOS buttonPressed handler (legacy)
        else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.buttonPressed) {
            console.log('Using buttonPressed message handler');
            window.webkit.messageHandlers.buttonPressed.postMessage(JSON.stringify(jsonData));
        }
        else {
            console.error('No native interface available. Available interfaces:', {
                ReactNativeWebView: !!window.ReactNativeWebView,
                webkit: !!window.webkit,
                messageHandlers: window.webkit && !!window.webkit.messageHandlers,
                nativeHandler: window.webkit && window.webkit.messageHandlers && !!window.webkit.messageHandlers.nativeHandler,
                AndroidBridge: !!window.AndroidBridge
            });
            setError('Unable to communicate with the app. Please try again.');
        }
    }

  // Function to send request to native app for signature
  const requestNativeSignature = (dataToSign) => {
    const request = {
      action: ACTIONS.SIGN_DATA_TEMP,
      body: { dataToSign }
    };

    console.log("Requesting native signature for:", dataToSign);

    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.buttonPressed) {
      window.webkit.messageHandlers.buttonPressed.postMessage(JSON.stringify(request));
    } else if (window.AndroidBridge && window.AndroidBridge.processAction) {
      window.AndroidBridge.processAction(JSON.stringify(request));
    } else {
      console.log("Native interface not available, simulating response for testing");
      // Simulate native response for testing - remove in production
      setTimeout(() => {
        const mockEvent = new CustomEvent('onDataReceived', { 
          detail: 'mock-native-signature-' + Math.random().toString(36).substring(2, 10)
        });
        document.dispatchEvent(mockEvent);
      }, 1500);
    }
  };

  // Function to submit data to cloud function
  const submitToCloud = async (signWallet, signArnacon) => {
    try {
      console.log("Submitting to cloud function with signatures:", {
        message,
        signWallet,
        signArnacon
      });

      const customer_id = generateUUID();
      


      if (!isIOS) {
        handleENS(normalizedEns, customer_id);
      }

      // Start the POST request in a new thread without awaiting
      await fetch(API_ENDPOINTS.UPDATE_MAPPING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item: normalizedEns,
          customer_id: customer_id,
          message,
          signWallet,
          signArnacon,
          arnaconAddress: userWalletAddress
        })
      })
      .then(response => {
        if (response.status !== 200) {
          console.error(`Server responded with ${response.status}`);
        }
        console.log("Cloud submission completed");
      })
      .catch(err => {
        console.error("Error in cloud submission:", err);
      });

      if (normalizedEns) {
        // Continue execution immediately without waiting for POST response
        handleENS(normalizedEns, customer_id);
      } else{
        if (ens) {
          handleENS(ens, customer_id);
        } else{
          handleENS("IDK MAN", customer_id);
        }
      }
      
      // Proceed to completion screen immediately
      setIsSubmitting(false);
      setStep('done');
      
    } catch (err) {
      console.error("Error initiating submission process:", err);
      setError("Error submitting verification. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Function to handle final data submission
  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      
      if (isIOS) {
        // For iOS, we don't need to request signature here as it's already handled in the native app
        // Just submit to cloud with the signatures we already have
        if (signature && nativeSignature) {
            console.log("Submitting to cloud with signatures:", {
                message,
                signWallet: signature,
                signArnacon: nativeSignature
              });

          await submitToCloud(signature, nativeSignature);
        } else {
          throw new Error('Missing signatures for submission');
        }
      } else {
        // For non-iOS, request native signature and wait for response
        await submitToCloud(signature, nativeSignature);
        // The rest of the process is handled by the event listener
        // which will call submitToCloud once the native signature is received
      }
      
      
    } catch (err) {
      console.error('Error in submission process:', err);
      setIsSubmitting(false);
      setError('Error during verification. Please try again.');
    }
  };

  // Reset everything and go back to input
  const handleReset = () => {
    setStep('input');
    setEnsAddress('');
    setSignature('');
    setNativeSignature('');
    setNormalizedEns('');
    setMessage('');
    setIsLoadingMessage(false);
    setError('');
    setUserWalletAddress('');
  };

  // Debug effect to monitor step changes
  useEffect(() => {
    console.log('Current step:', step);
  }, [step]);

  // For display purposes - show the original input but use normalized behind the scenes
  const displayEns = ens || normalizedEns;

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
        maxWidth: UI_CONFIG.ENS_MAX_CARD_WIDTH,
        margin: '0 auto',
        padding: UI_CONFIG.ENS_CARD_PADDING,
        boxSizing: 'border-box'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          fontSize: 'calc(1rem + 1vw)', 
          wordBreak: 'break-word',
          margin: '0 0 15px 0'
        }}>Verify your ENS to use it as your calling identity.</h1>
        
        {step === 'input' && (
          <>
            <div className="disclaimer" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
              <p>You will be prompted to connect your wallet and sign a message to verify your ENS ownership.</p>
              <p>This process is secure and only used to verify that you own the ENS name.</p>
            </div>
            
            <div className="input-group">
              <input
                type="text"
                className="input-field"
                placeholder="Enter your ENS name (e.g., name.eth)"
                value={ens}
                onChange={(e) => setEns(e.target.value.toLowerCase())}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              {error && <p className="error-message" style={{ textAlign: 'center', wordBreak: 'break-word', fontSize: '0.9rem', color: '#ff4d4f' }}>{error}</p>}
            </div>
            
            <div className="action-buttons" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button 
                className="button secondary-button"
                onClick={() => handleNavigate('/')}
                disabled={isNavigating}
                style={{ fontSize: '0.9rem', padding: '8px 15px' }}
              >
                Back
              </button>
              
              <button 
                className="button primary-button"
                onClick={handleSubmit}
                style={{ fontSize: '0.9rem', padding: '8px 15px' }}
              >
                Verify
              </button>
            </div>
          </>
        )}
        
        {!isIOS && step === 'resolving' && (
          <div className="loading-state" style={{ textAlign: 'center' }}>
            <VerificationAnimation 
              status="loading"
              message="Resolving ENS name..."
            />
          </div>
        )}
        
        {!isIOS && step === 'connect' && (
          <>
            <div className="info-message" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
              <p>ENS name <strong style={{ color: '#4CAF50', wordBreak: 'break-word' }}>{displayEns}</strong> resolved to address:</p>
              <p className="address" style={{ 
                wordBreak: 'break-all', 
                fontSize: '0.8rem', 
                background: '#1E2A3A', 
                padding: '8px', 
                borderRadius: '5px',
                margin: '10px 0'
              }}>{ensAddress}</p>
              <p>Please connect the wallet that owns this ENS name to verify ownership</p>
            </div>
            
            <div className="wallet-connect-container" style={{ 
              textAlign: 'center',
              transform: 'scale(0.9)',
              margin: '-10px 0'
            }}>
              <WalletConnectButton onSuccess={onWalletConnected} />
            </div>
            
            {mainWalletAddress && (
              <div className="connected-wallet" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                <p>Wallet connected:</p>
                <p className="address" style={{ 
                  wordBreak: 'break-all', 
                  fontSize: '0.8rem', 
                  background: '#1E2A3A', 
                  padding: '8px', 
                  borderRadius: '5px',
                  margin: '10px 0'
                }}>{mainWalletAddress}</p>
                <div className="action-buttons" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button 
                    className="button secondary-button"
                    onClick={handleReset}
                    style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                  >
                    Cancel
                  </button>
                  
                  <button 
                    className="button primary-button"
                    onClick={verifyWalletAddress}
                    style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                  >
                    Verify Wallet
                  </button>
                </div>
              </div>
            )}
            
            {error && <p className="error-message" style={{ textAlign: 'center', wordBreak: 'break-word', fontSize: '0.9rem', color: '#ff4d4f' }}>{error}</p>}
          </>
        )}
        
        {!isIOS && step === 'ready-to-sign' && (
          <>
            <div className="info-message" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
              <p>✅ Wallet Connected Successfully!</p>
              <p>Your wallet address <span className="address" style={{ wordBreak: 'break-all', fontSize: '0.8rem', display: 'inline-block', maxWidth: '100%' }}>{userWalletAddress}</span> matches the ENS owner address.</p>
              <p>Next, you'll need to sign a message to authenticate your ownership of this ENS name.</p>
              
              {isLoadingMessage ? (
                <div className="loading-state" style={{ textAlign: 'center', margin: '15px 0' }}>
                  <VerificationAnimation 
                    status="loading"
                    message="Fetching verification message..."
                  />
                </div>
              ) : (
                <div className="message-box" style={{ 
                  background: '#1E2A3A', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  margin: '15px 0',
                  border: '1px solid #3498db',
                  wordBreak: 'break-word'
                }}>
                  <p style={{ marginBottom: '8px', fontSize: '0.85rem' }}>You are about to sign the following message:</p>
                  <p style={{ 
                    background: '#2C3E50', 
                    padding: '10px', 
                    borderRadius: '5px', 
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    wordBreak: 'break-word',
                    lineHeight: '1.3'
                  }}>{message || 'Loading message...'}</p>
                </div>
              )}
              {error && <p className="error-message" style={{ textAlign: 'center', wordBreak: 'break-word', fontSize: '0.9rem', color: '#ff4d4f' }}>{error}</p>}
            </div>
            
            <div className="action-buttons" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button 
                className="button secondary-button"
                onClick={handleReset}
                style={{ fontSize: '0.9rem', padding: '8px 15px' }}
              >
                Cancel
              </button>
              
              <button 
                className="button primary-button"
                onClick={handleSign}
                disabled={isLoadingMessage || !message}
                style={{ 
                  fontSize: '0.9rem', 
                  padding: '8px 15px',
                  opacity: (isLoadingMessage || !message) ? 0.6 : 1,
                  cursor: (isLoadingMessage || !message) ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoadingMessage ? 'Loading...' : 'Sign Message'}
              </button>
            </div>
          </>
        )}
        
        {!isIOS && step === 'signing' && (
          <div className="loading-state" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            <VerificationAnimation 
              status="loading"
              message="Please check your wallet to sign the message..."
            />
            <p className="secondary-text">Do not close this window.</p>
            <div style={{ 
              transform: 'scale(0.9)',
              margin: '-10px 0'
            }}>
              <WalletConnectButton 
                onSuccess={onWalletConnected} 
                message={message}
                signing={true}
                onMessageSigned={handleMessageSigned}
              />
            </div>
          </div>
        )}
        
        {isIOS && step === 'pending' && (
          <div className="loading-state" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            <VerificationAnimation 
              status="loading"
              message="Connecting to your wallet..."
            />
            <p className="secondary-text">Please check your wallet to complete the verification.</p>
            
            <div className="action-buttons" style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                className="button secondary-button"
                onClick={handleReset}
                style={{ fontSize: '0.9rem', padding: '8px 15px' }}
              >
                Cancel
              </button>
              
              {isSubmitting && (
                <p className="timeout-message" style={{ marginLeft: '10px', fontSize: '0.8rem' }}>
                  This is taking longer than expected. You can cancel and try again if needed.
                </p>
              )}
            </div>
          </div>
        )}
        
        {isIOS && step === 'ios-loading-message' && (
          <div className="loading-state" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            <VerificationAnimation 
              status="loading"
              message="Fetching verification message..."
            />
            <p className="secondary-text">Please wait while we prepare your verification message.</p>
          </div>
        )}
        
        {isIOS && step === 'ios-confirm' && (
          <>
            <div className="info-message" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
              <h2 style={{ textAlign: 'center', fontSize: 'calc(0.9rem + 0.3vw)', margin: '0 0 10px 0' }}>Confirm ENS Verification</h2>
              <p>Your ENS name <strong style={{ color: '#4CAF50', wordBreak: 'break-word' }}>{displayEns}</strong> has been resolved to:</p>
              <p className="address" style={{ 
                wordBreak: 'break-all', 
                fontSize: '0.8rem', 
                background: '#1E2A3A', 
                padding: '8px', 
                borderRadius: '5px',
                margin: '10px 0'
              }}>{ensAddress}</p>
              
              {isLoadingMessage ? (
                <div className="loading-state" style={{ textAlign: 'center', margin: '15px 0' }}>
                  <VerificationAnimation 
                    status="loading"
                    message="Fetching verification message..."
                  />
                </div>
              ) : (
                <div className="message-box" style={{ 
                  background: '#1E2A3A', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  margin: '15px 0',
                  border: '1px solid #3498db',
                  wordBreak: 'break-word'
                }}>
                  <p style={{ marginBottom: '8px', fontSize: '0.85rem' }}>You will be prompted to sign the following message with your wallet:</p>
                  <p style={{ 
                    background: '#2C3E50', 
                    padding: '10px', 
                    borderRadius: '5px', 
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    wordBreak: 'break-word',
                    lineHeight: '1.3'
                  }}>{message || 'Loading message...'}</p>
                </div>
              )}
              <p>This signature will verify that you are the owner of this ENS name.</p>
              
              {error && <p className="error-message" style={{ textAlign: 'center', wordBreak: 'break-word', fontSize: '0.9rem', color: '#ff4d4f' }}>{error}</p>}
            </div>
            
            <div className="action-buttons" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button 
                className="button secondary-button"
                onClick={() => handleNavigate('/')}
                style={{ fontSize: '0.9rem', padding: '8px 15px' }}
              >
                Cancel
              </button>
              
              <button 
                className="button primary-button"
                onClick={handleIOSProceed}
                disabled={isLoadingMessage || !message}
                style={{ 
                  fontSize: '0.9rem', 
                  padding: '8px 15px',
                  opacity: (isLoadingMessage || !message) ? 0.6 : 1,
                  cursor: (isLoadingMessage || !message) ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoadingMessage ? 'Loading...' : 'Sign Now'}
              </button>
            </div>
          </>
        )}
        
        {step === 'complete' && (
          <>
            <div className="success-message" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
              <h2 style={{ textAlign: 'center', fontSize: 'calc(0.9rem + 0.3vw)', margin: '0 0 10px 0' }}>Verifying Your ENS</h2>
              <div className="email-confirmation">
                <p>Your ENS name <strong style={{ color: '#4CAF50', wordBreak: 'break-word' }}>{displayEns}</strong> has been verified and linked to your wallet address:</p>
                <p className="wallet-address" style={{ 
                  wordBreak: 'break-all', 
                  fontSize: '0.8rem', 
                  background: '#1E2A3A', 
                  padding: '8px', 
                  borderRadius: '5px',
                  margin: '10px 0'
                }}>{userWalletAddress}</p>
              </div>
              
              <div className="action-buttons" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                <button 
                  className="button secondary-button"
                  onClick={() => handleNavigate('/')}
                  disabled={isSubmitting || isNavigating}
                  style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                >
                  Back
                </button>
                
                <button 
                  className={`button primary-button ${isSubmitting ? 'button-loading' : ''}`}
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                >
                  {isSubmitting ? 'Processing...' : 'Complete'}
                </button>
              </div>
            </div>
            
            {error && <p className="error-message" style={{ textAlign: 'center', wordBreak: 'break-word', fontSize: '0.9rem', color: '#ff4d4f' }}>{error}</p>}
          </>
        )}
        
        {step === 'done' && (
          <div className="completion-container" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            <VerificationAnimation 
              status="success"
              message="🎉 Registration Complete! 🎉"
            />
            
            <div className="product-info" style={{ textAlign: 'center' }}>
              <h3 style={{ textAlign: 'center', fontSize: 'calc(0.9rem + 0.2vw)', margin: '15px 0 10px' }}>What happens next?</h3>
              <ul style={{ textAlign: 'left', display: 'inline-block', paddingLeft: '20px', marginTop: '5px' }}>
                <li>Your Arnacon ENS identity is now activated</li>
                <li>You can now make and receive calls using your ENS name</li>
                <li>Your product package will be delivered soon</li>
                <li>Check your email for shipment updates and tracking information</li>
              </ul>
            </div>
            
            <div className="action-buttons completion-buttons" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
              <button 
                className="button primary-button pulse-button"
                onClick={() => handleNavigate('/')}
                disabled={isNavigating}
                style={{ fontSize: '0.9rem', padding: '8px 15px' }}
              >
                Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyENS;
