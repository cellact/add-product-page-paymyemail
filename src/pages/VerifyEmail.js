import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FIREBASE_CONFIG, API_ENDPOINTS, ACTIONS } from '../utils/DefaultParameters';
import '../styles/Common.css';

// Import Firebase modules - you may need to adjust import paths based on your setup
import { initializeApp } from 'firebase/app';
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth';

const VerifyEmail = ({ walletAddress }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('input'); // input, success
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isAddingAnother, setIsAddingAnother] = useState(false);
  const navigate = useNavigate();

  // Firebase configuration
  const firebaseConfig = {
    apiKey: FIREBASE_CONFIG.API_KEY,
    authDomain: FIREBASE_CONFIG.AUTH_DOMAIN,
    projectId: FIREBASE_CONFIG.PROJECT_ID,
  };

  // Initialize Firebase
  useEffect(() => {
    initializeApp(firebaseConfig);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate if string is an email
  const isEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };


  // Handle email verification process
  const handleEmail = async (emailAddress) => {
    setIsLoading(true);
    setError('');
    
    try {

        // Set up action code settings for Firebase email link
      const actionCodeSettings = {
        url: `${API_ENDPOINTS.EMAIL_AUTHENTICATOR}?walletAddress=${walletAddress || ''}&email=${emailAddress}`,
        handleCodeInApp: true
      };

      console.log("Action Code Settings:", actionCodeSettings);

      // Get Firebase auth instance
      const auth = getAuth();
      
      // FIRST: Create PENDING product in native app (so Flutter can start polling)
      if (window.Android && window.Android.installProduct) {
        const productData = {
          item: emailAddress,
          packageType: "EMAIL",
          url: "https://orange-acceptable-mouse-528.mypinata.cloud/ipfs/bafkreickhtxddhcpz72n6yomsbbbdufihzhvsb3v75oj7xub32shmz5uwu",
          uuid: Date.now().toString(),
          timestamp: Math.floor(Date.now() / 1000),
          label: emailAddress
        };
        
        console.log('Creating PENDING email product:', emailAddress);
        window.Android.installProduct(JSON.stringify(productData));
      }
      
      // THEN: Send sign-in link to email
      await sendSignInLinkToEmail(auth, emailAddress, actionCodeSettings);
      console.log('Email sent successfully');
      
      // Move to success state
      setStep('success');
      
      // Send notification to native app if available (mobile integration)
      sendDataToNative({
        action: ACTIONS.EMAIL_SENT,
        body: {}
      });
      
    } catch (err) {
      console.error('Error sending verification email:', err);
      setError('Failed to send verification email. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Handle form submission
  const handleSubmit = async () => {
    // Validate email
    if (!isEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Process the email
    await handleEmail(email);
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

  // Handle add another email action
  const handleAddAnother = () => {
    if (isAddingAnother) return;
    
    setIsAddingAnother(true);
    setEmail('');
    setError('');
    setStep('input');
    
    // Reset the flag after a short delay to prevent double clicks
    setTimeout(() => {
      setIsAddingAnother(false);
    }, 1000);
  };

  return (
    <div className="container">
      <div className="card">
        {step === 'input' && (
          <>
            <h1 style={{ textAlign: 'center' }}>Verify your email to use it as your calling identity.</h1>
            
            <div className="input-group">
              <input
                type="text"
                className="input-field"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                disabled={isLoading}
              />
              {error && <p className="error-message" style={{ textAlign: 'center' }}>{error}</p>}
            </div>
            
            <div className="action-buttons" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button 
                className="button secondary-button"
                onClick={handleBack}
                disabled={isLoading || isNavigating}
              >
                Back
              </button>
              
              <button 
                className={`button primary-button ${isLoading ? 'button-loading' : ''}`}
                onClick={handleSubmit}
                disabled={isLoading || !email || !isEmail(email)}
              >
                {isLoading ? 'Sending...' : 'Verify'}
              </button>
            </div>
          </>
        )}
        
        {step === 'success' && (
          <>
            <div className="success-message" style={{ textAlign: 'center' }}>
              <h2 style={{ textAlign: 'center' }}>Verification Email Sent!</h2>
              <div className="email-confirmation">
                <p>A verification email has been sent to <strong>{email}</strong>.</p>
                <p>Please check your inbox and click the verification link to complete the process.</p>
                <p>If you don't see the email, check your spam folder or try again.</p>
              </div>
            </div>
            
            <div className="next-steps" style={{ textAlign: 'center' }}>
              <h3 style={{ textAlign: 'center' }}>What's next?</h3>
              <p>After verification, you can start using your email as your calling identity with Arnacon.</p>
            </div>
            
            <div className="action-buttons" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button 
                className="button primary-button"
                onClick={handleBack}
                disabled={isNavigating}
              >
                Return to Home
              </button>
              
              <button 
                className="button secondary-button"
                onClick={handleAddAnother}
                disabled={isAddingAnother}
              >
                Add Another Email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
