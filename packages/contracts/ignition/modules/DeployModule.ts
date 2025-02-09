// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { vars } from "hardhat/config";

const DeployModule = buildModule("DeployModule", (m) => {
  const nostraToken = m.contract("TestNostraToken", [10]);

  const entryFee = 10000;
  const burnPercent = 50;

  const stakingContract = m.contract(
    "StakingContract",
    [
      nostraToken,
      vars.get("DEPLOYER_PUBLIC_KEY"),
      vars.get("DEPLOYER_PUBLIC_KEY"),
      entryFee,
      burnPercent,
    ],
    {
      after: [nostraToken],
    }
  );

  return { stakingContract, nostraToken };
});

export default DeployModule;
