import { NFTMintCard } from '@coinbase/onchainkit/nft';
import {
  NFTCollectionTitle,
  NFTMintButton,
} from '@coinbase/onchainkit/nft/mint';
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import { NostraTokenAddress, NostraTokenABI } from '../address-abi';

/**
 * useNFTData supplies metadata for the NFTMintCard.
 */
function useNFTData() {
  return {
    title: 'Nostra-Labs',
    imageUrl: './Nostra-Labs_Logo.svg', // Replace with your actual image URL
  };
}

/**
 * buildMintTransaction encodes a call to your smart contract's mint() function.
 * It returns a Promise that resolves to an array containing one call object,
 * where both "to" and "data" are typed as a hex string literal.
 */
async function buildMintTransaction(): Promise<{ to: `0x${string}`; data: `0x${string}` }[]> {
  if (!window.ethereum) {
    throw new Error("Please install MetaMask!");
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(NostraTokenAddress, NostraTokenABI, signer);
  
  // Encode the call to mint() (no parameters needed as per your contract)
  const data = contract.interface.encodeFunctionData("mint", []) as `0x${string}`;
  
  return [{ to: NostraTokenAddress as `0x${string}`, data }];
}

export default function NFTComponent() {
  const [isMinting, setIsMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // Check if a wallet is connected and set the userAddress.
  useEffect(() => {
    async function checkConnection() {
      if (window.ethereum) {
        const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
        } else {
          setUserAddress(null);
        }
      }
    }
    checkConnection();
  }, []);

  // Check if the user has already minted by querying their token balance.
  useEffect(() => {
    async function checkMinted() {
      if (!window.ethereum || !userAddress) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(NostraTokenAddress, NostraTokenABI, signer);
        const balance = await contract.balanceOf(userAddress);
        // If the balance is greater than zero, mark as minted.
        setMinted(ethers.getBigInt(balance) > BigInt(0));
      } catch (error) {
        console.error("Error checking minted status:", error);
      }
    }
    checkMinted();
  }, [userAddress, isMinting]);

  // handleMint is called when the mint button is clicked.
  async function handleMint() {
    if (!userAddress) return;
    setIsMinting(true);
    try {
      await buildMintTransaction();
      alert("Minted Successfully");
      // Mark as minted so the button is hidden.
      setMinted(true);
    } catch (error) {
      console.error("Minting failed:", error);
      alert("Minting failed. Check the console for details.");
    } finally {
      setIsMinting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5" style={{ width: '200px' }}>
      {!minted && (
        <NFTMintCard 
          contractAddress={NostraTokenAddress}
          useNFTData={useNFTData}
          buildMintTransaction={buildMintTransaction}
        >
          
          <NFTCollectionTitle />
          {/* Render the mint button only if the user hasn't minted */}
          
            <button onClick={handleMint} disabled={isMinting} >
              <NFTMintButton
                disabled={isMinting}
                label="Mint"
              />
            </button>
          
        </NFTMintCard>
      )}
    </div>
  );
}
