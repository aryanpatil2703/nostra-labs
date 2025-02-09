import { NFTMintCard } from '@coinbase/onchainkit/nft';
import { NFTCollectionTitle, NFTMintButton } from '@coinbase/onchainkit/nft/mint';
import { ethers, getBigInt } from 'ethers';
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
  const data = contract.interface.encodeFunctionData("mint", []) as `0x${string}`;
  return [{ to: NostraTokenAddress as `0x${string}`, data }];
}

/**
 * MintComponent renders an NFTMintCard with a custom Mint button.
 * When the user clicks the mint button, handleMint() is called which
 * sends the mint transaction using the connected wallet.
 *
 * Optionally, the parent can pass an onMintSuccess callback to be notified after a successful mint.
 */
export default function MintComponent({ onMintSuccess }: { onMintSuccess?: () => void } = {}) {
  const [isMinting, setIsMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // Check wallet connection on mount.
  useEffect(() => {
    async function checkConnection() {
      if (window.ethereum) {
        try {
          const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setUserAddress(accounts[0]);
          } else {
            setUserAddress(null);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    }
    checkConnection();

    if (window.ethereum && window.ethereum.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
        } else {
          setUserAddress(null);
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
 
  }, []);

  // Check if the user has minted by reading their token balance.
  useEffect(() => {
    async function checkMinted() {
      if (!window.ethereum || !userAddress) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(NostraTokenAddress, NostraTokenABI, signer);
        const balance = await contract.balanceOf(userAddress);
        // If the balance is greater than zero, mark as minted.
        setMinted(getBigInt(balance) > BigInt(0));
      } catch (error) {
        console.error("Error checking minted status:", error);
      }
    }
    checkMinted();
  }, [userAddress, isMinting]);

  // handleMint sends the mint transaction.
  async function handleMint() {
    if (!userAddress) return;
    setIsMinting(true);
    try {
      // Get the call data for the mint transaction.
      const [callData] = await buildMintTransaction();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      // Send the transaction using the call data.
      const tx = await signer.sendTransaction({ to: callData.to, data: callData.data });
      await tx.wait();
      alert("Minted Successfully");
      setMinted(true);
      if (onMintSuccess) onMintSuccess();
      // Reload the page to update the UI.
      window.location.reload();
      } catch (error) {
        console.error("Minting failed:", error);
        alert("Minting failed. Check the console for details.");
      } finally {
        setIsMinting(false);
      }
    }

  return (
    <div className="flex flex-col gap-5" style={{ width: '200px' }}>
      {/* Render the NFTMintCard only if tokens haven't been minted yet */}
      {!minted && (
        <NFTMintCard
          contractAddress={NostraTokenAddress}
          useNFTData={useNFTData}
          buildMintTransaction={buildMintTransaction}
        >
          <NFTCollectionTitle />
          <button onClick={handleMint} disabled={isMinting}>
            <NFTMintButton disabled={isMinting} label="Mint" />
          </button>
        </NFTMintCard>
      )}
    </div>
  );
}
