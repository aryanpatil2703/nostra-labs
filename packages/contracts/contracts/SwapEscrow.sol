// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SwapEscrow is Ownable {
    IERC20 public testNostraToken; // Updated to TestNostraToken (tNST)
    IERC20 public usdcToken;

    uint256 public constant SWAP_RATIO = 1000; // 1000 tNST = 1 USDC

    event TokensSwapped(address indexed user, uint256 tNSTAmount, uint256 usdcReceived);
    event EscrowFunded(uint256 usdcAmount);

    constructor(address _testNostraToken, address _usdcToken) Ownable(msg.sender) {
        testNostraToken = IERC20(_testNostraToken); // tNST contract address
        usdcToken = IERC20(_usdcToken); // USDC contract address
    }

    /**
     * @notice Swap tNST for USDC based on the fixed SWAP_RATIO.
     * @param tNSTAmount Amount of tNST the user wants to swap.
     */
    function swap(uint256 tNSTAmount) external {
        require(tNSTAmount > 0, "Amount must be greater than zero");
        require(tNSTAmount % SWAP_RATIO == 0, "Amount must be a multiple of swap ratio");

        uint256 usdcAmount = tNSTAmount / SWAP_RATIO;
        require(usdcToken.balanceOf(address(this)) >= usdcAmount, "Insufficient USDC liquidity");

        require(testNostraToken.transferFrom(msg.sender, address(this), tNSTAmount), "Token transfer failed");
        require(usdcToken.transfer(msg.sender, usdcAmount), "USDC transfer failed");

        emit TokensSwapped(msg.sender, tNSTAmount, usdcAmount);
    }

    /**
     * @notice Fund the escrow contract with USDC for liquidity.
     * @param usdcAmount Amount of USDC to deposit.
     */
    function fundEscrow(uint256 usdcAmount) external onlyOwner {
        require(usdcToken.transferFrom(msg.sender, address(this), usdcAmount), "Funding transfer failed");
        emit EscrowFunded(usdcAmount);
    }

    /**
     * @notice Get the USDC balance of the contract.
     * @return uint256 Amount of USDC available in escrow.
     */
    function getEscrowBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
}
