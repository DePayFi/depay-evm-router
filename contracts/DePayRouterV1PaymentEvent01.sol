// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import './libraries/Helper.sol';

contract DePayRouterV1PaymentEvent01 {

  // The payment event.
  event Payment(
    address indexed sender,
    address payable indexed receiver
  );

  // Indicates that this plugin does not require delegate call
  bool public immutable delegate = false;

  function execute(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns(bool) {
    emit Payment(addresses[0], payable(addresses[addresses.length-1]));
  }
}
