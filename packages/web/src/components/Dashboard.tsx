import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { formatEther, parseUnits, getBigInt } from 'ethers';
import { Button } from '@/components/ui/button'; // Your UI button component (or use OnchainKit’s if available)
import { NostraTokenAddress, StakingContractAddress, NostraTokenABI, StakingContractABI } from './address-abi';
import { WalletComponents } from '@/components/buttons/walletConnect'; // Your wallet connection components
import { NFTMintCard } from '@coinbase/onchainkit/nft'; // Import the NFTMintCard component
import AgentRoute from '@/routes/chat';
import MintComponent from './buttons/mint';
import '@coinbase/onchainkit/styles.css';
import  StakeUnstake  from './StakeUnstake';

export default function Dashboard() {
  // Local state for wallet, balances, and loading indicators
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stakedBalance, setStakedBalance] = useState<ethers.BigNumberish>(BigInt(0));
  const [availableBalance, setAvailableBalance] = useState<ethers.BigNumberish>(BigInt(0));
  const [tokenBalance, setTokenBalance] = useState<ethers.BigNumberish>(BigInt(0));
  const [isMinting, setIsMinting] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);

  // Initialize ethers provider (assumes MetaMask or similar is installed)
  const provider = new ethers.BrowserProvider(window.ethereum);

  // Check if wallet is connected
  useEffect(() => {
    async function checkConnection() {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setIsConnected(false);
          setUserAddress(null);
        }
      }
    }
    checkConnection();
  }, []);

  // Fetch balances from both contracts
  async function fetchBalances() {
    if (!userAddress) return;
    try {
      const signer = await provider.getSigner();

      // Get NostraToken balance (minted tokens)
      const nostraTokenContract = new ethers.Contract(NostraTokenAddress, NostraTokenABI, signer);
      const tokenBal: ethers.BigNumberish = await nostraTokenContract.balanceOf(userAddress);
      setTokenBalance(tokenBal);

      // Get staking balances (assumes the StakingContract's players mapping returns an object like: { availableStakes, unavailableStakes })
      const stakingContract = new ethers.Contract(StakingContractAddress, StakingContractABI, signer);
      const playerData = await stakingContract.players(userAddress);
      setAvailableBalance(playerData.availableStakes);
      setStakedBalance(playerData.unavailableStakes);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  }

  // Re-fetch balances after actions (mint, stake, unstake)
  useEffect(() => {
    if (userAddress) {
      fetchBalances();
    }
  }, [userAddress, isMinting, isStaking, isUnstaking]);

  // --- Minting: Interact with NostraToken.sol ---
  

  // --- Staking: Interact with the StakingContract ---
  

  // Determine which UI to show based on staked balance:
  // If stakedBalance > 0, show the Mrs. Beauty Chat Card; otherwise, show Mint & Stake buttons.
  const showChatCard = ethers.getBigInt(stakedBalance) > BigInt(0);

  return (
    <div className="min-h-screen p-4">
      {/* Only render wallet-dependent UI when wallet is connected */}
      
        <>
          {/* --- Top Bar: Wallet Connection Button --- */}
          <div className="items-center justify-center gap-4">
            <div className="fixed top-8 right-6 p-0 z-0 text-right">
              <WalletComponents />
            </div>
          </div>

          {/* --- Always-Visible Information --- */}
          <div className="absolute top-48 right-10 text-right rounded border-l-4 p-4
            bg-black shadow-lg text-center border border-gray-300">
            <div className="">
              <p>Token Balance: {formatEther(tokenBalance)} NST</p>
              <p>Available to Unstake: {formatEther(availableBalance)} NST</p>
            </div>
          </div>

          {/* --- Main Content: Either Mint/Stake or Chat Card --- */}
          <div className="mt-48 flex flex-col items-center gap-8">
            {!showChatCard ? (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-4 rounded-lg">
                {/* Mint Button */}
               
                  <div>
                    <MintComponent />
                  </div>
                
                {/* Stake Button */}
                  <div>
                    <StakeUnstake />
                  </div>
              </div>
            ) : (
              <div className="w-full max-w-lg border p-8 rounded-lg shadow-xl bg-white">
                {/* Mrs. Beauty Chat Card */}
                <h2 className="text-2xl font-bold mb-4 text-center">MrsBeauty Chat</h2>
                <p className="mb-4 text-center text-xl">
                  Your Staked Balance: {formatEther(stakedBalance)} NST
                </p>
                {/* Render the chat interface */}
                <AgentRoute />
                <div className="border-t pt-4 mt-4">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="w-full border p-3 rounded-lg text-xl"
                  />
                  <Button className="mt-4 w-full h-14 text-xl rounded-lg bg-purple-500 hover:bg-purple-600 text-white">
                    Send
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* --- Bottom-Left: Connected Wallet Indicator --- */}
          {/* <div className="fixed bottom-4 left-4 bg-gray-200 p-3 rounded shadow text-lg">
            Connected: {userAddress}
          </div> */}
        </>
      
    </div>
  );
}