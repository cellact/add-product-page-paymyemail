import { ethers } from 'ethers';
import { SMART_CONTRACT_CONFIG } from './DefaultParameters';

// Track active calls to prevent multiple simultaneous calls
const activeCalls = new Map();

/**
 * Sleep function for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Attempts to fetch message from a single RPC provider
 * @param {string} rpcUrl - The RPC URL to try
 * @param {string} walletAddress - The wallet address
 * @param {Object} config - The contract configuration
 * @returns {Promise<string>} - The message from the contract
 */
const tryFetchFromProvider = async (rpcUrl, walletAddress, config) => {
  const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
    polling: false,
    staticNetwork: true
  });
  
  const contract = new ethers.Contract(
    config.CONTRACT_ADDRESS,
    config.ABI,
    provider
  );
  
  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), config.TIMEOUT || 10000);
  });
  
  // Race between the contract call and timeout
  const message = await Promise.race([
    contract.getMessageToSign(walletAddress),
    timeoutPromise
  ]);
  
  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new Error('Invalid message returned from contract');
  }
  
  return message.trim();
};

/**
 * Fetches the message to sign from the smart contract on Polygon mainnet
 * with proper retry logic, delays, and call throttling
 * @param {string} walletAddress - The wallet address to get the message for
 * @returns {Promise<string>} - The message to sign from the smart contract
 * @throws {Error} - If the contract call fails
 */
export const fetchMessageFromContract = async (walletAddress) => {
  try {
    // Validate wallet address
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address provided');
    }

    // Check if there's already an active call for this wallet address
    if (activeCalls.has(walletAddress)) {
      console.log('Call already in progress for wallet:', walletAddress);
      return activeCalls.get(walletAddress);
    }

    // Get Polygon mainnet configuration
    const config = SMART_CONTRACT_CONFIG.POLYGON_MAINNET;
    const rpcUrls = config.RPC_URLS;
    
    // Create a promise for this call
    const callPromise = performFetchWithRetry(walletAddress, config, rpcUrls);
    
    // Store the promise in active calls
    activeCalls.set(walletAddress, callPromise);
    
    try {
      const result = await callPromise;
      return result;
    } finally {
      // Remove from active calls when done
      activeCalls.delete(walletAddress);
    }
    
  } catch (error) {
    console.error('Error fetching message from contract:', error);
    
    // Provide more specific error messages
    if (error.message.includes('rate limit') || error.message.includes('Too many requests')) {
      throw new Error('Rate limit exceeded: All RPC providers are currently rate-limited. Please try again in a few minutes.');
    } else if (error.message.includes('Request timeout') || error.code === 'TIMEOUT') {
      throw new Error('Request timeout: The network is slow or unresponsive. Please try again.');
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network error: Unable to connect to Polygon network. Please check your internet connection and try again.');
    } else if (error.code === 'CALL_EXCEPTION') {
      throw new Error('Contract call failed: The smart contract may not be responding. Please try again later.');
    } else if (error.message.includes('Invalid wallet address')) {
      throw new Error('Invalid wallet address provided');
    } else if (error.message.includes('Invalid message returned')) {
      throw new Error('The smart contract returned an invalid message. Please try again.');
    } else if (error.message.includes('All RPC providers failed')) {
      throw new Error('All RPC providers are currently unavailable. Please try again later.');
    } else {
      throw new Error(`Failed to fetch message from contract: ${error.message}`);
    }
  }
};

/**
 * Performs the actual fetch with retry logic across multiple providers
 * @param {string} walletAddress - The wallet address
 * @param {Object} config - The contract configuration
 * @param {string[]} rpcUrls - Array of RPC URLs to try
 * @returns {Promise<string>} - The message from the contract
 */
const performFetchWithRetry = async (walletAddress, config, rpcUrls) => {
  let lastError = null;
  
  // Try each RPC provider with retry logic
  for (let i = 0; i < rpcUrls.length; i++) {
    const rpcUrl = rpcUrls[i];
    
    try {
      console.log(`Attempting to fetch message from RPC provider ${i + 1}/${rpcUrls.length}: ${rpcUrl}`);
      
      // Try up to MAX_RETRIES times per provider
      const maxRetries = config.MAX_RETRIES || 3;
      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          const message = await tryFetchFromProvider(rpcUrl, walletAddress, config);
          console.log(`Successfully fetched message from contract via ${rpcUrl}:`, message);
          return message;
        } catch (error) {
          console.warn(`Attempt ${retry + 1}/${maxRetries} failed for ${rpcUrl}:`, error.message);
          
          // If it's a rate limit error, don't retry immediately
          if (error.message.includes('rate limit') || error.message.includes('Too many requests')) {
            console.log('Rate limit detected, skipping retries for this provider');
            break;
          }
          
          // Wait before retry (only if not the last attempt)
          if (retry < maxRetries - 1) {
            const delay = config.RETRY_DELAY || 5000; // 5 seconds delay
            console.log(`Waiting ${delay}ms before retry...`);
            await sleep(delay);
          }
        }
      }
    } catch (error) {
      console.error(`Provider ${rpcUrl} failed completely:`, error.message);
      lastError = error;
      
      // If it's a rate limit error, try next provider immediately
      if (error.message.includes('rate limit') || error.message.includes('Too many requests')) {
        console.log('Rate limit detected, trying next provider...');
        continue;
      }
      
      // Wait a bit before trying next provider (only if not the last provider)
      if (i < rpcUrls.length - 1) {
        console.log('Waiting 2 seconds before trying next provider...');
        await sleep(2000);
      }
    }
  }
  
  // If all providers failed, throw the last error
  throw lastError || new Error('All RPC providers failed');
};

/**
 * Validates if the current network is Polygon mainnet
 * @param {number} chainId - The current chain ID
 * @returns {boolean} - True if on Polygon mainnet
 */
export const isPolygonMainnet = (chainId) => {
  return chainId === SMART_CONTRACT_CONFIG.POLYGON_MAINNET.CHAIN_ID;
};

/**
 * Gets the Polygon mainnet configuration
 * @returns {Object} - The Polygon mainnet configuration
 */
export const getPolygonConfig = () => {
  return SMART_CONTRACT_CONFIG.POLYGON_MAINNET;
};

/**
 * Clears any active calls (useful for cleanup)
 */
export const clearActiveCalls = () => {
  activeCalls.clear();
};