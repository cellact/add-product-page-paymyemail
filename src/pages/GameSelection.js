import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateUUID } from '../components/GenerateUUID';
import { API_ENDPOINTS, ACTIONS, REQUEST_CONFIG, UI_CONFIG } from '../utils/DefaultParameters';
import '../styles/Common.css';

const GameSelection = ({ walletAddress }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedGame, setSelectedGame] = useState('');

  // Available games list - can be expanded later
  const availableGames = [
    { id: 'snake', name: 'Snake', description: 'Classic snake game with modern twists' },
    // Add more games here as they become available
    // { id: 'tetris', name: 'Tetris', description: 'Block-stacking puzzle game' },
    // { id: 'pong', name: 'Pong', description: 'Classic arcade tennis game' },
  ];

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

  const handleGameSelection = (gameId) => {
    setSelectedGame(gameId);
  };

  const submitSelectedGame = async () => {
    if (!selectedGame) {
      setError('Please select a game first');
      return;
    }

    setIsLoading(true);
    setError('');
    
      const uuid_to_sign = generateUUID();
      const selectedGameObj = availableGames.find(game => game.id === selectedGame);
      
      // Send pending product to native with the selected game
      const nativeData = {
        action: ACTIONS.NEW_ITEM,
        body: { 
          item: `game_${selectedGame}`,
          package_type: "GAME",
          game_name: selectedGameObj.name,
          game_url: API_ENDPOINTS.SNAKE_URL,
          customer_id: uuid_to_sign
        }
      };

      // Continue with the flow immediately without waiting
      sendDataToNative(nativeData);
      setIsProcessing(true);
      setIsSuccess(true);
    
  };

  const renderGameSelectionButtons = () => {
    return (
      <div className="game-options" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginTop: '15px',
        width: '100%'
      }}>
        {availableGames.map((game) => (
          <button
            key={game.id}
            className={`button ${selectedGame === game.id ? 'primary-button' : 'secondary-button'}`}
            onClick={() => handleGameSelection(game.id)}
            style={{
              fontSize: '0.95rem',
              padding: '15px 20px',
              position: 'relative',
              border: selectedGame === game.id ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              width: '100%',
              margin: '0 auto',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '5px' }}>{game.name}</div>
                <div style={{ fontSize: '0.85rem', opacity: '0.8' }}>{game.description}</div>
              </div>
              {selectedGame === game.id && (
                <span style={{
                  color: 'var(--primary-color)',
                  fontSize: '1.2rem'
                }}>✓</span>
              )}
            </div>
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
          }}>{isSuccess ? 'Game Selected!' : 'Arnagame - Choose Your Game'}</h1>
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
              <p style={{ margin: '0 0 15px 0' }}>Select a game from our collection below:</p>
              {renderGameSelectionButtons()}
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
                onClick={submitSelectedGame}
                disabled={isLoading || !selectedGame}
                style={{ 
                  fontSize: '0.95rem', 
                  padding: '12px 24px',
                  width: '100%',
                  maxWidth: '300px'
                }}
              >
                {isLoading ? 'Processing...' : 'Submit Selection'}
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
                Back to Home
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
            }}>Game Selected!</h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <p style={{ fontSize: '1.1rem', margin: '0', fontWeight: '600', color: 'rgb(0, 200, 83)' }}>
                {availableGames.find(game => game.id === selectedGame)?.name}
              </p>
              <p style={{ fontSize: '0.95rem', margin: '15px 0 0 0' }}>Your game selection has been processed successfully.</p>
              <p style={{ fontSize: '0.95rem', margin: '0' }}>You'll receive a notification when your game is ready to play.</p>
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

export default GameSelection;
