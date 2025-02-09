#!/bin/bash

# Default network
NETWORK=""

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --network)
      NETWORK="$2"
      shift
      ;;
    *)
      echo "Unknown parameter passed: $1"
      exit 1
      ;;
  esac
  shift
done

# Check if network is specified
if [[ -z "$NETWORK" ]]; then
  echo "Error: --network option is required. Use --network mainnet or --network testnet."
  exit 1
fi

# Deploy based on the specified network
if [[ "$NETWORK" == "mainnet" ]]; then
  npx hardhat ignition deploy ignition/modules/DeployModule.ts --network baseMainnet --verify
  npx hardhat ignition deploy ignition/modules/DeployModule.ts --network arbitrumMainnet --verify
elif [[ "$NETWORK" == "testnet" ]]; then
  npx hardhat ignition deploy ignition/modules/DeployModule.ts --network baseSepolia --verify
  npx hardhat ignition deploy ignition/modules/DeployModule.ts --network arbitrumSepolia --verify
else
  echo "Error: Invalid network specified. Use --network mainnet or --network testnet."
  exit 1
fi
