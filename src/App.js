import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import VerifyEmail from './pages/VerifyEmail';
import VerifyENS from './pages/VerifyENS';
import BuyProduct from './pages/BuyProduct';
import HomePage from './pages/HomePage';
import PrivateProduct from './pages/PrivateProduct';
import VerifyBlueSky from './pages/VerifyBlueSky';
import VerifySolana from './pages/VerifySolana';
// import GameSelection from './pages/GameSelection';

function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const [showSolanaVerification, setShowSolanaVerification] = useState(false);

  useEffect(() => {
    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const addressParam = urlParams.get('user_address');
    const solanaMWA = urlParams.get('solanaMWA');
    
    // Handle wallet address
    let finalAddress;
    if (addressParam) {
      finalAddress = addressParam;
      setWalletAddress(addressParam);
    } else {
      // Fallback to a mock address if not provided in URL
      finalAddress = '0x22b2db99422c129d1abc3cb1835c4a381632541f';
      setWalletAddress(finalAddress);
    }
    
    // Handle Solana MWA parameter
    if (solanaMWA === 'true') {
      setShowSolanaVerification(true);
    }
    
    console.log("Wallet Address:", finalAddress);
    console.log("Solana MWA enabled:", solanaMWA === 'true');
  }, []);

  return (
    <div className="App">
      <Router basename="/add-product-page-paymyemail">
        <Routes>
          <Route path="/" element={<HomePage walletAddress={walletAddress} showSolanaVerification={showSolanaVerification} />} />
          <Route path="/verify-email" element={<VerifyEmail walletAddress={walletAddress} />} />
          <Route path="/verify-ens" element={<VerifyENS walletAddress={walletAddress} />} />
          <Route path="/verify-bluesky" element={<VerifyBlueSky walletAddress={walletAddress} />} />
          {showSolanaVerification && (
            <Route path="/verify-solana" element={<VerifySolana walletAddress={walletAddress} />} />
          )}
          <Route path="/buy-product" element={<BuyProduct walletAddress={walletAddress} />} />
          <Route path="/private-product" element={<PrivateProduct walletAddress={walletAddress} />} />
          {/* <Route path="/game-selection" element={<GameSelection walletAddress={walletAddress} />} /> */}
        </Routes>
      </Router>
    </div>
  );
}

class Controller {
  receiveData(_data) {
    console.log("Received data:", _data);
    try {
      const data = JSON.parse(_data);
      console.log("Parsed data:", data);
      
      // Handle different action types with appropriate dispatching
      if (data.action === 'verified-ens' || data.action === 'signed-data' || data.action === 'data-retrieved' ) {
          console.log(`[CONTROLLER] Dispatching ${data.action} event with data:`, data);
          console.log(`[CONTROLLER] Event detail will be:`, data);
          document.dispatchEvent(new CustomEvent('onDataReceived', { detail: data }));
          return; // Exit after dispatching
      } 
      
      // Fall back to legacy handling if needed
      if (data.body && data.body.xsign) {
        console.log("Dispatching legacy xsign event");
        document.dispatchEvent(new CustomEvent('onDataReceived', { detail: data.body.xsign }));
      } else {
        // If no recognized format, dispatch the entire data
        console.log("Dispatching raw data event");
        document.dispatchEvent(new CustomEvent('onDataReceived', { detail: data }));
      }
    } catch (error) {
      console.error("Error processing data in controller:", error);
      // For non-JSON data, dispatch as is
      document.dispatchEvent(new CustomEvent('onDataReceived', { detail: _data }));
    }
  }
  
  sendMessageToNativeApp(jsonData) {
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeHandler) {
        window.webkit.messageHandlers.nativeHandler.postMessage(JSON.stringify(jsonData));
    } else if (window.AndroidBridge && window.AndroidBridge.processAction) {
        console.log('Sending to AndroidBridge:', JSON.stringify(jsonData));
        window.AndroidBridge.processAction(JSON.stringify(jsonData));
    } else {
        console.log("Native interface not available");
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  window.top.controller = new Controller();
  
  // Add global debug listener for onDataReceived events
  document.addEventListener('onDataReceived', function(event) {
    console.log('[GLOBAL DEBUG] onDataReceived event caught:', event);
    console.log('[GLOBAL DEBUG] Event detail:', event.detail);
    console.log('[GLOBAL DEBUG] Event detail type:', typeof event.detail);
  });
});

export default App;
