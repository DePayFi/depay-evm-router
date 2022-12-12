// SPDX-License-Identifier: MIT

pragma solidity >=0.8.6 <0.9.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import './interfaces/IDePayRouterV1Plugin.sol';
import './libraries/Helper.sol';

contract DePayRouterV1PaymentFeeWithEvent01 {

  // Address representating ETH (e.g. in payment routing paths)
  address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  // Indicates that this plugin requires delegate call
  bool public immutable delegate = true;

  // Address of the router to make sure nobody else 
  // can call the payment event
  address public immutable router;

  // Address of the event pluing
  address public immutable eventPlugin;

  // Pass the DePayRouterV1 address to make sure
  // only the original router can call this plugin.
  // Also pass the event plugin which will be called
  // together with the payment
  constructor (
    address _router,
    address _eventPlugin
  ) {
    router = _router;
    eventPlugin = _eventPlugin;
  }

  function execute(
    address[] calldata path,
    uint[] calldata amounts,
    address[] calldata addresses,
    string[] calldata data
  ) external payable returns(bool) {
    require(address(this) == router, 'Only the DePayRouterV1 can call this plugin!');

    // send the fee
    if(path[path.length-1] == ETH) {
      Helper.safeTransferETH(payable(addresses[addresses.length-2]), amounts[4]);
    } else {
      Helper.safeTransfer(path[path.length-1], payable(addresses[addresses.length-2]), amounts[4]);
    }

    // Emit the event by calling the event plugin
    (bool success, bytes memory returnData) = address(eventPlugin).call(abi.encodeWithSelector(
      IDePayRouterV1Plugin(eventPlugin).execute.selector, path, amounts, addresses, data
    ));
    Helper.verifyCallResult(success, returnData, 'Calling payment event plugin failed!');

    return true;
  }
}
