import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("CatalystCommons", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      // Contracts are deployed using the first signer/account by default
      const [owner, otherAccount] = await hre.ethers.getSigners();

      const CatalystCommons = await hre.ethers.getContractFactory(
        "CatalystCommons"
      );
      const catalystCommons = await CatalystCommons.deploy(
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        5,
        50,
        50
      );

      expect(await catalystCommons.gameToken()).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(await catalystCommons.hostAgent()).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(await catalystCommons.treasuryManager()).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(await catalystCommons.entryFee()).to.equal(5);
      expect(await catalystCommons.treasuryFeePercentage()).to.equal(50);
      expect(await catalystCommons.prizePoolPercentage()).to.equal(50);
    });
  });
});
