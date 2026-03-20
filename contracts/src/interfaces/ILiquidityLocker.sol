// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILiquidityLocker {
    struct Lock {
        address token;
        address owner;
        uint256 amount;
        uint256 lockedAt;
        uint256 unlockAt;
        bool withdrawn;
    }

    function lockLiquidity(
        address token,
        address owner_,
        uint256 durationDays,
        uint256 amount
    ) external payable returns (uint256 lockId);

    function unlock(uint256 lockId) external;

    function extendLock(uint256 lockId, uint256 additionalDays) external;

    function getLocksByToken(address token) external view returns (Lock[] memory);

    function getLocksByOwner(address owner_) external view returns (Lock[] memory);

    function hasActiveLock(address token) external view returns (bool);
}
