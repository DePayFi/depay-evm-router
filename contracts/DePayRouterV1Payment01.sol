// SPDX-License-Identifier: MIT

pragma solidity >=0.8.6 <0.9.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import './libraries/Helper.sol';

contract DePayRouterV1Payment01 {

  // Address representating ETH (e.g. in payment routing paths)
  address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  // Indicates that this plugin requires delegate call
  bool public immutable delegate = true;

  event Payment(
    address indexed sender,
    address payable indexed receiver
  );

  function execute(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns(bool) {

    if(path[path.length-1] == ETH) {
      Helper.safeTransferETH(payable(addresses[addresses.length-1]), amounts[1]);
    } else {
      Helper.safeTransfer(path[path.length-1], payable(addresses[addresses.length-1]), amounts[1]);
    }

    return true;
  }
}
