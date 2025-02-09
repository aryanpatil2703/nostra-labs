import { useContractRead, useAccount } from 'wagmi';
import { StakingContractABI, StakingContractAddress } from '@/components/address-abi';

export function useStakedBalance() {
  // Retrieve the connected account using wagmi's useAccount hook.
  const { address } = useAccount();

  // Call the contract's "getStakedBalance" function using wagmi's useContractRead hook.
  const { data, isLoading, refetch } = useContractRead({
    // The contract address should be stored in an environment variable.
   
    address: process.env.StakingContractAddress as `0x${string}`,
    // Use the ABI from the imported artifact.
    abi: StakingContractABI,
    // Name of the contract function to call.
    functionName: 'getStakedBalance',
    // Pass the connected account as an argument only if available.
    args: address ? [address] : undefined,
    // Watch for updates on the value.
    
  });

  return {
    stakedBalance: data ? BigInt(data.toString()) : BigInt(0),
    isLoading,
    refetch,
  };
}
