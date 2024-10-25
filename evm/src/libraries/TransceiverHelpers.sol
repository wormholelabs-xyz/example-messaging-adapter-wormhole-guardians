// SPDX-License-Identifier: Apache 2
pragma solidity ^0.8.19;

/// @notice A fork has occurred.
/// @dev Selector: 0x77d879fb
/// @param evmChainId The configured EVM chain ID.
/// @param blockChainId The current EVM chain ID.
error InvalidFork(uint256 evmChainId, uint256 blockChainId);

// @dev Checks to see if a fork has occurred.
function checkFork(uint256 evmChainId) view {
    if (isFork(evmChainId)) {
        revert InvalidFork(evmChainId, block.chainid);
    }
}

// @dev Returns true if a fork has occurred.
function isFork(uint256 evmChainId) view returns (bool) {
    return evmChainId != block.chainid;
}
