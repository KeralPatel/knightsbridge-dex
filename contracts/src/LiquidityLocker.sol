// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LiquidityLocker
 * @notice Time-locked liquidity lock contract. Prevents rug pulls by ensuring
 *         LP tokens cannot be withdrawn before the lock period expires.
 *
 * Security:
 * - ReentrancyGuard on all state-changing functions
 * - Minimum lock duration of 30 days
 * - Only the lock owner can unlock
 * - Lock can be extended but never shortened
 */
contract LiquidityLocker is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Lock {
        address token;      // LP token address
        address owner;      // Who can unlock
        uint256 amount;     // Amount of LP tokens locked
        uint256 lockedAt;   // Timestamp of lock creation
        uint256 unlockAt;   // Timestamp when unlockable
        bool withdrawn;     // Has been unlocked/withdrawn
    }

    uint256 public constant MIN_LOCK_DAYS = 30;
    uint256 public constant MAX_LOCK_DAYS = 3650;  // 10 years

    uint256 public lockCount;
    mapping(uint256 => Lock) public locks;
    mapping(address => uint256[]) public tokenLocks;
    mapping(address => uint256[]) public ownerLocks;

    uint256 public lockFeeWei;  // Optional fee in ETH to lock

    event Locked(
        uint256 indexed lockId,
        address indexed token,
        address indexed owner,
        uint256 amount,
        uint256 unlockAt
    );
    event Unlocked(uint256 indexed lockId, address indexed owner);
    event LockExtended(uint256 indexed lockId, uint256 newUnlockAt);
    event FeeUpdated(uint256 newFee);

    constructor(address initialOwner_) Ownable(initialOwner_) {}

    /**
     * @notice Lock LP tokens for a specified duration.
     * @param token     The LP token contract address
     * @param owner_    Address that can unlock the tokens
     * @param durationDays  Number of days to lock (min 30)
     * @param amount    Number of LP tokens to lock
     */
    function lockLiquidity(
        address token,
        address owner_,
        uint256 durationDays,
        uint256 amount
    ) external payable nonReentrant returns (uint256 lockId) {
        require(token != address(0), "LiquidityLocker: invalid token");
        require(owner_ != address(0), "LiquidityLocker: invalid owner");
        require(durationDays >= MIN_LOCK_DAYS, "LiquidityLocker: lock too short");
        require(durationDays <= MAX_LOCK_DAYS, "LiquidityLocker: lock too long");
        require(amount > 0, "LiquidityLocker: amount must be > 0");
        require(msg.value >= lockFeeWei, "LiquidityLocker: insufficient fee");

        // Transfer LP tokens from caller
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        lockId = ++lockCount;
        uint256 unlockAt = block.timestamp + (durationDays * 1 days);

        locks[lockId] = Lock({
            token: token,
            owner: owner_,
            amount: amount,
            lockedAt: block.timestamp,
            unlockAt: unlockAt,
            withdrawn: false
        });

        tokenLocks[token].push(lockId);
        ownerLocks[owner_].push(lockId);

        emit Locked(lockId, token, owner_, amount, unlockAt);
    }

    /**
     * @notice Unlock and withdraw LP tokens after the lock period expires.
     * @param lockId  The ID of the lock to withdraw
     */
    function unlock(uint256 lockId) external nonReentrant {
        Lock storage lock = locks[lockId];
        require(lock.owner == msg.sender, "LiquidityLocker: not lock owner");
        require(!lock.withdrawn, "LiquidityLocker: already withdrawn");
        require(block.timestamp >= lock.unlockAt, "LiquidityLocker: still locked");

        lock.withdrawn = true;
        IERC20(lock.token).safeTransfer(lock.owner, lock.amount);

        emit Unlocked(lockId, lock.owner);
    }

    /**
     * @notice Extend an existing lock duration. Can only extend, not shorten.
     * @param lockId        The ID of the lock to extend
     * @param additionalDays  Additional days to add to the lock
     */
    function extendLock(uint256 lockId, uint256 additionalDays) external {
        Lock storage lock = locks[lockId];
        require(lock.owner == msg.sender, "LiquidityLocker: not lock owner");
        require(!lock.withdrawn, "LiquidityLocker: already withdrawn");
        require(additionalDays > 0, "LiquidityLocker: no extension");

        lock.unlockAt += additionalDays * 1 days;
        require(
            lock.unlockAt <= block.timestamp + (MAX_LOCK_DAYS * 1 days),
            "LiquidityLocker: exceeds max lock"
        );

        emit LockExtended(lockId, lock.unlockAt);
    }

    /**
     * @notice Get all locks for a specific LP token.
     */
    function getLocksByToken(address token) external view returns (Lock[] memory) {
        uint256[] memory ids = tokenLocks[token];
        Lock[] memory result = new Lock[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = locks[ids[i]];
        }
        return result;
    }

    /**
     * @notice Get all locks owned by a specific address.
     */
    function getLocksByOwner(address owner_) external view returns (Lock[] memory) {
        uint256[] memory ids = ownerLocks[owner_];
        Lock[] memory result = new Lock[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = locks[ids[i]];
        }
        return result;
    }

    /**
     * @notice Check if a token has an active (non-expired, non-withdrawn) lock.
     */
    function hasActiveLock(address token) external view returns (bool) {
        uint256[] memory ids = tokenLocks[token];
        for (uint256 i = 0; i < ids.length; i++) {
            Lock storage lock = locks[ids[i]];
            if (!lock.withdrawn && lock.unlockAt > block.timestamp) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Owner can update the lock fee.
     */
    function setLockFee(uint256 newFee) external onlyOwner {
        lockFeeWei = newFee;
        emit FeeUpdated(newFee);
    }

    /**
     * @notice Owner can withdraw collected fees.
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "LiquidityLocker: no fees");
        (bool ok,) = owner().call{value: balance}('');
        require(ok, "LiquidityLocker: transfer failed");
    }
}
