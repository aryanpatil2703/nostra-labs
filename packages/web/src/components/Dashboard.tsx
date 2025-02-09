import React, { useState, useEffect } from 'react';
import { ethers, formatEther, getBigInt } from 'ethers';
import { WalletComponents } from '@/components/buttons/walletConnect';
import MintComponent from './buttons/mint';       // Use your final mint.tsx component as is.
import StakeUnstake from './StakeUnstake';         // Use your final stakeunstake.tsx component as is.
import AgentRoute from '@/routes/chat';            // Chat card component
import '@coinbase/onchainkit/styles.css';
import { 
  NostraTokenAddress, 
  NostraTokenABI, 
  StakingContractAddress, 
  StakingContractABI 
} from './address-abi';
import { useQuery } from "@tanstack/react-query";
import { Cog } from "lucide-react";
import PageTitle from "@/components/page-title";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { NavLink } from "react-router";
import { UUID } from "@elizaos/core";
import { formatAgentName } from "@/lib/utils";


export default function Dashboard() {
  // State for wallet connection and balances.
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<ethers.BigNumberish>(BigInt(0));
  const [stakedBalance, setStakedBalance] = useState<ethers.BigNumberish>(BigInt(0));
  // Consider the user minted if their token balance > 0.
  const [minted, setMinted] = useState(false);

  // Create an ethers provider (assumes a wallet extension is installed)
  const provider = new ethers.BrowserProvider(window.ethereum);

  const query = useQuery({
        queryKey: ["agents"],
        queryFn: () => apiClient.getAgents(),
        refetchInterval: 5_000
    });

    const agents = query?.data?.agents;

  // Check for initial wallet connection.
  useEffect(() => {
    async function checkConnection() {
      if (window.ethereum) {
        try {
          const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setUserAddress(accounts[0]);
            setIsConnected(true);
          } else {
            setUserAddress(null);
            setIsConnected(false);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    }
    checkConnection();
  }, []);

  // Listen for account changes so the Dashboard updates immediately.
  useEffect(() => {
    if (!window.ethereum || !window.ethereum.on) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
        setIsConnected(true);
      } else {
        setUserAddress(null);
        setIsConnected(false);
      }
    };
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  // Fetch balances from the token contract and staking contract.
  async function fetchBalances() {
    if (!userAddress) return;
    try {
      const signer = await provider.getSigner();

      // Get token balance.
      const tokenContract = new ethers.Contract(NostraTokenAddress, NostraTokenABI, signer);
      const balance = await tokenContract.balanceOf(userAddress);
      setTokenBalance(balance);
      setMinted(getBigInt(balance) > BigInt(0));

      // Get staked balance (assumed stored in players[user].unavailableStakes).
      const stakingContract = new ethers.Contract(StakingContractAddress, StakingContractABI, signer);
      const playerData = await stakingContract.players(userAddress);
      setStakedBalance(playerData.unavailableStakes);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  }

  // Poll for balances every 5 seconds.
  useEffect(() => {
    if (!userAddress) return;
    const interval = setInterval(() => {
      fetchBalances();
    }, 5000);
    return () => clearInterval(interval);
  }, [userAddress]);

  // Update balances when userAddress or minted state changes.
  useEffect(() => {
    if (userAddress) {
      fetchBalances();
    }
  }, [userAddress, minted]);

  // Determine which UI to show based on staked balance.
  const showChatCard = getBigInt(stakedBalance) > BigInt(0);

  return (
    <div className="min-h-screen p-4 relative">
      {/* Always display WalletComponents in the top-right */}
      <div className="fixed top-8 right-6">
        <WalletComponents />
      </div>

      {/* Main Content */}
      <div className="mt-24 flex flex-col items-center gap-8">
        {isConnected ? (
          showChatCard ? (
            // If staked balance > 0, show the chat card.
            <div className="w-full max-w-lg border p-8 rounded-lg shadow-xl bg-white">
              <h2 className="text-2xl font-bold mb-4 text-center">MrsBeauty Chat</h2>
              <p className="mb-4 text-center text-xl">
                Your Staked Balance: {formatEther(stakedBalance)} NST
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {agents?.map((agent: { id: UUID; name: string }) => (
                    <Card key={agent.id}>
                        <CardHeader>
                            <CardTitle>{agent?.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md bg-muted aspect-square w-full grid place-items-center">
                                <div className="text-6xl font-bold uppercase">
                                    {formatAgentName(agent?.name)}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div className="flex items-center gap-4 w-full">
                                <NavLink
                                    to={`/chat/${agent.id}`}
                                    className="w-full grow"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full grow"
                                    >
                                        Chat
                                    </Button>
                                </NavLink>
                                <NavLink
                                    to={`/settings/${agent.id}`}
                                    key={agent.id}
                                >
                                    <Button size="icon" variant="outline">
                                        <Cog />
                                    </Button>
                                </NavLink>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
            </div>
          ) : (
            // If staked balance is zero, show Mint and StakeUnstake components.
            <>
              {!minted ? (
                <MintComponent />
              ) : (
                <StakeUnstake />
              )}
            </>
          )
        ) : (
          <p className="text-lg">Please connect your wallet.</p>
        )}
      </div>
    </div>
  );
}
