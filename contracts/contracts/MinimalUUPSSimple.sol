// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title MinimalUUPSSimple
 * @dev Variant of MinimalUUPS for independent deployments (without CREATE2 factory).
 * Uses msg.sender as owner instead of a hardcoded address, so the deployer
 * becomes the upgrade authority and can complete the full deployment without
 * coordinating with the ERC-8004 team.
 */
contract MinimalUUPSSimple is OwnableUpgradeable, UUPSUpgradeable {
    /// @dev Identity registry address stored at slot 0 (matches real implementations)
    address private _identityRegistry;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address identityRegistry_) public initializer {
        __Ownable_init(msg.sender);
        _identityRegistry = identityRegistry_;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function getVersion() external pure returns (string memory) {
        return "0.0.1";
    }
}
