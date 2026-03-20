// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KnightsbridgeERC20
 * @notice Minimal fixed-supply ERC20 deployed by TokenFactory.
 *         Supply is minted entirely to the creator at deploy time.
 *         No further minting is possible after deployment.
 */
contract KnightsbridgeERC20 is ERC20, Ownable {
    address public immutable factory;
    address public immutable creator;
    bool public immutable isKnightsbridgeToken = true;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 supply_,
        address creator_
    ) ERC20(name_, symbol_) Ownable(creator_) {
        factory = msg.sender;
        creator = creator_;
        // Mint entire supply to creator
        _mint(creator_, supply_);
    }
}
