import React, { useEffect, useState } from 'react';
import { createAppKit, useAppKitProvider, useAppKitAccount } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { arbitrum, mainnet } from '@reown/appkit/networks'

// 1. Get projectId
const projectId = '2217f1bdaf9856078d15617a25f6bb93'

// 2. Create a metadata object
const metadata = {
  name: 'Arnacon',
  description: 'Web3 Telecom Protocol',
  url: 'https://arnacon-website-dabatmancoders-projects.vercel.app/',
  icons: ['https://arnacon-website-dabatmancoders-projects.vercel.app/favicon.ico']
}

// 3. Set the networks
const networks = [arbitrum, mainnet]

// 4. Initialize reown AppKit
createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true
  }
})

export default function WalletConnectButton({ 
  onSuccess, 
  message, 
  signing = false, 
  onMessageSigned 
}) {
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle wallet connection
  useEffect(() => {
    if (isConnected && address) {
      console.log('Wallet connected via AppKit:', address)
      if (onSuccess) {
        onSuccess(address)
      }
    }
  }, [isConnected, address, onSuccess])

  // Handle message signing - completely separate from connection handling
  useEffect(() => {
    // Skip if conditions aren't met
    if (!signing || !message || !isConnected || !address || !walletProvider || isProcessing) {
      return;
    }

    // Flag to prevent multiple signatures
    let didSign = false;

    async function signMessage() {
      if (didSign) return;
      
      try {
        setIsProcessing(true);
        didSign = true;
        console.log('Signing message:', message);
        
        const signature = await walletProvider.request({
          method: 'personal_sign',
          params: [message, address]
        });
        
        console.log('Signature received:', signature);
        
        // Directly call the callback with the signature
        if (onMessageSigned) {
          console.log('Calling onMessageSigned with signature:', signature.substring(0, 10) + '...');
          onMessageSigned(signature);
        }
      } catch (error) {
        console.error('Error signing message:', error);
      } finally {
        setIsProcessing(false);
      }
    }

    // Execute immediately
    signMessage();
  }, [signing, message, isConnected, address, walletProvider, onMessageSigned, isProcessing]);

  // Just render the button if not in signing mode
  if (!signing) {
    return <appkit-button />;
  }
  
  // For signing mode, return minimal UI
  return null;
}
