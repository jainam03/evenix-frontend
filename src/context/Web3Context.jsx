import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { getContracts } from '../utils/contract';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const getMobileProvider = () => {
  if (window.ethereum) {
    return window.ethereum;
  }
  
  if (window.web3?.currentProvider) {
    return window.web3.currentProvider;
  }

  return null;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [contracts, setContracts] = useState(null);
  const [network, setNetwork] = useState(null);

  const connectWallet = async () => {
    const mobile = isMobile();
    const ethereumProvider = mobile ? getMobileProvider() : window.ethereum;

    if (!ethereumProvider) {
      if (mobile) {
        // For mobile users, provide deep link to MetaMask
        const dappUrl = window.location.href;
        const metamaskAppDeepLink = `https://metamask.app.link/dapp/${window.location.host}`;
        
        toast.error(
          <div>
            <p>Please open this dApp in the MetaMask mobile browser.</p>
            <a href={metamaskAppDeepLink} className="text-blue-500 underline mt-2 block">
              Open in MetaMask
            </a>
          </div>,
          { duration: 8000 }
        );
        return;
      } else {
        toast.error('Please install MetaMask to use this dApp');
        return;
      }
    }

    try {
      setIsConnecting(true);
      const browserProvider = new ethers.BrowserProvider(ethereumProvider);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const currentSigner = await browserProvider.getSigner();
      const currentNetwork = await browserProvider.getNetwork();
      
      setProvider(browserProvider);
      setSigner(currentSigner);
      setAccount(accounts[0]);
      setNetwork(currentNetwork);

      // Initialize contracts with the signer
      const initializedContracts = await getContracts(currentSigner);
      if (initializedContracts) {
        console.log('Initialized contracts in Web3Context:', {
          eventFactoryTarget: initializedContracts.eventFactory?.target,
          networkId: currentNetwork.chainId
        });
        setContracts(initializedContracts);
      } else {
        console.error('Failed to initialize contracts in Web3Context');
        toast.error('Failed to initialize contracts. Check console.');
      }

      // Listen for account changes
      window.ethereum.on('accountsChanged', async (changedAccounts) => {
        const newSigner = await browserProvider.getSigner();
        setAccount(changedAccounts[0]);
        setSigner(newSigner);
        const updatedContracts = await getContracts(newSigner);
        setContracts(updatedContracts);
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', async () => {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await newProvider.getSigner();
        const newNetwork = await newProvider.getNetwork();
        
        setProvider(newProvider);
        setSigner(newSigner);
        setNetwork(newNetwork);
        const reinitializedContracts = await getContracts(newSigner);
        setContracts(reinitializedContracts);
        
        window.location.reload();
      });

      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet. Check console for details.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContracts(null);
    setNetwork(null);
  };

  useEffect(() => {
    // Check if wallet is already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            console.log('Wallet previously connected, account:', accounts[0]);
          }
        })
        .catch(console.error);
    }
  }, []);

  const value = {
    account,
    provider,
    signer,
    contracts,
    network,
    isConnecting,
    connectWallet,
    disconnectWallet,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};