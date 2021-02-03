// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";

// Prevents unwanted access to configuration in DePayPaymentsV1
// Potentially occuring through delegatecall(ing) plugins.
contract DePayPaymentsV1Configuration is Ownable {
  
  // List of approved plugins. Use approvePlugin to add new plugins.
  mapping (address => address) public approvedPlugins;

  // Approves the provided plugin.
  function approvePlugin(address plugin) external onlyOwner returns(bool) {
    approvedPlugins[plugin] = plugin;
    emit PluginApproved(plugin);
    return true;
  }

  // Event to emit newly approved plugins.
  event PluginApproved(
    address indexed pluginAddress
  );
}
