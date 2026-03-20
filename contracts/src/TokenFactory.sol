// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./KnightsbridgeERC20.sol";
import "./interfaces/ILiquidityLocker.sol";

/**
 * @title TokenFactory
 * @notice Creates new ERC20 tokens, locks initial liquidity, and tracks all
 *         tokens deployed through the Knightsbridge Launchpad.
 *
 * Security:
 * - ReentrancyGuard on deployToken
 * - Validates msg.value >= deployFee + liquidityEth
 * - Enforces minimum liquidity lock duration
 * - Owner can only change fee and withdraw fees — cannot touch user tokens
 */
contract TokenFactory is ReentrancyGuard, Ownable {
    ILiquidityLocker public immutable liquidityLocker;

    uint256 public deployFee;           // Fee to use Knightsbridge launchpad (ETH)
    uint256 public minLiquidityEth;     // Minimum initial liquidity required

    address[] public allTokens;
    mapping(address => address[]) public creatorTokens;
    mapping(address => bool) public isKnightsbridgeToken;

    event TokenDeployed(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        uint256 supply,
        uint256 chainId
    );
    event DeployFeeUpdated(uint256 oldFee, uint256 newFee);
    event MinLiquidityUpdated(uint256 oldMin, uint256 newMin);

    constructor(
        address locker_,
        address initialOwner_,
        uint256 deployFee_,
        uint256 minLiquidityEth_
    ) Ownable(initialOwner_) {
        require(locker_ != address(0), "TokenFactory: invalid locker");
        liquidityLocker = ILiquidityLocker(locker_);
        deployFee = deployFee_;
        minLiquidityEth = minLiquidityEth_;
    }

    /**
     * @notice Deploy a new ERC20 token and lock initial liquidity.
     *
     * @param name_             Token name
     * @param symbol_           Token symbol
     * @param supply_           Total token supply (in wei, 18 decimals)
     * @param lockDurationDays  How many days to lock liquidity (min 30)
     * @param liquidityEth_     Amount of ETH to send as initial liquidity
     *
     * msg.value must be >= deployFee + liquidityEth_
     */
    function deployToken(
        string calldata name_,
        string calldata symbol_,
        uint256 supply_,
        uint256 lockDurationDays,
        uint256 liquidityEth_
    ) external payable nonReentrant returns (address tokenAddress) {
        require(bytes(name_).length > 0 && bytes(name_).length <= 50, "TokenFactory: invalid name");
        require(bytes(symbol_).length > 0 && bytes(symbol_).length <= 10, "TokenFactory: invalid symbol");
        require(supply_ > 0, "TokenFactory: supply must be > 0");
        require(lockDurationDays >= 30, "TokenFactory: lock too short");
        require(liquidityEth_ >= minLiquidityEth, "TokenFactory: insufficient liquidity");
        require(msg.value >= deployFee + liquidityEth_, "TokenFactory: insufficient payment");

        // Deploy token
        KnightsbridgeERC20 token = new KnightsbridgeERC20(
            name_,
            symbol_,
            supply_,
            msg.sender
        );
        tokenAddress = address(token);

        // Track deployment
        allTokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);
        isKnightsbridgeToken[tokenAddress] = true;

        // Send liquidity ETH to locker (locker will manage LP token locking)
        // In production: this ETH would be paired with tokens on a DEX first,
        // then LP tokens would be sent to locker. For simplicity, we call locker directly.
        if (liquidityEth_ > 0) {
            // Forward ETH to locker for custody
            // The locker records this as locked liquidity for the token
            (bool ok,) = address(liquidityLocker).call{value: liquidityEth_}(
                abi.encodeWithSignature(
                    "lockEth(address,address,uint256)",
                    tokenAddress,
                    msg.sender,
                    lockDurationDays
                )
            );
            // Non-reverting — liquidity locking failure doesn't block token creation
            // In production, make this revert to enforce lock requirement
            if (!ok) {
                // Refund liquidity if lock fails
                (bool refund,) = msg.sender.call{value: liquidityEth_}('');
                require(refund, "TokenFactory: refund failed");
            }
        }

        // Refund excess payment
        uint256 excess = msg.value - deployFee - liquidityEth_;
        if (excess > 0) {
            (bool ok,) = msg.sender.call{value: excess}('');
            require(ok, "TokenFactory: refund failed");
        }

        emit TokenDeployed(tokenAddress, msg.sender, name_, symbol_, supply_, block.chainid);
    }

    /**
     * @notice Get all tokens created by a specific address.
     */
    function getCreatorTokens(address creator) external view returns (address[] memory) {
        return creatorTokens[creator];
    }

    /**
     * @notice Get all tokens deployed through this factory.
     */
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    /**
     * @notice Update the deploy fee. Only owner.
     */
    function setDeployFee(uint256 newFee) external onlyOwner {
        emit DeployFeeUpdated(deployFee, newFee);
        deployFee = newFee;
    }

    /**
     * @notice Update minimum liquidity requirement. Only owner.
     */
    function setMinLiquidity(uint256 newMin) external onlyOwner {
        emit MinLiquidityUpdated(minLiquidityEth, newMin);
        minLiquidityEth = newMin;
    }

    /**
     * @notice Withdraw collected deploy fees. Only owner.
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "TokenFactory: no fees");
        (bool ok,) = owner().call{value: balance}('');
        require(ok, "TokenFactory: withdrawal failed");
    }

    receive() external payable {}
}
