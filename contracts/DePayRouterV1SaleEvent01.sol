// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import './libraries/Helper.sol';

contract DePayRouterV1SaleEvent01 {

  event Sale(
    address indexed buyer
  );

  // Indicates that this plugin does not require delegate call
  bool public immutable delegate = false;

  function execute(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns(bool) {
    emit Sale(addresses[0]);
  }
}
